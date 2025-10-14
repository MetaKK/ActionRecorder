'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Clock, BarChart3 } from 'lucide-react';
import { TabNav, TabItem } from "@/components/tab-nav";
import { useRecords } from "@/lib/hooks/use-records";
import { AppHeader } from "@/components/app-header";
import { ExportDialog } from "@/components/export-dialog";
import { 
  TimelineSkeleton, 
  StatisticsSkeleton, 
  RecordInputSkeleton 
} from "@/components/ui/skeleton";

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('timeline');
  const { records } = useRecords();

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
        <RecordInput />
      </section>

      {/* Tab 导航和内容区域 */}
      <div className="relative mx-auto max-w-4xl px-6 pb-24 sm:px-8">
        {/* Tab 导航 - Apple 风格融合：Tab + 右侧操作 */}
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rightAction={activeTab === 'timeline' ? <ExportDialog /> : undefined}
        />

        {/* Tab 内容 */}
        <main>
          {activeTab === 'timeline' && (
            <div className="animate-in fade-in duration-300">
              <Timeline />
            </div>
          )}
          
          {activeTab === 'statistics' && (
            <div className="animate-in fade-in duration-300">
              <Statistics />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
