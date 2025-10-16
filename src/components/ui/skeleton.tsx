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
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40",
        "bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]",
        className
      )}
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
    <div className="relative mb-4 flex flex-col items-center w-full text-center md:mb-6">
      {/* Hero Section 骨架 */}
      <div className="flex w-full flex-col items-center justify-center gap-2"></div>
      
      {/* 主标题骨架 */}
      <div className="mb-2 flex items-center gap-1 text-3xl font-medium leading-none text-foreground sm:text-3xl md:mb-2.5 md:gap-0 md:text-5xl px-4">
        <Skeleton className="h-8 w-64 md:h-12 md:w-80" />
      </div>
      
      {/* 副标题骨架 */}
      <div className="mb-6 max-w-[25ch] text-center text-lg leading-tight text-foreground/65 md:max-w-full md:text-xl px-4">
        <Skeleton className="h-5 w-48 md:h-6 md:w-64 mx-auto" />
      </div>
      
      {/* 输入框骨架 - 添加边距 */}
      <div className="relative w-full px-4">
        <div className="group flex flex-col gap-4 p-5 md:p-6 w-full rounded-[32px] border border-border/40 bg-muted/30 shadow-xl">
          {/* 输入框主体 */}
          <div className="relative flex flex-1 items-center">
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
          
          {/* 底部按钮栏骨架 */}
          <div className="flex gap-1.5 md:gap-2 flex-wrap items-center">
            {/* 左侧按钮组 */}
            <div className="flex gap-1.5 md:gap-2 items-center">
              <Skeleton className="h-11 w-11 md:h-10 md:w-10 rounded-full" />
              <Skeleton className="h-11 w-11 md:h-10 md:w-10 rounded-full" />
              <Skeleton className="h-11 w-11 md:h-10 md:w-10 rounded-full" />
            </div>
            
            {/* 右侧按钮组 */}
            <div className="ml-auto flex items-center gap-1.5 md:gap-2">
              <Skeleton className="h-4 w-8 hidden md:inline" />
              <Skeleton className="h-11 w-11 md:h-10 md:w-10 rounded-full" />
              <Skeleton className="h-11 w-11 md:h-10 md:w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * App Header 骨架屏
 */
export function AppHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo 区域 */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          {/* 导航区域 */}
          <div className="hidden md:flex items-center gap-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-18" />
          </div>
          
          {/* 右侧按钮 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * AI Chat 按钮骨架屏
 */
export function AIChatButtonSkeleton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 思考泡泡骨架 */}
      <div className="relative">
        <div className="relative px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 shadow-lg">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* AI 头像骨架 */}
      <div className="relative w-[56px] h-[56px]">
        <Skeleton className="w-[56px] h-[56px] rounded-full" />
      </div>
    </div>
  );
}

