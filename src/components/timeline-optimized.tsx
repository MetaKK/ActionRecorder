/**
 * Timeline 组件 - 优化版
 * 
 * 基于统一的 Timeline 系统
 * 
 * 特点：
 * - 纯UI渲染
 * - 动态渲染器
 * - 无限滚动
 * - 性能优化
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { TimelineItem } from '@/lib/timeline/types';
import { Clock, Loader2 } from 'lucide-react';
import { 
  useTimelineStore, 
  selectGroupedByDate,
  TimelineItemRenderer,
} from '@/lib/timeline';
import { formatDate, getDateLabel } from '@/lib/utils/date';

export function TimelineOptimized() {
  const loadItems = useTimelineStore(state => state.loadItems);
  const loadMore = useTimelineStore(state => state.loadMore);
  const loading = useTimelineStore(state => state.loading);
  const error = useTimelineStore(state => state.error);
  const hasMore = useTimelineStore(state => state.pagination.hasMore);
  const updateItem = useTimelineStore(state => state.updateItem);
  const deleteItem = useTimelineStore(state => state.deleteItem);
  
  // 直接使用原始的 entities 和 ids，避免复杂的 selector
  const entities = useTimelineStore(state => state.entities);
  const ids = useTimelineStore(state => state.ids);
  
  // 手动计算分组，避免 selector 的无限循环
  const groupedItems = useMemo(() => {
    const items = ids.map(id => entities[id]).filter(Boolean);
    const grouped = new Map();
    
    items.forEach(item => {
      const dateKey = item.dateKey;
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey).push(item);
    });
    
    return grouped;
  }, [entities, ids]);
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // 初始加载
  useEffect(() => {
    loadItems({ resetPagination: true });
  }, []); // 移除 loadItems 依赖，只在组件挂载时执行一次
  
  // 无限滚动
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(sentinelRef.current);
    
    return () => observer.disconnect();
  }, [loading, hasMore]); // 移除 loadMore 依赖
  
  // 错误状态
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400/10 to-pink-400/10">
          <Clock className="h-8 w-8 text-destructive/60" />
        </div>
        <h3 className="text-base font-medium text-foreground/80 mb-2">
          加载失败
        </h3>
        <p className="text-sm text-destructive/60">
          {error.message}
        </p>
      </div>
    );
  }
  
  // 空状态
  if (!loading && groupedItems.size === 0) {
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
      {/* 按日期分组的项 */}
      {Array.from(groupedItems.entries()).map(([dateKey, items]) => (
        <div key={dateKey} className="space-y-4">
          {/* 日期标题 */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/40">
            <div className="flex items-center gap-4">
              <h3 className="text-base font-semibold text-foreground/85">
                {formatDateLabel(dateKey)}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 font-medium text-xs">
                {items.length}
              </span>
            </div>
          </div>
          
          {/* 项列表 */}
          <div className="space-y-3">
            {items.map((item: TimelineItem) => (
              <TimelineItemRenderer
                key={item.id}
                item={item}
                onUpdate={(item) => updateItem(item.id, item)}
                onDelete={(id) => deleteItem(id)}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* 加载更多触发器 */}
      {hasMore && (
        <div ref={sentinelRef} className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground/60">
              加载更多...
            </p>
          </div>
        </div>
      )}
      
      {/* 加载完成提示 */}
      {!hasMore && groupedItems.size > 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground/50">
            已加载全部记录
          </p>
        </div>
      )}
    </div>
  );
}

// 辅助函数：格式化日期标签
function formatDateLabel(dateKey: string): string {
  const date = new Date(dateKey);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateKey === today) return '今天';
  if (dateKey === yesterday.toISOString().split('T')[0]) return '昨天';
  
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export default TimelineOptimized;

