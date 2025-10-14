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
      <div className="space-y-8">
        {/* Timeline 标题栏 - Apple 风格优化 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6">
          {/* 左侧标题区 */}
          <div className="flex items-center gap-4">
            {/* 图标容器 - 更精致的毛玻璃效果 */}
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200/40 dark:border-sky-800/40 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 to-transparent dark:from-white/5 dark:to-transparent" />
              <Clock className="relative h-5 w-5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
            </div>
            
            {/* 标题和统计 */}
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Timeline
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums tracking-tighter text-foreground">
                  0
                </span>
                <span className="text-sm font-medium text-muted-foreground/60">
                  条记录
                </span>
              </div>
            </div>
          </div>
          
          {/* 右侧操作区 */}
          <div className="w-full sm:w-auto">
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
    <div className="space-y-8">
      {/* Timeline 标题栏 - Apple 风格优化 */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6">
        {/* 左侧标题区 */}
        <div className="flex items-center gap-4">
          {/* 图标容器 - 更精致的毛玻璃效果 */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200/40 dark:border-sky-800/40 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 to-transparent dark:from-white/5 dark:to-transparent" />
            <Clock className="relative h-5 w-5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
          </div>
          
          {/* 标题和统计 */}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Timeline
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums tracking-tighter text-foreground">
                {records.length}
              </span>
              <span className="text-sm font-medium text-muted-foreground/60">
                条记录
              </span>
            </div>
          </div>
        </div>
        
        {/* 右侧操作区 */}
        <div className="w-full sm:w-auto">
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

