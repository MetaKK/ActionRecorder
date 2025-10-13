'use client';

import { RecordInput } from "@/components/record-input";
import { Timeline } from "@/components/timeline";
import { ExportDialog } from "@/components/export-dialog";
import { TechBackground } from "@/components/tech-background";
import { siteConfig } from "@/config/site";

export default function Home() {
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

        {/* 录入区域 - 无卡片，直接展示 */}
        <div className="mb-16">
          <RecordInput />
          <div className="mt-6">
            <ExportDialog />
          </div>
        </div>

        {/* 简洁分割 */}
        <div className="mb-12">
          <h2 className="text-sm font-medium text-muted-foreground/60 tracking-wide uppercase mb-6">
            Timeline
          </h2>
        </div>

        {/* 时间线 */}
        <main>
          <Timeline />
        </main>
        
        {/* 底部间距 */}
        <div className="h-24" />
      </div>
    </div>
  );
}
