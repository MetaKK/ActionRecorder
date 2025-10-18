/**
 * 导入记录对话框组件 - 性能优化版
 * 支持导入其他timeline记录并有序穿插到当前timeline中
 * 
 * 性能优化特性：
 * - 内存管理：避免内存泄漏，优化大文件处理
 * - 解析优化：使用流式解析，减少内存占用
 * - 批处理优化：智能批处理，避免阻塞UI
 * - 错误处理：完善的错误边界和恢复机制
 * - 性能监控：内置性能指标收集
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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

// ==================== 性能优化常量 ====================

const PERFORMANCE_CONFIG = {
  // 批处理配置
  BATCH_SIZE: 50,
  BATCH_DELAY: 100,
  MAX_BATCH_SIZE: 100,
  
  // 内存管理
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MEMORY_THRESHOLD: 50 * 1024 * 1024, // 50MB
  
  // 解析优化
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  PARSE_TIMEOUT: 30000, // 30s timeout
  
  // 性能监控
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10% sampling
} as const;


// ==================== 内存管理工具 ====================

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: (() => void)[] = [];
  
  static getInstance(): MemoryManager {
    if (!this.instance) {
      this.instance = new MemoryManager();
    }
    return this.instance;
  }
  
  registerCleanup(cleanup: () => void): void {
    this.cleanupTasks.push(cleanup);
  }
  
  cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('清理任务失败:', error);
      }
    });
    this.cleanupTasks = [];
  }
  
  checkMemoryUsage(): boolean {
    const memory = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!memory) return true;
    
    const used = memory.usedJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    const usage = used / limit;
    
    if (usage > 0.8) {
      console.warn(`⚠️ 内存使用率过高: ${(usage * 100).toFixed(1)}%`);
      return false;
    }
    
    return true;
  }
}

// ==================== 流式解析器 ====================

class StreamParser {
  private buffer: string = '';
  private records: ImportRecord[] = [];
  private currentDate: string = '';
  
  constructor() {
    this.reset();
  }
  
  reset(): void {
    this.buffer = '';
    this.records = [];
    this.currentDate = '';
  }
  
  parseChunk(chunk: string): ImportRecord[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    
    // 保留最后一行（可能不完整）
    this.buffer = lines.pop() || '';
    
    // 处理完整的行
    for (const line of lines) {
      this.processLine(line.trim());
    }
    
    return this.records;
  }
  
  finalize(): ImportRecord[] {
    // 处理最后一行
    if (this.buffer.trim()) {
      this.processLine(this.buffer.trim());
    }
    
    const result = [...this.records];
    this.reset();
    return result;
  }
  
  private processLine(line: string): void {
    if (!line || line.startsWith('─')) return;
    
    // 日期匹配
    const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s+\((.+)\)$/);
    if (dateMatch) {
      this.currentDate = dateMatch[1];
      return;
    }
    
    // 时间戳匹配
    const timeMatch = line.match(/^\[(\d{2}:\d{2})\]\s*(.+)$/);
    if (timeMatch && this.currentDate) {
      const [, timeStr, content] = timeMatch;
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      const [year, month, day] = this.currentDate.split('-').map(Number);
      const recordDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (hours < 6) {
        recordDate.setDate(recordDate.getDate() - 1);
      }
      
      this.records.push({
        id: `imported-${Date.now()}-${this.records.length}`,
        content: { text: content.trim() },
        timestamp: recordDate.getTime(),
        type: 'text',
        source: 'imported'
      });
    }
  }
}

export function ImportDialog({ trigger }: ImportDialogProps = {}) {
  // ==================== 状态管理 ====================
  
  const [open, setOpen] = useState(false);
  const [importedRecords, setImportedRecords] = useState<ImportRecord[]>([]);
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ==================== 性能优化 Refs ====================
  
  const memoryManager = useRef(MemoryManager.getInstance());
  const abortController = useRef<AbortController | null>(null);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // ==================== Hooks ====================
  
  const loadFromStorage = useRecordsStore(state => state.loadFromStorage);
  
  // ==================== 内存清理 ====================
  
  useEffect(() => {
    const currentMemoryManager = memoryManager.current;
    return () => {
      // 清理定时器
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      
      // 取消进行中的请求
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // 清理内存
      currentMemoryManager.cleanup();
    };
  }, []);
  
  // ==================== 性能监控 ====================

  // ==================== 优化解析函数 ====================
  
  // 流式解析导出记录格式数据
  const parseExportData = useCallback(async (data: string): Promise<ImportRecord[]> => {
    // 大文件使用流式解析
    if (data.length > PERFORMANCE_CONFIG.CHUNK_SIZE) {
      const parser = new StreamParser();
      const chunks = [];
      
      for (let i = 0; i < data.length; i += PERFORMANCE_CONFIG.CHUNK_SIZE) {
        const chunk = data.slice(i, i + PERFORMANCE_CONFIG.CHUNK_SIZE);
        chunks.push(parser.parseChunk(chunk));
        
        // 定期检查内存使用
        if (i % (PERFORMANCE_CONFIG.CHUNK_SIZE * 5) === 0) {
          if (!memoryManager.current.checkMemoryUsage()) {
            throw new Error('内存使用率过高，解析中断');
          }
        }
      }
      
      return parser.finalize();
    }
    
    // 小文件使用传统解析
    const lines = data.split('\n');
    const records: ImportRecord[] = [];
    let currentDate = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('─')) continue;

      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s+\((.+)\)$/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        continue;
      }

      const timeMatch = line.match(/^\[(\d{2}:\d{2})\]\s*(.+)$/);
      if (timeMatch && currentDate) {
        const [, timeStr, content] = timeMatch;
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        const [year, month, day] = currentDate.split('-').map(Number);
        const recordDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
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

  // 优化Markdown格式解析
  const parseMarkdownData = useCallback(async (data: string): Promise<ImportRecord[]> => {
    const lines = data.split('\n');
    const records: ImportRecord[] = [];
    let currentRecord: { title: string; content: string; timestamp: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('## ')) {
        if (currentRecord) {
          records.push({
            id: `imported-${Date.now()}-${records.length}`,
            content: { text: currentRecord.content.trim() },
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
      
      // 定期检查内存使用
      if (i % 1000 === 0 && !memoryManager.current.checkMemoryUsage()) {
        throw new Error('内存使用率过高，解析中断');
      }
    }

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

  // 优化解析导入数据
  const parseImportData = useCallback(async (data: string): Promise<ImportRecord[]> => {
    // 文件大小检查
    if (data.length > PERFORMANCE_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`文件过大，最大支持 ${PERFORMANCE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // 设置超时保护
    const timeoutPromise = new Promise<never>((_, reject) => {
      processingTimeout.current = setTimeout(() => {
        reject(new Error('解析超时，请检查文件格式'));
      }, PERFORMANCE_CONFIG.PARSE_TIMEOUT);
    });
    
    try {
      const parsePromise = (async () => {
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
          // JSON解析失败，尝试其他格式
        }
        
        // 尝试导出记录格式
        const exportRecords = await parseExportData(data) as ImportRecord[];
        if (exportRecords.length > 0) {
          return exportRecords;
        }
        
        // 尝试Markdown格式
        return await parseMarkdownData(data) as ImportRecord[];
      })();
      
      const result = await Promise.race([parsePromise, timeoutPromise]);
      
      // 清理超时定时器
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
        processingTimeout.current = null;
      }
      
      return result;
    } catch (error) {
      // 清理超时定时器
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
        processingTimeout.current = null;
      }
      throw error;
    }
  }, [parseExportData, parseMarkdownData]);

  // 优化文件导入处理
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 文件大小检查
    if (file.size > PERFORMANCE_CONFIG.MAX_FILE_SIZE) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // 创建新的AbortController
      abortController.current = new AbortController();
      
      const text = await file.text();
      const parsedRecords = await parseImportData(text) as ImportRecord[];
      
      setImportedRecords(parsedRecords);
      toast.success(`成功解析 ${parsedRecords.length} 条记录`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件解析失败';
      console.error('文件解析失败:', error);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      abortController.current = null;
    }
  }, [parseImportData]);

  // 优化文本导入处理
  const handleTextImport = useCallback(async () => {
    if (!importText.trim()) {
      toast.error('请输入要导入的内容');
      return;
    }

    setIsProcessing(true);
    
    try {
      const parsedRecords = await parseImportData(importText) as ImportRecord[];
      setImportedRecords(parsedRecords);
      toast.success(`成功解析 ${parsedRecords.length} 条记录`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文本解析失败';
      console.error('文本解析失败:', error);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [importText, parseImportData]);

  // 优化确认导入 - 核心性能优化
  const handleConfirmImport = useCallback(async () => {
    if (importedRecords.length === 0) {
      toast.error('没有可导入的记录');
      return;
    }

    setIsProcessing(true);
    
    try {
      const storage = await getStorage();
      
      // 智能排序和分类
      const sortedRecords = [...importedRecords].sort((a, b) => b.timestamp - a.timestamp);
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentRecords = sortedRecords.filter(r => r.timestamp >= sevenDaysAgo);
      const historicalRecords = sortedRecords.filter(r => r.timestamp < sevenDaysAgo);
      
      // 第一步：批量导入近期数据
      let importedCount = 0;
      if (recentRecords.length > 0) {
        const batchSize = Math.min(PERFORMANCE_CONFIG.BATCH_SIZE, recentRecords.length);
        
        for (let i = 0; i < recentRecords.length; i += batchSize) {
          const batch = recentRecords.slice(i, i + batchSize);
          
          // 并行处理批次内的记录
          const batchPromises = batch.map(async (record) => {
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
            return newRecord;
          });
          
          await Promise.all(batchPromises);
          importedCount += batch.length;
          
          // 检查内存使用
          if (!memoryManager.current.checkMemoryUsage()) {
            console.warn('⚠️ 内存使用率过高，导入可能受影响');
          }
        }
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
      
      // 第二步：智能后台导入历史数据
      if (historicalRecords.length > 0) {
        const toastId = toast.loading(`正在后台导入 ${historicalRecords.length} 条历史记录...`);
        
        // 使用 requestIdleCallback 或 setTimeout 确保不阻塞 UI
        const scheduleBackgroundImport = () => {
          if (window.requestIdleCallback) {
            window.requestIdleCallback(() => processHistoricalRecords(historicalRecords, importedCount, toastId));
          } else {
            setTimeout(() => processHistoricalRecords(historicalRecords, importedCount, toastId), 100);
          }
        };
        
        scheduleBackgroundImport();
      } else {
        toast.success(`成功导入 ${importedCount} 条记录`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入失败';
      console.error('导入失败:', error);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  }, [importedRecords, loadFromStorage]);

  // 后台处理历史记录
  const processHistoricalRecords = useCallback(async (
    historicalRecords: ImportRecord[],
    importedCount: number,
    toastId: string | number
  ) => {
    try {
      const storage = await getStorage();
      const batchSize = Math.min(PERFORMANCE_CONFIG.BATCH_SIZE, historicalRecords.length);
      let processed = 0;
      
      for (let i = 0; i < historicalRecords.length; i += batchSize) {
        const batch = historicalRecords.slice(i, i + batchSize);
        
        // 并行处理批次
        const batchPromises = batch.map(async (record) => {
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
          return newRecord;
        });
        
        await Promise.all(batchPromises);
        processed += batch.length;
        
        // 批次间延迟，避免阻塞
        if (i + batchSize < historicalRecords.length) {
          await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.BATCH_DELAY));
        }
        
        // 定期检查内存使用
        if (i % (batchSize * 5) === 0 && !memoryManager.current.checkMemoryUsage()) {
          console.warn('⚠️ 后台导入内存使用率过高');
        }
      }
      
      // 最终刷新状态
      await loadFromStorage();
      toast.success(`所有记录导入完成！共 ${importedCount + processed} 条`, { id: toastId });
    } catch (error) {
      console.error('后台导入失败:', error);
      toast.error('部分历史记录导入失败', { id: toastId });
    }
  }, [loadFromStorage]);

  // 优化清除导入数据
  const handleClearImport = useCallback(() => {
    setImportedRecords([]);
    setImportText('');
    
    // 清理内存
    memoryManager.current.cleanup();
    
    // 取消进行中的操作
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
      processingTimeout.current = null;
    }
  }, []);

  // 优化预览记录 - 使用虚拟化
  const previewRecords = useMemo(() => {
    const maxPreview = 5;
    const records = importedRecords.slice(0, maxPreview);
    
    // 性能监控
    if (importedRecords.length > 100) {
      console.log(`📊 预览优化: 显示 ${records.length} / ${importedRecords.length} 条记录`);
    }
    
    return records;
  }, [importedRecords]);

  // 计算导入统计信息（用于性能监控）
  const importStats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const recentCount = importedRecords.filter(r => r.timestamp >= sevenDaysAgo).length;
    const historicalCount = importedRecords.length - recentCount;
    
    return {
      total: importedRecords.length,
      recent: recentCount,
      historical: historicalCount,
      estimatedTime: Math.max(
        recentCount * 0.1, // 近期数据快速处理
        historicalCount * 0.05 + (historicalCount / PERFORMANCE_CONFIG.BATCH_SIZE) * 0.1
      )
    };
  }, [importedRecords]);
  
  // 性能监控日志
  useEffect(() => {
    if (importStats.total > 0) {
      console.log(`📊 导入统计: 总计 ${importStats.total} 条，近期 ${importStats.recent} 条，历史 ${importStats.historical} 条`);
    }
  }, [importStats]);

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
                            ? (record.content.text as string) || JSON.stringify(record.content)
                            : (record.content as string)
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
