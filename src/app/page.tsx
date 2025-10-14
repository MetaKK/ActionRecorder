'use client';

import { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Clock, BarChart3 } from 'lucide-react';
import { TabNav, TabItem } from "@/components/tab-nav";
import { useRecords } from "@/lib/hooks/use-records";
import { siteConfig } from "@/config/site";
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
      
      <div className="relative mx-auto max-w-4xl px-6 py-8 sm:px-8 sm:py-12">
        {/* Header - Notion 风格极简 */}
        <header className="mb-12">
          <h1 className="text-[2.5rem] font-semibold tracking-tight text-foreground leading-tight">
            {siteConfig.name}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground/80">
            {siteConfig.description}
          </p>
        </header>

        {/* 录入区域 - Lovable 风格 */}
        <div className="mb-16">
          <RecordInput />
        </div>

        {/* Tab 导航 - ElevenLabs 风格 */}
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
        
        {/* 底部间距 */}
        <div className="h-24" />
      </div>
    </div>
  );
}
