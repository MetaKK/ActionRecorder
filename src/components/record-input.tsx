/**
 * 录音和文本输入组件
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
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
      {/* Lovable 风格的输入框容器 */}
      <div className="relative w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="group flex flex-col gap-3 p-4 w-full rounded-[28px] border border-border/50 bg-card text-base shadow-xl transition-all duration-150 ease-in-out focus-within:border-primary/30 hover:border-border focus-within:hover:border-primary/30"
        >
          {/* Textarea */}
          <div className="relative flex flex-1 items-center">
            <Textarea
              placeholder="记录您的生活..."
              value={displayText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none text-base leading-snug bg-transparent focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-0 px-2 py-2 min-h-[80px] placeholder:text-muted-foreground/60"
              disabled={isListening}
              style={{ height: '80px' }}
            />
          </div>
          
          {/* 按钮区域 */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* 语音按钮 */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full border border-border/50 bg-muted hover:bg-accent hover:border-accent text-muted-foreground hover:text-foreground transition-all duration-150 ${
                isListening ? 'animate-pulse border-destructive bg-destructive/10' : ''
              }`}
              onClick={toggleRecording}
              disabled={!isSupported}
              title={!isSupported ? '您的浏览器不支持语音识别' : isListening ? '停止录音' : '开始录音'}
            >
              {isListening ? (
                <MicOff className="h-5 w-5 text-destructive" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            
            {/* 字数统计 */}
            <span className="text-xs text-muted-foreground px-2">
              {inputText.length} 字
            </span>
            
            {/* 录音状态指示 */}
            {isListening && (
              <span className="text-xs text-destructive font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span>
                录音中
              </span>
            )}
            
            {/* 右侧按钮组 */}
            <div className="ml-auto flex items-center gap-2">
              {/* 发送按钮 - Lovable 风格 */}
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                className="h-10 w-10 rounded-full bg-foreground hover:bg-foreground/90 text-background transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      
      {/* 权限引导提示 */}
      <div className="mt-4">
        <PermissionGuide 
          error={error} 
          isSupported={isSupported} 
          isListening={isListening}
        />
      </div>
      
      {/* 提示信息 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>💡 Cmd/Ctrl + Enter 快速保存</span>
      </div>
    </div>
  );
}

