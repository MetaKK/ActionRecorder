/**
 * 统计模块 - 存储空间和使用情况展示
 * 设计参考：Notion、Linear、Arc Browser
 */

'use client';

import { useStorageStats } from '@/lib/hooks/use-storage-stats';
import { FileText, Mic, Image as ImageIcon, Video, HardDrive, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Statistics() {
  const { stats, isLoading } = useStorageStats();
  
  if (isLoading || !stats) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/50 rounded-lg w-1/3"></div>
          <div className="h-32 bg-muted/50 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-muted/50 rounded-xl"></div>
            <div className="h-24 bg-muted/50 rounded-xl"></div>
            <div className="h-24 bg-muted/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-12">
      {/* 标题 - 极简 Apple 风格 */}
      <div>
        <h1 className="text-[2.5rem] font-bold tracking-tight text-foreground leading-none mb-2">
          统计
        </h1>
        <p className="text-sm text-muted-foreground/50">
          {stats.totalRecords} 条记录，{stats.usedSpaceFormatted} 已使用
        </p>
      </div>
      
      {/* 存储空间卡片 */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-6 shadow-lg backdrop-blur-sm">
        {/* 装饰性光晕 */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/10 via-blue-400/10 to-cyan-400/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-violet-400/10 via-purple-400/10 to-fuchsia-400/10 blur-3xl"></div>
        
        <div className="relative space-y-4">
          {/* 标题和数值 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-blue-500/20 backdrop-blur-sm">
                <HardDrive className="h-5 w-5 text-sky-600 dark:text-sky-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">存储空间</h3>
                <p className="text-2xl font-bold tracking-tight">
                  {stats.usedSpaceFormatted}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    / {stats.totalSpaceFormatted}
                  </span>
                </p>
              </div>
            </div>
            
            {/* 百分比 */}
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {stats.usagePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">已使用</div>
            </div>
          </div>
          
          {/* 进度条 - 科技感设计 */}
          <div className="space-y-2">
            <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 backdrop-blur-sm">
              {/* 进度条背景光效 */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-sky-400/20 via-blue-400/20 to-cyan-400/20"
                style={{ width: `${stats.usagePercentage}%` }}
              ></div>
              
              {/* 主进度条 */}
              <div 
                className="absolute inset-0 h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 shadow-lg shadow-sky-500/30 transition-all duration-700 ease-out"
                style={{ width: `${stats.usagePercentage}%` }}
              >
                {/* 高光效果 */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full"></div>
                {/* 动画光点 */}
                <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-r from-transparent to-white/50 rounded-r-full animate-pulse"></div>
              </div>
            </div>
            
            {/* 容量提示 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>可用 {((stats.totalSpace - stats.usedSpace) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                本周 +{stats.recordsThisWeek} 条记录
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 记录类型统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="文本"
          value={stats.textRecords}
          total={stats.totalRecords}
          gradient="from-sky-400/15 to-blue-500/15"
          iconGradient="from-sky-400 to-blue-500"
          iconBg="bg-sky-400/10"
          suffix="条记录"
        />
        
        <StatCard
          icon={Mic}
          label="音频"
          value={stats.audioRecords}
          total={stats.totalRecords}
          gradient="from-violet-400/15 to-purple-500/15"
          iconGradient="from-violet-400 to-purple-500"
          iconBg="bg-violet-400/10"
          suffix="条记录"
        />
        
        <StatCard
          icon={ImageIcon}
          label="图片"
          value={stats.imageRecords}
          total={stats.totalRecords}
          gradient="from-emerald-400/15 to-green-500/15"
          iconGradient="from-emerald-400 to-green-500"
          iconBg="bg-emerald-400/10"
          suffix="条记录"
          extra={stats.totalImages > stats.imageRecords ? `共 ${stats.totalImages} 张` : undefined}
        />
        
        <StatCard
          icon={Video}
          label="视频"
          value={stats.videoRecords}
          total={stats.totalRecords}
          gradient="from-rose-400/15 to-pink-500/15"
          iconGradient="from-rose-400 to-pink-500"
          iconBg="bg-rose-400/10"
          suffix="条记录"
          extra={stats.totalVideos > stats.videoRecords ? `共 ${stats.totalVideos} 个` : undefined}
        />
      </div>
      
      {/* 活动统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActivityCard
          label="总记录"
          value={stats.totalRecords}
          description="全部记录数量"
        />
        
        <ActivityCard
          label="本周活跃"
          value={stats.recordsThisWeek}
          description="最近 7 天"
        />
        
        <ActivityCard
          label="本月活跃"
          value={stats.recordsThisMonth}
          description="最近 30 天"
        />
      </div>
    </div>
  );
}

/**
 * 统计卡片组件
 */
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
  gradient: string;
  iconGradient: string;
  iconBg: string;
  suffix?: string;      // 后缀文本，如 "条记录"
  extra?: string;       // 额外信息，如 "共 10 张"
}

function StatCard({ icon: Icon, label, value, total, gradient, iconGradient, iconBg, suffix, extra }: StatCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br",
      gradient,
      "p-4 backdrop-blur-sm transition-all duration-300",
      "hover:border-border/50 hover:shadow-lg hover:scale-[1.02]",
      "cursor-default"
    )}>
      {/* 装饰光晕 */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl transition-opacity group-hover:opacity-100 opacity-0"></div>
      
      <div className="relative space-y-3">
        {/* 图标和标签 */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconBg,
            "backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
          )}>
            <Icon className={cn(
              "h-4 w-4 bg-gradient-to-br bg-clip-text text-transparent",
              iconGradient
            )} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        
        {/* 数值和后缀 */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {suffix && (
              <span className="text-sm text-muted-foreground/70">{suffix}</span>
            )}
          </div>
          
          {/* 额外信息 */}
          {extra && (
            <div className="mt-0.5 text-xs text-muted-foreground/60">
              {extra}
            </div>
          )}
          
          {/* 百分比进度条 */}
          {total > 0 && value > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-background/50">
                <div 
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    iconGradient
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-muted-foreground/80 min-w-[2.5rem] text-right">
                {percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 活动卡片组件
 */
interface ActivityCardProps {
  label: string;
  value: number;
  description: string;
}

function ActivityCard({ label, value, description }: ActivityCardProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border/30",
      "bg-gradient-to-br from-background via-background to-muted/10",
      "p-4 backdrop-blur-sm transition-all duration-300",
      "hover:border-border/50 hover:shadow-md",
      "cursor-default"
    )}>
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {value}
        </div>
        <div className="text-xs text-muted-foreground/70">{description}</div>
      </div>
      
      {/* Hover 光效 */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400/0 via-blue-400/0 to-cyan-400/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
    </div>
  );
}

