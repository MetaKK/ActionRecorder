/**
 * 时间线展示组件
 * 性能优化：渐进式加载，一次只渲染部分记录
 */

'use client';

import { useMemo } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { TimelineItem } from './timeline-item';
import { ExportDialog } from './export-dialog';
import { useRecords } from '@/lib/hooks/use-records';
import { useProgressiveLoading } from '@/lib/hooks/use-intersection-observer';
import { groupByDate, formatDate, getDateLabel } from '@/lib/utils/date';

export function Timeline() {
  const { records } = useRecords();
  
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
  
  // 空状态
  if (records.length === 0) {
    return (
      <div className="space-y-6">
        {/* Timeline 标题栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/20 to-cyan-400/20">
              <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Timeline</h2>
              <p className="text-xs text-muted-foreground/70">0 条记录</p>
            </div>
          </div>
          <div className="w-full sm:w-32">
            <ExportDialog />
          </div>
        </div>
        
        {/* 空状态提示 */}
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
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Timeline 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/20 to-cyan-400/20">
            <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Timeline</h2>
            <p className="text-xs text-muted-foreground/70">{records.length} 条记录</p>
          </div>
        </div>
        <div className="w-full sm:w-32">
          <ExportDialog />
        </div>
      </div>

      {/* 记录内容 */}
      <div className="space-y-8">
        {visibleSortedGroups.map(([dateKey, items]) => {
          const dateLabel = getDateLabel(items[0].createdAt);
          
          return (
            <div key={dateKey} className="space-y-4">
              {/* 日期标题 */}
              <div className="flex items-center gap-4 pb-3 border-b border-border/40">
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
              
              {/* 记录列表 */}
              <div className="space-y-3">
                {items
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map((record) => (
                    <TimelineItem key={record.id} record={record} />
                  ))}
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

