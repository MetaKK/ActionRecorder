/**
 * 导出面板组件 - 用于 Tab 中展示
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Copy, Check, HardDrive } from 'lucide-react';
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

export function ExportPanel() {
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
    const info = getStorageInfo();
    setStorageInfo(info);
  }, [records]);
  
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
    <div className="space-y-6">
      {/* 存储信息 */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-base font-semibold text-blue-700 dark:text-blue-300">存储使用情况</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              className="h-8 text-xs"
            >
              清理30天前
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">总记录数</div>
              <div className="font-mono font-semibold text-lg">{storageInfo.totalRecords} 条</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">总大小</div>
              <div className="font-mono font-semibold text-lg">{formatSize(storageInfo.totalSize)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">音频记录</div>
              <div className="font-mono font-semibold text-lg">{storageInfo.audioRecords} 条</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">音频大小</div>
              <div className="font-mono font-semibold text-lg">{formatSize(storageInfo.audioSize)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 时间范围选择 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">选择时间范围</label>
        <div className="grid grid-cols-4 gap-2">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
              className="transition-all"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* 预览内容 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">内容预览</label>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto p-4 bg-muted/30">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                {exportContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button
          onClick={handleCopy}
          disabled={records.length === 0}
          className="flex-1 gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              复制内容
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={records.length === 0}
          className="flex-1 gap-2"
        >
          <Download className="h-4 w-4" />
          下载文件
        </Button>
      </div>
    </div>
  );
}

