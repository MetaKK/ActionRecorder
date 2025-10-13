/**
 * 导出对话框组件
 */

'use client';

import { useState, useMemo } from 'react';
import { Download, Copy, Check } from 'lucide-react';
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
  formatRecordsAsMarkdown,
  copyToClipboard,
  downloadAsTextFile,
} from '@/lib/utils/export';
import { formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';

const TIME_RANGES: Array<{ value: ExportTimeRange; label: string }> = [
  { value: 'today', label: '今天' },
  { value: '7days', label: '最近7天' },
  { value: '30days', label: '最近30天' },
  { value: 'all', label: '全部' },
];

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<ExportTimeRange>('all');
  const [copied, setCopied] = useState(false);
  
  const { records } = useRecords();
  
  // 生成导出内容
  const exportContent = useMemo(() => {
    return formatRecordsAsMarkdown(records, selectedRange);
  }, [records, selectedRange]);
  
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
      const filename = `生活记录_${formatDate(new Date())}.md`;
      downloadAsTextFile(exportContent, filename);
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
          className="w-full h-10 rounded-lg border border-border/40 hover:bg-accent/50 transition-all text-sm font-normal"
        >
          <Download className="mr-2 h-4 w-4" />
          导出记录
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>导出生活记录</DialogTitle>
          <DialogDescription>
            选择时间范围，导出为 Markdown 格式，方便与 AI 对话时使用
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 时间范围选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">时间范围</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedRange === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* 预览内容 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="text-sm font-medium mb-2">预览</label>
            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-4 h-full overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                  {exportContent}
                </pre>
              </CardContent>
            </Card>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleCopy}
              disabled={records.length === 0}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  复制到剪贴板
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleDownload}
              disabled={records.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              下载文件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

