/**
 * 时间线展示组件
 * 性能优化：渐进式加载，一次只渲染部分记录
 * 集成日记：在对应日期显示日记卡片
 */

'use client';

import { useMemo, useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { TimelineItem } from './timeline-item';
import { DiaryCard } from './diary-card';
import { useRecords } from '@/lib/hooks/use-records';
import { useProgressiveLoading } from '@/lib/hooks/use-intersection-observer';
import { groupByDate, formatDate, getDateLabel } from '@/lib/utils/date';
import { getAllDiaries, debugDatabase, clearDatabase } from '@/lib/storage/diary-db';
import { DiaryPreview } from '@/lib/ai/diary/types';
import { Record } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function Timeline() {
  const { records } = useRecords();
  const router = useRouter();
  const [diaries, setDiaries] = useState<DiaryPreview[]>([]);
  
  // 加载日记列表
  useEffect(() => {
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    try {
      // 先调试数据库状态
      await debugDatabase();
      
      const allDiaries = await getAllDiaries();
      setDiaries(allDiaries);
    } catch (error) {
      console.error('Failed to load diaries:', error);
      
      // 如果加载失败，尝试清理数据库
      try {
        console.log('🔄 Attempting to clear database and retry...');
        await clearDatabase();
        const retryDiaries = await getAllDiaries();
        setDiaries(retryDiaries);
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError);
      }
    }
  };
  
  // 按日期分组
  // 渐进式加载：初始显示 15 条，每次加载 10 条
  const { visibleCount, sentinelRef, hasMore } = useProgressiveLoading(
    records.length,
    15 // 初始批次大小
  );
  
  // 计算需要显示的记录
  const visibleRecords = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    return sorted.slice(0, visibleCount);
  }, [records, visibleCount]);
  
  // 对可见记录进行分组
  const visibleGroupedRecords = useMemo(() => {
    return groupByDate(visibleRecords);
  }, [visibleRecords]);
  
  const visibleSortedGroups = useMemo(() => {
    return Array.from(visibleGroupedRecords.entries()).sort(
      ([dateA], [dateB]) => dateB.localeCompare(dateA)
    );
  }, [visibleGroupedRecords]);

  // 创建日期到日记列表的映射（支持多篇日记）
  const diaryMap = useMemo(() => {
    const map = new Map<string, DiaryPreview[]>();
    diaries.forEach(diary => {
      const existingDiaries = map.get(diary.date) || [];
      existingDiaries.push(diary);
      map.set(diary.date, existingDiaries);
    });
    // 对每天的日记按创建时间排序，置顶的在前
    map.forEach((dayDiaries) => {
      dayDiaries.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    });
    return map;
  }, [diaries]);

  const handleEditDiary = (id: string) => {
    router.push(`/ai/diary/${id}`);
  };

  const handleShareDiary = (id: string) => {
    // TODO: 实现分享功能
    console.log('Share diary:', id);
  };

  const handleExportDiary = (id: string) => {
    // TODO: 实现导出功能
    console.log('Export diary:', id);
  };

  const handleDeleteDiary = async (id: string) => {
    try {
      const { deleteDiary } = await import('@/lib/storage/diary-db');
      await deleteDiary(id);
      console.log('✅ Diary deleted:', id);
      // 重新加载日记列表
      await loadDiaries();
    } catch (error) {
      console.error('❌ Failed to delete diary:', error);
      alert('删除日记失败，请重试');
    }
  };
  
  // 空状态
  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/10 to-cyan-400/10">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-medium text-foreground/80 mb-2">
          还没有记录
        </h3>
        <p className="text-sm text-muted-foreground/60">
          开始记录您的生活吧
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* 记录内容 */}
      <div className="space-y-8">
        {visibleSortedGroups.map(([dateKey, items]) => {
          const dateLabel = getDateLabel(items[0].createdAt);
          
          return (
            <div key={dateKey} className="space-y-4">
              {/* 日期标题 */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/40">
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-foreground/85">
                    {dateLabel}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground/60">
                      {formatDate(items[0].createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                      {items.length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 混合内容：日记 + 记录，按时间排序 */}
              <div className="space-y-3">
                {(() => {
                  // 获取当天的所有日记
                  const dayDiaries = diaryMap.get(dateKey) || [];
                  
                  // 创建混合数组：日记 + 记录
                  const mixedItems: Array<{ type: 'diary' | 'record'; id: string; data: unknown; createdAt: Date }> = [];
                  
                  // 添加所有日记
                  dayDiaries.forEach(diary => {
                    // 使用日记的实际创建时间
                    const diaryTime = diary.createdAt || diary.generatedAt || new Date(diary.date + 'T20:00:00');
                    mixedItems.push({
                      type: 'diary' as const,
                      id: diary.id,
                      createdAt: diaryTime,
                      data: diary
                    });
                  });
                  
                  // 添加记录
                  items.forEach(record => {
                    mixedItems.push({
                      type: 'record' as const,
                      id: record.id,
                      createdAt: record.createdAt,
                      data: record
                    });
                  });
                  
                  // 按时间排序（最新的在前）
                  mixedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                  
                  // 渲染混合内容
                  return mixedItems.map((item) => {
                    if (item.type === 'diary') {
                      return (
                        <DiaryCard
                          key={`diary-${item.id}`}
                          diary={item.data as DiaryPreview}
                          onEdit={handleEditDiary}
                          onShare={handleShareDiary}
                          onExport={handleExportDiary}
                          onDelete={handleDeleteDiary}
                        />
                      );
                    } else {
                      return (
                        <TimelineItem key={item.id} record={item.data as unknown as Record} />
                      );
                    }
                  });
                })()}
              </div>
            </div>
          );
        })}
        
        {/* 加载更多触发器（哨兵元素） */}
        {hasMore && (
          <div ref={sentinelRef} className="py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground/60">
                加载更多记录... ({visibleCount} / {records.length})
              </p>
            </div>
          </div>
        )}
        
        {/* 加载完成提示 */}
        {!hasMore && records.length > 15 && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground/50">
              已加载全部 {records.length} 条记录
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

