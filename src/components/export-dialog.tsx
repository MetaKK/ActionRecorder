/**
 * 导出对话框组件 - 多模态内容导出
 */

'use client';

import { useState, useMemo } from 'react';
import { Download, Copy, Check, FileText, FileJson, FileCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecords } from '@/lib/hooks/use-records';
import { ExportTimeRange } from '@/lib/types';
import {
  ExportFormat,
  exportRecords,
  copyToClipboard,
  downloadAsFile,
  generateFilename,
} from '@/lib/utils/export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TIME_RANGES: Array<{ value: ExportTimeRange; label: string; desc: string }> = [
  { value: 'today', label: '今天', desc: '仅今天的记录' },
  { value: '7days', label: '最近7天', desc: '一周内的记录' },
  { value: '30days', label: '最近30天', desc: '一个月内的记录' },
  { value: 'all', label: '全部', desc: '所有历史记录' },
];

const EXPORT_FORMATS: Array<{ 
  value: ExportFormat; 
  label: string; 
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  activeGradient: string;
  iconBg: string;
}> = [
  { 
    value: 'text', 
    label: '纯文本', 
    desc: 'AI对话友好，简洁清晰',
    icon: <FileText className="h-4 w-4" />,
    gradient: 'from-sky-400/8 via-blue-400/8 to-cyan-400/8',
    activeGradient: 'from-sky-400/15 via-blue-400/15 to-cyan-400/15',
    iconBg: 'bg-gradient-to-br from-sky-400 to-blue-500',
  },
  { 
    value: 'markdown', 
    label: 'Markdown', 
    desc: '文档格式，富文本支持',
    icon: <FileCode className="h-4 w-4" />,
    gradient: 'from-violet-400/8 via-purple-400/8 to-fuchsia-400/8',
    activeGradient: 'from-violet-400/15 via-purple-400/15 to-fuchsia-400/15',
    iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
  },
  { 
    value: 'json', 
    label: 'JSON', 
    desc: '完整数据，适合备份',
    icon: <FileJson className="h-4 w-4" />,
    gradient: 'from-emerald-400/8 via-green-400/8 to-teal-400/8',
    activeGradient: 'from-emerald-400/15 via-green-400/15 to-teal-400/15',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
  },
];

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<ExportTimeRange>('all');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('text');
  const [copied, setCopied] = useState(false);
  
  const { records } = useRecords();
  
  // 生成导出内容
  const exportContent = useMemo(() => {
    return exportRecords(records, selectedRange, selectedFormat);
  }, [records, selectedRange, selectedFormat]);
  
  // 复制到剪贴板
  const handleCopy = async () => {
    try {
      await copyToClipboard(exportContent);
      setCopied(true);
      toast.success('已复制到剪贴板');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error('复制失败，请重试');
    }
  };
  
  // 下载为文件
  const handleDownload = () => {
    try {
      const filename = generateFilename(selectedFormat);
      downloadAsFile(exportContent, filename, selectedFormat);
      toast.success('下载成功');
    } catch {
      toast.error('下载失败，请重试');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className={cn(
            "group relative w-full h-9 rounded-xl font-medium transition-all duration-300",
            "border border-cyan-400/30 backdrop-blur-sm",
            "bg-gradient-to-br from-sky-400/8 via-blue-400/8 to-cyan-400/8",
            "hover:from-sky-400/20 hover:via-blue-400/20 hover:to-cyan-400/20",
            "hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20",
            "hover:scale-[1.02] active:scale-[0.98]",
            "text-cyan-700 dark:text-cyan-400"
          )}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Download className="mr-2 h-4 w-4" strokeWidth={2.5} />
          <span className="relative">导出</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>导出生活记录</DialogTitle>
          <DialogDescription>
            支持多种格式导出，包含文本、音频、图片等多模态内容
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 flex-1 overflow-hidden flex flex-col">
          {/* 导出格式选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground/90">导出格式</label>
            <div className="grid grid-cols-3 gap-3">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={cn(
                    "group relative flex flex-col items-start gap-3 rounded-2xl p-4 transition-all duration-300",
                    "border backdrop-blur-sm",
                    selectedFormat === format.value
                      ? [
                          "border-white/20 shadow-xl",
                          `bg-gradient-to-br ${format.activeGradient}`,
                          "scale-[1.02]",
                        ]
                      : [
                          "border-border/30 bg-background/50",
                          "hover:border-border/50 hover:shadow-lg hover:scale-[1.01]",
                          `hover:bg-gradient-to-br hover:${format.gradient}`,
                        ]
                  )}
                >
                  {/* 图标 */}
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-all duration-300",
                    "text-white",
                    selectedFormat === format.value
                      ? [format.iconBg, "shadow-2xl scale-110"]
                      : ["bg-muted/80 text-muted-foreground", "group-hover:scale-105"]
                  )}>
                    {format.icon}
                  </div>
                  
                  {/* 文本内容 */}
                  <div className="flex flex-col items-start gap-1 flex-1 w-full">
                    <span className={cn(
                      "text-sm font-semibold transition-colors",
                      selectedFormat === format.value ? "text-foreground" : "text-foreground/75"
                    )}>
                      {format.label}
                    </span>
                    <span className="text-xs text-muted-foreground/80 leading-tight">
                      {format.desc}
                    </span>
                  </div>
                  
                  {/* 选中指示器 */}
                  {selectedFormat === format.value && (
                    <div className="absolute right-3 top-3 animate-in zoom-in duration-200">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg shadow-cyan-400/50">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                  
                  {/* 光晕效果 */}
                  {selectedFormat === format.value && (
                    <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-sky-400/20 to-cyan-400/20 blur-xl" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* 时间范围选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground/90">时间范围</label>
            <div className="grid grid-cols-4 gap-2.5">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setSelectedRange(range.value)}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-3 transition-all duration-300",
                    "border backdrop-blur-sm",
                    selectedRange === range.value
                      ? [
                          "border-cyan-400/40 bg-gradient-to-br from-sky-400/12 via-blue-400/12 to-cyan-400/12",
                          "shadow-lg shadow-cyan-400/10",
                          "scale-[1.03]",
                        ]
                      : [
                          "border-border/30 bg-background/50",
                          "hover:border-cyan-300/40 hover:bg-gradient-to-br hover:from-sky-400/5 hover:to-cyan-400/5",
                          "hover:shadow-md hover:scale-[1.02]",
                        ]
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold transition-colors",
                    selectedRange === range.value 
                      ? "text-foreground" 
                      : "text-foreground/70 group-hover:text-foreground/85"
                  )}>
                    {range.label}
                  </span>
                  <span className={cn(
                    "text-xs leading-tight transition-colors",
                    selectedRange === range.value
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70 group-hover:text-muted-foreground/90"
                  )}>
                    {range.desc}
                  </span>
                  
                  {/* 选中下划线 */}
                  {selectedRange === range.value && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 animate-in slide-in-from-bottom-1 duration-200" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* 预览内容 */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground/90">内容预览</label>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-400/10 to-cyan-400/10 border border-cyan-400/20">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 animate-pulse" />
                <span className="text-xs font-medium text-cyan-700 dark:text-cyan-400">
                  {records.length} 条记录
                </span>
              </div>
            </div>
            <Card className="flex-1 overflow-hidden min-h-0 border-border/40 bg-gradient-to-br from-muted/30 to-muted/50 backdrop-blur-sm shadow-inner">
              <CardContent className="p-0 h-full overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed p-5 text-foreground/85">
                  {exportContent || (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/60">
                      <FileText className="h-12 w-12" />
                      <span className="text-sm">暂无记录</span>
                    </div>
                  )}
                </pre>
              </CardContent>
            </Card>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-3 pt-3">
            <Button
              onClick={handleCopy}
              disabled={records.length === 0}
              className={cn(
                "group relative flex-1 h-12 rounded-xl font-semibold transition-all duration-300",
                "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500",
                "hover:from-sky-600 hover:via-blue-600 hover:to-cyan-600",
                "hover:shadow-xl hover:shadow-sky-500/30 hover:scale-[1.02]",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                copied && "from-emerald-500 via-green-500 to-teal-500"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  复制到剪贴板
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={records.length === 0}
              className={cn(
                "group relative flex-1 h-12 rounded-xl font-semibold transition-all duration-300",
                "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
                "hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600",
                "hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Download className="mr-2 h-4 w-4" strokeWidth={2.5} />
              下载文件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

