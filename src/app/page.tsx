'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Clock, BarChart3 } from 'lucide-react';
import { TabNav, TabItem } from "@/components/tab-nav";
import { useRecords } from "@/lib/hooks/use-records";
// 移除静态导入，改为动态导入
import { ExportDialog } from "@/components/export-dialog";
import { EnglishPromptDialog } from "@/components/english-prompt-dialog";
import { ImportDialog } from "@/components/import-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
// 移除静态导入，改为动态导入
import { 
  TimelineSkeleton, 
  StatisticsSkeleton, 
  RecordInputSkeleton,
  AIChatButtonSkeleton,
  AppHeaderSkeleton
} from "@/components/ui/skeleton";
import { initMobileZoomFix } from "@/lib/utils/mobile-zoom-fix";

// 动态导入重型组件，提高首屏加载速度
const RecordInput = dynamic(
  () => import("@/components/record-input").then(mod => ({ default: mod.RecordInput })),
  { 
    loading: () => <RecordInputSkeleton />,
    ssr: false // 输入组件不需要SSR
  }
);

const Timeline = dynamic(
  () => import("@/components/timeline").then(mod => ({ default: mod.Timeline })),
  { 
    loading: () => <TimelineSkeleton />,
    ssr: false
  }
);

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('timeline');
  const { records } = useRecords();
  
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

  // Tab 配置 - 核心功能
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
          onTabChange={setActiveTab}
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

        {/* Tab 内容 */}
        <main>
          {activeTab === 'timeline' && (
            <ErrorBoundary>
              <div className="animate-in fade-in duration-300">
                <Timeline />
              </div>
            </ErrorBoundary>
          )}
          
          {activeTab === 'statistics' && (
            <ErrorBoundary>
              <div className="animate-in fade-in duration-300">
                <Statistics />
              </div>
            </ErrorBoundary>
          )}
        </main>
      </div>
      
      {/* AI Chat Button - 右下角固定按钮 */}
      <AIChatButton />
    </div>
  );
}
