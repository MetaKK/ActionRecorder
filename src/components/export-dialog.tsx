/**
 * 导出对话框组件
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Copy, Check, HardDrive } from 'lucide-react';
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
import { getStorageInfo, cleanupOldRecords } from '@/lib/utils/storage';
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
  const [storageInfo, setStorageInfo] = useState({
    totalRecords: 0,
    totalSize: 0,
    audioRecords: 0,
    audioSize: 0,
  });
  
  const { records } = useRecords();
  
  // 更新存储信息
  useEffect(() => {
    if (open) {
      const info = getStorageInfo();
      setStorageInfo(info);
    }
  }, [open, records]);
  
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
  
  // 清理旧记录
  const handleCleanup = () => {
    const result = cleanupOldRecords(30);
    if (result.deleted > 0) {
      const freedMB = (result.freedSize / 1024 / 1024).toFixed(2);
      toast.success(`已清理 ${result.deleted} 条旧记录，释放 ${freedMB} MB 空间`);
      // 更新存储信息
      const info = getStorageInfo();
      setStorageInfo(info);
    } else {
      toast.info('没有需要清理的记录');
    }
  };
  
  // 格式化存储大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className="w-full h-9 rounded-xl border border-cyan-300/30 bg-gradient-to-br from-sky-400/5 to-cyan-400/5 hover:from-sky-400/15 hover:to-cyan-400/15 hover:border-cyan-400/50 hover:shadow-md hover:shadow-cyan-400/10 transition-all text-sm font-medium text-cyan-700 dark:text-cyan-400"
        >
          <Download className="mr-2 h-4 w-4" />
          导出
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
          {/* 存储信息 */}
          <Card className="bg-gradient-to-r from-sky-400/10 to-cyan-400/10 border-cyan-400/25">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">存储使用情况</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanup}
                  className="h-7 text-xs"
                >
                  清理30天前
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground">总记录数</div>
                  <div className="font-mono font-semibold">{storageInfo.totalRecords} 条</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">总大小</div>
                  <div className="font-mono font-semibold">{formatSize(storageInfo.totalSize)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">音频记录</div>
                  <div className="font-mono font-semibold">{storageInfo.audioRecords} 条</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">音频大小</div>
                  <div className="font-mono font-semibold">{formatSize(storageInfo.audioSize)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
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

