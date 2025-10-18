'use client';

import { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Clock, BarChart3 } from 'lucide-react';
import { TabNav, TabItem } from "@/components/tab-nav";
import { useRecords } from "@/lib/hooks/use-records";
import { useOptimizedNavigation } from "@/lib/hooks/use-optimized-navigation";
import { TabContentRenderer } from "@/components/optimized-tab-content";
import { isDebugEnabled } from "@/lib/utils/env";
import { useDebugContext } from "@/lib/contexts/debug-context";
// 移除静态导入，改为动态导入
import { ExportDialog } from "@/components/export-dialog";
import { EnglishPromptDialog } from "@/components/english-prompt-dialog";
import { ImportDialog } from "@/components/import-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
import { TimelineSkeleton } from "@/components/timeline-skeleton";
import { StatisticsSkeleton } from "@/components/statistics-skeleton";
// 移除静态导入，改为动态导入
import { 
  RecordInputSkeleton,
  AIChatButtonSkeleton,
  AppHeaderSkeleton
} from "@/components/ui/skeleton";
import { initMobileZoomFix } from "@/lib/utils/mobile-zoom-fix";

// 优化：预加载关键组件，提升路由切换性能
const RecordInput = dynamic(
  () => import("@/components/record-input").then(mod => ({ default: mod.RecordInput })),
  { 
    loading: () => <RecordInputSkeleton />,
    ssr: false // 输入组件不需要SSR
  }
);

// 预加载Timeline组件（最重要的组件）
const Timeline = dynamic(
  () => import("@/components/timeline").then(mod => ({ default: mod.Timeline })),
  { 
    loading: () => <TimelineSkeleton />,
    ssr: false
  }
);

// 延迟加载Statistics组件，但提供预加载机制
const Statistics = dynamic(
  () => import("@/components/statistics").then(mod => ({ default: mod.Statistics })),
  { 
    loading: () => <StatisticsSkeleton />,
    ssr: false
  }
);

const TechBackground = dynamic(
  () => import("@/components/tech-background").then(mod => ({ default: mod.TechBackground })),
  { 
    ssr: true // 背景可以SSR
  }
);

// App Header 动态导入
const AppHeader = dynamic(
  () => import("@/components/app-header").then(mod => ({ default: mod.AppHeader })),
  { 
    loading: () => <AppHeaderSkeleton />,
    ssr: true // Header 可以SSR
  }
);

// AI Chat 按钮动态导入
const AIChatButton = dynamic(
  () => import("@/components/ai/ai-chat-button").then(mod => ({ default: mod.AIChatButton })),
  { 
    loading: () => <AIChatButtonSkeleton />,
    ssr: false // AI 按钮不需要SSR
  }
);

// 调试面板已移至全局布局 (src/app/layout.tsx)

export default function Home() {
  const { records } = useRecords();
  const { updateDebugInfo } = useDebugContext();
  
  // 使用优化的导航系统
  const {
    activeTab,
    isLoading,
    transitionDirection,
    switchTab
  } = useOptimizedNavigation({
    defaultTab: 'timeline',
    preloadTabs: ['timeline'], // 预加载Timeline
    enableSmoothTransitions: true,
    cacheStrategy: 'smart'
  });

  // 更新调试信息
  useEffect(() => {
    updateDebugInfo({
      activeTab,
      isLoading,
      recordsCount: records.length,
      transitionDirection
    });
  }, [activeTab, isLoading, records.length, transitionDirection, updateDebugInfo]);
  
  // 初始化移动端防放大功能
  useEffect(() => {
    initMobileZoomFix({
      enabled: true,
      fontSizeThreshold: 16,
      forceRestore: true,
      dynamicViewport: true,
      iosSpecialHandling: true
    });
  }, []);

  // Tab 配置 - 核心功能（优化：减少重新计算）
  const tabs: TabItem[] = useMemo(() => [
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <Clock className="h-5 w-5" />,
      count: records.length,
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ], [records.length]);

  return (
    <div className="relative min-h-screen">
      {/* 科技感背景 */}
      <TechBackground />
      
      {/* Header - Apple 风格 */}
      <AppHeader />
      
      {/* Hero Section - Lovable 风格垂直居中 */}
      <section className="mb-[20px] flex w-full flex-col items-center justify-center py-[20vh] md:mb-0 2xl:py-64">
        <ErrorBoundary>
          <RecordInput />
        </ErrorBoundary>
      </section>

      {/* Tab 导航和内容区域 */}
      <div className="relative mx-auto max-w-4xl px-6 pb-24 sm:px-8">
        {/* Tab 导航 - Apple 风格 */}
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={switchTab}
        />

        {/* 工具栏 - Apple 风格：仅在 Timeline 标签显示 */}
        {activeTab === 'timeline' && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{records.length} 条记录</span>
            </div>
            <div className="flex items-center gap-2">
              <EnglishPromptDialog />
              <ImportDialog />
              <ExportDialog />
            </div>
          </div>
        )}

        {/* 优化的Tab内容 - Apple风格过渡 */}
        <main>
          <TabContentRenderer
            activeTab={activeTab}
            isLoading={isLoading}
            transitionDirection={transitionDirection}
            recordsCount={records.length}
          />
        </main>
      </div>
      
      {/* AI Chat Button - 右下角固定按钮 */}
      <AIChatButton />
    </div>
  );
}
