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
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 mb-6 shadow-sm">
          <span className="text-4xl">📝</span>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          还没有记录
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          开始使用语音或文本记录您的日常生活<br />
          让 AI 更好地了解您 ✨
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-10">
      {sortedGroups.map(([dateKey, items]) => {
        const dateLabel = getDateLabel(items[0].createdAt);
        
        return (
          <div key={dateKey} className="space-y-4">
            {/* 日期标题 */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-transparent pb-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2 flex-1">
                  <h2 className="text-base font-bold text-foreground">
                    {dateLabel}
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDate(items[0].createdAt)}
                  </span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {items.length} 条
                </span>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-3 rounded-full" />
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

