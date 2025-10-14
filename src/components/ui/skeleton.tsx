/**
 * 骨架屏组件 - 用于加载状态
 */

import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  );
}

/**
 * Timeline 骨架屏
 */
export function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {/* 标题栏骨架 */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* 记录列表骨架 */}
      <div className="space-y-8">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4">
            {/* 日期标题 */}
            <div className="flex items-center gap-4 pb-3 border-b border-border/40">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            
            {/* 记录项 */}
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border/30 bg-gradient-to-br from-background/50 to-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Statistics 骨架屏
 */
export function StatisticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      {/* 存储空间卡片 */}
      <Skeleton className="h-40 rounded-2xl" />

      {/* 记录类型统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* 活动统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * 输入框骨架屏
 */
export function RecordInputSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative w-full">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

