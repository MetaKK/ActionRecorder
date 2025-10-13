/**
 * 时间线展示组件
 */

'use client';

import { useMemo } from 'react';
import { TimelineItem } from './timeline-item';
import { useRecords } from '@/lib/hooks/use-records';
import { groupByDate, formatDate, getDateLabel } from '@/lib/utils/date';

export function Timeline() {
  const { records } = useRecords();
  
  // 按日期分组
  const groupedRecords = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    return groupByDate(sorted);
  }, [records]);
  
  // 按日期排序（最新的在前）
  const sortedGroups = useMemo(() => {
    return Array.from(groupedRecords.entries()).sort(
      ([dateA], [dateB]) => dateB.localeCompare(dateA)
    );
  }, [groupedRecords]);
  
  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          还没有记录
        </h3>
        <p className="text-sm text-muted-foreground">
          点击上方按钮开始记录您的生活
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {sortedGroups.map(([dateKey, items]) => {
        const dateLabel = getDateLabel(items[0].createdAt);
        
        return (
          <div key={dateKey} className="space-y-3">
            {/* 日期标题 */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {dateLabel}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {formatDate(items[0].createdAt)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {items.length} 条记录
                </span>
              </div>
              <div className="h-px bg-border mt-2" />
            </div>
            
            {/* 记录列表 */}
            <div className="space-y-2">
              {items
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((record) => (
                  <TimelineItem key={record.id} record={record} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

