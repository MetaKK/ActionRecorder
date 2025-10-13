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
          <div key={dateKey} className="space-y-3">
            {/* 日期标题 - Notion 风格极简 */}
            <div className="flex items-baseline gap-3 pb-2">
              <h2 className="text-sm font-medium text-foreground/70">
                {dateLabel}
              </h2>
              <span className="text-xs text-muted-foreground/50">
                {formatDate(items[0].createdAt)}
              </span>
              <span className="text-xs text-muted-foreground/40">
                {items.length} 条
              </span>
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

