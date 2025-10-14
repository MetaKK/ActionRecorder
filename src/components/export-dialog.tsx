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

const TIME_RANGES: Array<{ value: ExportTimeRange; label: string }> = [
  { value: 'today', label: '今天' },
  { value: '7days', label: '7天' },
  { value: '30days', label: '30天' },
  { value: 'all', label: '全部' },
];

const EXPORT_FORMATS: Array<{ 
  value: ExportFormat; 
  label: string;
  icon: React.ReactNode;
  gradient: string;
  activeGradient: string;
  iconBg: string;
}> = [
  { 
    value: 'text', 
    label: 'Text',
    icon: <FileText className="h-4 w-4" />,
    gradient: 'from-sky-400/8 via-blue-400/8 to-cyan-400/8',
    activeGradient: 'from-sky-400/15 via-blue-400/15 to-cyan-400/15',
    iconBg: 'bg-gradient-to-br from-sky-400 to-blue-500',
  },
  { 
    value: 'markdown', 
    label: 'Markdown',
    icon: <FileCode className="h-4 w-4" />,
    gradient: 'from-violet-400/8 via-purple-400/8 to-fuchsia-400/8',
    activeGradient: 'from-violet-400/15 via-purple-400/15 to-fuchsia-400/15',
    iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
  },
  { 
    value: 'json', 
    label: 'JSON',
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">导出记录</DialogTitle>
          <DialogDescription className="text-xs">
            选择格式和时间范围
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
          {/* 顶部选项区 - 响应式布局 */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
            {/* 导出格式选择 */}
            <div className="flex items-center gap-2 relative z-10">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">格式</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {EXPORT_FORMATS.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value)}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300",
                      "border backdrop-blur-sm shrink-0",
                      selectedFormat === format.value
                        ? [
                            "border-white/20 shadow-lg",
                            `bg-gradient-to-br ${format.activeGradient}`,
                            "scale-[1.02]",
                          ]
                        : [
                            "border-border/30 bg-background/50",
                            "hover:border-border/50 hover:shadow-md hover:scale-[1.01]",
                            `hover:bg-gradient-to-br hover:${format.gradient}`,
                          ]
                    )}
                  >
                    {/* 图标 */}
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg shadow-md transition-all duration-300",
                      selectedFormat === format.value
                        ? [format.iconBg, "text-white shadow-lg"]
                        : ["bg-muted/60 text-muted-foreground", "group-hover:scale-105"]
                    )}>
                      {format.icon}
                    </div>
                    
                    {/* 文本 */}
                    <span className={cn(
                      "text-xs font-semibold transition-colors whitespace-nowrap",
                      selectedFormat === format.value ? "text-foreground" : "text-foreground/70"
                    )}>
                      {format.label}
                    </span>
                    
                    {/* 光晕效果 */}
                    {selectedFormat === format.value && (
                      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-sky-400/15 to-cyan-400/15 blur-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 分隔线 - 桌面端显示 */}
            <div className="hidden md:block h-6 w-px bg-border/40" />
            
            {/* 时间范围选择 */}
            <div className="flex items-center gap-2 relative z-10">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">时间</label>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedRange(range.value)}
                    className={cn(
                      "relative flex items-center justify-center rounded-lg px-3 py-1.5 transition-all duration-300",
                      "border backdrop-blur-sm shrink-0",
                      selectedRange === range.value
                        ? [
                            "border-cyan-400/40 bg-gradient-to-br from-sky-400/12 via-blue-400/12 to-cyan-400/12",
                            "shadow-md shadow-cyan-400/10",
                            "scale-[1.05]",
                          ]
                        : [
                            "border-border/30 bg-background/50",
                            "hover:border-cyan-300/40 hover:bg-gradient-to-br hover:from-sky-400/5 hover:to-cyan-400/5",
                            "hover:scale-[1.02]",
                          ]
                    )}
                  >
                    <span className={cn(
                      "text-xs font-semibold transition-colors whitespace-nowrap",
                      selectedRange === range.value 
                        ? "text-foreground" 
                        : "text-foreground/70"
                    )}>
                      {range.label}
                    </span>
                    
                    {/* 选中下划线 */}
                    {selectedRange === range.value && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 预览内容 */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">
                  {records.length} 条记录
                </span>
              </div>
            </div>
            <Card className="flex-1 overflow-hidden min-h-0 border-border/30 bg-gradient-to-br from-muted/20 to-muted/40 backdrop-blur-sm shadow-inner">
              <CardContent className="p-0 h-full overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed p-4 text-foreground/80">
                  {exportContent || (
                    <div className="flex flex-col items-center justify-center h-full gap-2.5 text-muted-foreground/50">
                      <FileText className="h-10 w-10" />
                      <span className="text-xs">暂无记录</span>
                    </div>
                  )}
                </pre>
              </CardContent>
            </Card>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2.5 pt-4 border-t border-border/30 mt-4">
            <Button
              onClick={handleCopy}
              disabled={records.length === 0}
              className={cn(
                "group relative flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-300",
                "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500",
                "hover:from-sky-600 hover:via-blue-600 hover:to-cyan-600",
                "hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.01]",
                "active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                copied && "from-emerald-500 via-green-500 to-teal-500"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                  复制
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={records.length === 0}
              className={cn(
                "group relative flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-300",
                "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
                "hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600",
                "hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.01]",
                "active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Download className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
              下载
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

