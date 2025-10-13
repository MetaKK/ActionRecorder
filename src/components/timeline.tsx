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
        <p className="text-sm text-muted-foreground/60">
          还没有记录，开始记录您的生活吧
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {sortedGroups.map(([dateKey, items]) => {
        const dateLabel = getDateLabel(items[0].createdAt);
        
        return (
          <div key={dateKey} className="space-y-4">
            {/* 日期标题 - Lovable 风格优雅 */}
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
    </div>
  );
}

