'use client';

import { RecordInput } from "@/components/record-input";
import { Timeline } from "@/components/timeline";
import { ExportDialog } from "@/components/export-dialog";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {/* 头部 */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-primary/10">
            <span className="text-3xl">🎤</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl bg-clip-text">
            {siteConfig.name}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
            {siteConfig.description}
          </p>
        </header>

        {/* 录入区域 - 卡片样式 */}
        <div className="mb-10">
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 sm:p-8">
            <RecordInput />
          </div>
          <div className="mt-4">
            <ExportDialog />
          </div>
        </div>

        {/* 分割线 - 更优雅 */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground font-medium">记录历史</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* 时间线 */}
        <main>
          <Timeline />
        </main>
        
        {/* 底部间距 */}
        <div className="h-20" />
      </div>
    </div>
  );
}
