'use client';

import { useState, useMemo } from 'react';
import { Clock, BarChart3, Download, Heart, Star, Zap, Globe, TrendingUp, Calendar, Settings } from 'lucide-react';
import { RecordInput } from "@/components/record-input";
import { Timeline } from "@/components/timeline";
import { ExportPanel } from "@/components/export-panel";
import { TechBackground } from "@/components/tech-background";
import { TabNav, TabItem } from "@/components/tab-nav";
import { useRecords } from "@/lib/hooks/use-records";
import { siteConfig } from "@/config/site";

export default function Home() {
  const [activeTab, setActiveTab] = useState('timeline');
  const { records } = useRecords();

  // Tab 配置 - 添加更多测试Tab
  const tabs: TabItem[] = useMemo(() => [
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <Clock className="h-5 w-5" />,
      count: records.length,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Heart className="h-5 w-5" />,
      count: 12,
    },
    {
      id: 'highlights',
      label: 'Highlights',
      icon: <Star className="h-5 w-5" />,
      count: 8,
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Globe className="h-5 w-5" />,
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: <TrendingUp className="h-5 w-5" />,
      count: 3,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-5 w-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
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
          
          {activeTab === 'export' && (
            <div className="animate-in fade-in duration-300">
              <div className="max-w-3xl mx-auto">
                <ExportPanel />
              </div>
            </div>
          )}
          
          {/* 其他Tab的占位内容 */}
          {['favorites', 'highlights', 'insights', 'explore', 'statistics', 'trends', 'calendar', 'settings'].includes(activeTab) && (
            <div className="animate-in fade-in duration-300">
              <div className="rounded-xl border border-border/30 bg-muted/30 p-8 text-center">
                <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4 flex items-center justify-center">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 capitalize">
                  {activeTab} Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'favorites' && '收藏功能即将上线'}
                  {activeTab === 'highlights' && '精彩内容即将上线'}
                  {activeTab === 'insights' && '智能洞察即将上线'}
                  {activeTab === 'explore' && '探索功能即将上线'}
                  {activeTab === 'statistics' && '数据统计功能即将上线'}
                  {activeTab === 'trends' && '趋势分析即将上线'}
                  {activeTab === 'calendar' && '日历视图即将上线'}
                  {activeTab === 'settings' && '设置功能即将上线'}
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
