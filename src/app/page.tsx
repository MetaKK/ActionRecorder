'use client';

import { useState, useMemo } from 'react';
import { Clock, BarChart3 } from 'lucide-react';
import { RecordInput } from "@/components/record-input";
import { Timeline } from "@/components/timeline";
import { TechBackground } from "@/components/tech-background";
import { TabNav, TabItem } from "@/components/tab-nav";
import { useRecords } from "@/lib/hooks/use-records";
import { siteConfig } from "@/config/site";

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
              <div className="rounded-xl border border-border/30 bg-muted/30 p-8 text-center">
                <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Statistics Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  数据统计功能即将上线
                </p>
              </div>
            </div>
          )}
        </main>
        
        {/* 底部间距 */}
        <div className="h-24" />
      </div>
    </div>
  );
}
