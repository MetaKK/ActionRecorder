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
  }, [inputText, addRecord]);
  
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
    <div className="space-y-4">
      <div className="flex gap-2">
        {/* 语音录入按钮 */}
        <Button
          size="lg"
          variant={isListening ? 'destructive' : 'default'}
          className={`flex-1 h-14 text-lg font-medium transition-all ${
            isListening ? 'animate-pulse' : ''
          }`}
          onClick={toggleRecording}
          disabled={!isSupported}
          title={!isSupported ? '您的浏览器不支持语音识别' : ''}
        >
          {isListening ? (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              停止录音
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              开始录音
            </>
          )}
        </Button>
        
        {/* 保存按钮 */}
        <Button
          size="lg"
          variant="secondary"
          className="h-14 px-6"
          onClick={handleSave}
          disabled={!inputText.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      
      {/* 权限引导提示 */}
      <PermissionGuide 
        error={error} 
        isSupported={isSupported} 
        isListening={isListening}
      />
      
      {/* 文本输入框 */}
      <Textarea
        placeholder="在这里输入或使用语音记录..."
        value={displayText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[120px] text-base resize-none"
        disabled={isListening}
      />
      
      <p className="text-xs text-muted-foreground text-center">
        提示：使用 Cmd/Ctrl + Enter 快速保存
      </p>
    </div>
  );
}

