/**
 * 录音和文本输入组件
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGuide } from '@/components/permission-guide';
import { useSpeech } from '@/lib/hooks/use-speech';
import { useRecords } from '@/lib/hooks/use-records';
import { toast } from 'sonner';

export function RecordInput() {
  const [inputText, setInputText] = useState('');
  const { addRecord } = useRecords();
  
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeech({
    lang: 'zh-CN',
    continuous: true,  // 改为 true，持续识别直到用户手动停止
    interimResults: true,
  });
  
  // 同步最终识别结果到输入框
  useEffect(() => {
    if (transcript) {
      setInputText(prev => {
        // 避免重复添加
        if (prev.endsWith(transcript)) {
          return prev;
        }
        return prev + transcript;
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript]);
  
  // 显示临时识别结果（实时反馈）
  const displayText = inputText + interimTranscript;
  
  // 切换录音状态
  const toggleRecording = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  // 保存记录
  const handleSave = useCallback(() => {
    // 如果正在录音，先停止录音
    if (isListening) {
      stopListening();
    }
    
    const content = inputText.trim();
    
    if (!content) {
      toast.error('请输入内容');
      return;
    }
    
    try {
      addRecord(content);
      setInputText('');
      toast.success('记录已保存');
    } catch {
      toast.error('保存失败，请重试');
    }
  }, [inputText, addRecord, isListening, stopListening]);
  
  // 处理键盘快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter 保存
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );
  
  return (
    <div className="w-full">
      {/* Notion 风格的极简输入框 */}
      <div className="relative w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="group flex flex-col gap-3 p-5 w-full rounded-2xl border border-border/40 bg-background hover:bg-accent/5 text-base shadow-sm transition-all duration-200 ease-out focus-within:shadow-md focus-within:border-border"
        >
          {/* Textarea */}
          <div className="relative flex flex-1 items-center">
            <Textarea
              placeholder="记录您的生活..."
              value={displayText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none text-[15px] leading-normal bg-transparent focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-0 px-1 py-0 min-h-[100px] placeholder:text-muted-foreground/40"
              disabled={isListening}
            />
          </div>
          
          {/* 底部工具栏 */}
          <div className="flex gap-2 items-center pt-2 border-t border-border/30">
            {/* 左侧按钮组 */}
            <div className="flex gap-1 items-center">
              {/* 语音按钮 */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all ${
                  isListening ? 'bg-destructive/10 text-destructive' : ''
                }`}
                onClick={toggleRecording}
                disabled={!isSupported}
                title={!isSupported ? '浏览器不支持' : isListening ? '停止' : '语音'}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                <span className="ml-1.5 text-xs">
                  {isListening ? '停止' : '语音'}
                </span>
              </Button>
            </div>
            
            {/* 中间状态指示 */}
            <div className="flex-1 flex items-center gap-3 text-xs text-muted-foreground/60">
              {isListening && (
                <span className="flex items-center gap-1.5 text-destructive/80">
                  <span className="w-1 h-1 rounded-full bg-destructive animate-pulse"></span>
                  录音中
                </span>
              )}
              <span>{inputText.length} 字</span>
            </div>
            
            {/* 右侧发送按钮 */}
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim()}
              className="h-8 px-4 rounded-lg bg-foreground hover:bg-foreground/90 text-background text-xs font-medium transition-all disabled:opacity-30"
            >
              保存
            </Button>
          </div>
        </form>
      </div>
      
      {/* 精简的提示 - 只在有错误或特殊状态时显示 */}
      {(error || (!isSupported && !isListening)) && (
        <div className="mt-3">
          <PermissionGuide 
            error={error} 
            isSupported={isSupported} 
            isListening={isListening}
          />
        </div>
      )}
      
      {/* 快捷键提示 - 更精简 */}
      <p className="mt-3 text-xs text-muted-foreground/50 text-center">
        Cmd/Ctrl + Enter 快速保存
      </p>
    </div>
  );
}

