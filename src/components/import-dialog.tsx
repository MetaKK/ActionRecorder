/**
 * 导入记录对话框组件
 * 支持导入其他timeline记录并有序穿插到当前timeline中
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Upload, FileText, Clock, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRecords } from '@/lib/hooks/use-records';
import { getStorage } from '@/lib/storage/simple';
import { useRecordsStore } from '@/lib/stores/records-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportRecord {
  id: string;
  content: Record<string, unknown>;
  timestamp: number;
  type: string;
  source: string;
}

interface ImportDialogProps {
  trigger?: React.ReactNode;
}

export function ImportDialog({ trigger }: ImportDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [importedRecords, setImportedRecords] = useState<ImportRecord[]>([]);
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { records, addRecord } = useRecords();
  const loadFromStorage = useRecordsStore(state => state.loadFromStorage);

  // 解析导出记录格式数据
  const parseExportData = useCallback((data: string): ImportRecord[] => {
    const lines = data.split('\n');
    const records: ImportRecord[] = [];
    let currentDate = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行和分隔线
      if (!line || line.startsWith('─')) {
        continue;
      }

      // 检查是否是日期标题 (格式: 2025-10-18 (今天) 或 2025-10-17 (昨天))
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s+\((.+)\)$/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        continue;
      }

      // 检查是否是时间戳记录 (格式: [09:34] 内容)
      const timeMatch = line.match(/^\[(\d{2}:\d{2})\]\s*(.+)$/);
      if (timeMatch && currentDate) {
        const [, timeStr, content] = timeMatch;
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // 正确解析日期：使用 YYYY-MM-DD 格式
        const [year, month, day] = currentDate.split('-').map(Number);
        const recordDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        // 如果时间看起来是跨天的（比如凌晨时间），调整到前一天
        if (hours < 6) {
          recordDate.setDate(recordDate.getDate() - 1);
        }

        records.push({
          id: `imported-${Date.now()}-${records.length}`,
          content: { text: content.trim() },
          timestamp: recordDate.getTime(),
          type: 'text',
          source: 'imported'
        });
      }
    }

    return records;
  }, []);

  // 解析Markdown格式数据
  const parseMarkdownData = useCallback((data: string): ImportRecord[] => {
    const lines = data.split('\n');
    const records: ImportRecord[] = [];
    let currentRecord: { title: string; content: string; timestamp: number } | null = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // 新记录开始
        if (currentRecord) {
          records.push({
            id: `imported-${Date.now()}-${records.length}`,
            content: { text: currentRecord.content },
            timestamp: currentRecord.timestamp,
            type: 'text',
            source: 'imported'
          });
        }
        currentRecord = {
          title: line.replace('## ', ''),
          content: '',
          timestamp: Date.now()
        };
      } else if (currentRecord && line.trim()) {
        currentRecord.content += line + '\n';
      }
    }

    // 添加最后一个记录
    if (currentRecord) {
      records.push({
        id: `imported-${Date.now()}-${records.length}`,
        content: { text: currentRecord.content.trim() },
        timestamp: currentRecord.timestamp,
        type: 'text',
        source: 'imported'
      });
    }

    return records;
  }, []);

  // 解析导入数据
  const parseImportData = useCallback((data: string): ImportRecord[] => {
    try {
      // 尝试解析为JSON格式
      const jsonData = JSON.parse(data);
      if (Array.isArray(jsonData)) {
        return jsonData.map((record: Record<string, unknown>, index: number) => ({
          id: (record.id as string) || `imported-${Date.now()}-${index}`,
          content: record.content as Record<string, unknown>,
          timestamp: (record.timestamp as number) || Date.now(),
          type: (record.type as string) || 'text',
          source: 'imported'
        }));
      }
    } catch {
      // 如果不是JSON，尝试解析为导出记录格式
      const exportRecords = parseExportData(data);
      if (exportRecords.length > 0) {
        return exportRecords;
      }
      
      // 如果导出格式解析失败，尝试解析为Markdown格式
      return parseMarkdownData(data);
    }
    return [];
  }, [parseExportData, parseMarkdownData]);

  // 处理文件导入
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsedRecords = parseImportData(text);
      setImportedRecords(parsedRecords);
      toast.success(`成功解析 ${parsedRecords.length} 条记录`);
    } catch (error) {
      console.error('文件解析失败:', error);
      toast.error('文件格式不正确，请检查文件内容');
    } finally {
      setIsProcessing(false);
    }
  }, [parseImportData]);

  // 处理文本导入
  const handleTextImport = useCallback(() => {
    if (!importText.trim()) {
      toast.error('请输入要导入的内容');
      return;
    }

    setIsProcessing(true);
    try {
      const parsedRecords = parseImportData(importText);
      setImportedRecords(parsedRecords);
      toast.success(`成功解析 ${parsedRecords.length} 条记录`);
    } catch (error) {
      console.error('文本解析失败:', error);
      toast.error('文本格式不正确，请检查内容格式');
    } finally {
      setIsProcessing(false);
    }
  }, [importText, parseImportData]);

  // 确认导入
  const handleConfirmImport = useCallback(async () => {
    if (importedRecords.length === 0) {
      toast.error('没有可导入的记录');
      return;
    }

    setIsProcessing(true);
    
    try {
      const storage = await getStorage();
      
      // 按时间戳降序排序（最新的在前）
      const sortedRecords = [...importedRecords].sort((a, b) => b.timestamp - a.timestamp);
      
      // 计算近7天的时间戳
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      // 分离近7天的数据和历史数据
      const recentRecords = sortedRecords.filter(r => r.timestamp >= sevenDaysAgo);
      const historicalRecords = sortedRecords.filter(r => r.timestamp < sevenDaysAgo);
      
      // 第一步：立即导入近7天的数据
      let importedCount = 0;
      for (const record of recentRecords) {
        const contentText = typeof record.content === 'object' 
          ? (record.content.text as string) || JSON.stringify(record.content)
          : (record.content as string);
        
        const newRecord = {
          id: record.id,
          content: contentText,
          timestamp: record.timestamp,
          createdAt: new Date(record.timestamp),
          updatedAt: new Date(record.timestamp),
        };
        
        await storage.saveRecord(newRecord);
        importedCount++;
      }
      
      // 刷新状态，让Timeline立即显示新数据
      await loadFromStorage();
      
      // 关闭对话框，让用户立即看到近期数据
      setOpen(false);
      setImportedRecords([]);
      setImportText('');
      setIsProcessing(false);
      
      // 显示近期数据导入成功
      if (recentRecords.length > 0) {
        toast.success(`已导入 ${recentRecords.length} 条近期记录`);
      }
      
      // 第二步：在后台分批导入历史数据
      if (historicalRecords.length > 0) {
        const toastId = toast.loading(`正在后台导入 ${historicalRecords.length} 条历史记录...`);
        
        // 使用 setTimeout 确保不阻塞 UI
        setTimeout(async () => {
          try {
            const BATCH_SIZE = 50; // 每批处理50条
            let processed = 0;
            
            for (let i = 0; i < historicalRecords.length; i += BATCH_SIZE) {
              const batch = historicalRecords.slice(i, i + BATCH_SIZE);
              
              for (const record of batch) {
                const contentText = typeof record.content === 'object' 
                  ? (record.content.text as string) || JSON.stringify(record.content)
                  : (record.content as string);
                
                const newRecord = {
                  id: record.id,
                  content: contentText,
                  timestamp: record.timestamp,
                  createdAt: new Date(record.timestamp),
                  updatedAt: new Date(record.timestamp),
                };
                
                await storage.saveRecord(newRecord);
                processed++;
              }
              
              // 每批处理后稍作延迟，避免阻塞
              if (i + BATCH_SIZE < historicalRecords.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            // 后台导入完成后也刷新状态
            await loadFromStorage();
            toast.success(`所有记录导入完成！共 ${importedCount + processed} 条`, { id: toastId });
          } catch (error) {
            console.error('后台导入失败:', error);
            toast.error('部分历史记录导入失败', { id: toastId });
          }
        }, 100);
      } else {
        toast.success(`成功导入 ${importedCount} 条记录`);
      }
      
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
      setIsProcessing(false);
    }
  }, [importedRecords]);

  // 清除导入数据
  const handleClearImport = useCallback(() => {
    setImportedRecords([]);
    setImportText('');
  }, []);

  // 预览导入记录
  const previewRecords = useMemo(() => {
    return importedRecords.slice(0, 5); // 只显示前5条
  }, [importedRecords]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            className={cn(
              // iOS 风格的图标按钮 - 极简设计
              "group relative flex items-center justify-center",
              "h-9 w-9 rounded-full",
              "transition-all duration-200 ease-out",
              
              // 背景 - 轻量毛玻璃
              "bg-black/[0.03] dark:bg-white/[0.06]",
              "hover:bg-black/[0.06] dark:hover:bg-white/[0.09]",
              "active:bg-black/[0.08] dark:active:bg-white/[0.12]",
              
              // 焦点环
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/20",
              
              // 激活缩放
              "active:scale-95"
            )}
            aria-label="导入记录"
          >
            <Upload 
              className="h-[18px] w-[18px] text-foreground/70 transition-transform duration-200 group-hover:scale-105" 
              strokeWidth={2}
            />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            导入记录
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            从文件或文本导入您的生活记录，支持导出记录、Markdown 或 JSON 格式。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
          {/* 导入方式选择 */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={importMethod === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMethod('file')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              文件导入
            </Button>
            <Button
              variant={importMethod === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMethod('text')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              文本导入
            </Button>
          </div>

          {/* 文件导入区域 */}
          {importMethod === 'file' && (
            <div className="mb-6">
              <label className="block mb-3 text-sm font-medium text-foreground">
                选择文件
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".json,.md,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                  id="file-import"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="file-import"
                  className={cn(
                    "cursor-pointer flex flex-col items-center gap-3",
                    isProcessing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">点击选择文件</p>
                    <p className="text-xs text-muted-foreground">
                      支持 JSON、Markdown、TXT 格式
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 文本导入区域 */}
          {importMethod === 'text' && (
            <div className="mb-6">
              <label className="block mb-3 text-sm font-medium text-foreground">
                粘贴内容
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="粘贴要导入的记录内容..."
                className="w-full h-32 px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isProcessing}
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleTextImport}
                  disabled={!importText.trim() || isProcessing}
                  size="sm"
                >
                  {isProcessing ? '解析中...' : '解析内容'}
                </Button>
              </div>
            </div>
          )}

          {/* 预览区域 */}
          {importedRecords.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">
                  预览导入记录 ({importedRecords.length} 条)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearImport}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  清除
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previewRecords.map((record, index) => (
                  <Card key={record.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">
                          {typeof record.content === 'object' 
                            ? record.content.text || JSON.stringify(record.content)
                            : record.content
                          }
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {importedRecords.length > 5 && (
                  <div className="text-center py-2">
                    <span className="text-xs text-muted-foreground">
                      还有 {importedRecords.length - 5} 条记录...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={importedRecords.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Check className="h-4 w-4 mr-2" />
              确认导入
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
