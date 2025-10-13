'use client';

import { RecordInput } from "@/components/record-input";
import { Timeline } from "@/components/timeline";
import { ExportDialog } from "@/components/export-dialog";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* 头部 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {siteConfig.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </header>

        {/* 录入区域 */}
        <div className="mb-8 space-y-4">
          <RecordInput />
          <ExportDialog />
        </div>

        {/* 分割线 */}
        <div className="my-8 h-px bg-border" />

        {/* 时间线 */}
        <main>
          <Timeline />
        </main>
      </div>
    </div>
  );
}
