/**
 * 录音和文本输入组件
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGuide } from '@/components/permission-guide';
import { useSpeech } from '@/lib/hooks/use-speech';
import { useRecords } from '@/lib/hooks/use-records';
import { useLocation } from '@/lib/hooks/use-location';
import { useIsDesktop } from '@/lib/hooks/use-device-type';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

export function RecordInput() {
  const [inputText, setInputText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const { addRecord } = useRecords();
  const { location, isLoading: isLocationLoading, isEnabled: isLocationEnabled, toggleLocation } = useLocation();
  
  // 动态 placeholder 文本列表（使用 useMemo 避免每次渲染重新创建）
  const placeholders = useMemo(() => [
    '记录今天的美好瞬间...',
    '分享你的想法和感受...',
    '写下今天发生的事情...',
    '记录你的灵感和创意...',
    '描述一个难忘的时刻...',
    '分享今天学到的东西...',
    '记录你的心情变化...',
    '写下你的目标和计划...',
  ], []);
  
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
  
  const isDesktop = useIsDesktop();
  
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
  
  // 动态 placeholder 效果 - 打字机动画
  useEffect(() => {
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;
    
    const typeWriter = () => {
      const fullText = placeholders[currentIndex];
      
      if (!isDeleting) {
        // 打字效果
        if (charIndex <= fullText.length) {
          setPlaceholder(fullText.substring(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(typeWriter, 100); // 打字速度
        } else {
          // 完成打字，等待后开始删除
          timeoutId = setTimeout(() => {
            isDeleting = true;
            typeWriter();
          }, 2000); // 停留 2 秒
        }
      } else {
        // 删除效果
        if (charIndex > 0) {
          charIndex--;
          setPlaceholder(fullText.substring(0, charIndex));
          timeoutId = setTimeout(typeWriter, 50); // 删除速度更快
        } else {
          // 完成删除，切换到下一个
          isDeleting = false;
          currentIndex = (currentIndex + 1) % placeholders.length;
          timeoutId = setTimeout(typeWriter, 500); // 切换前稍微停顿
        }
      }
    };
    
    // 开始打字机效果
    typeWriter();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [placeholders]);
  
  // 切换录音状态
  const toggleRecording = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  // 保存记录
  const handleSave = useCallback(async () => {
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
      // 只有启用位置时才保存位置信息
      const currentLocation = isLocationEnabled && location ? location : undefined;
      
      addRecord(content, currentLocation);
      setInputText('');
      
      if (currentLocation) {
        const locationText = currentLocation.city 
          ? `${currentLocation.city}${currentLocation.district ? `, ${currentLocation.district}` : ''}`
          : '位置已记录';
        toast.success(`记录已保存 📍 ${locationText}`);
      } else {
        toast.success('记录已保存');
      }
    } catch {
      toast.error('保存失败，请重试');
    }
  }, [inputText, addRecord, isListening, stopListening, isLocationEnabled, location]);
  
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Lovable.dev 风格输入框 */}
      <div className="relative w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="group relative flex flex-col gap-2 p-4 w-full rounded-[28px] border-border/40 bg-muted/50 backdrop-blur-sm text-base shadow-lg transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-xl focus-within:border-primary/50 focus-within:shadow-[0_0_0_.5px_rgba(var(--primary-rgb),0.1)] focus-within:bg-background/50"
        >
          {/* Textarea */}
          <div className="relative flex flex-1 items-center">
            <Textarea
              placeholder={placeholder}
              value={displayText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none text-[16px] leading-relaxed placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[max(40svh,8rem)] bg-transparent focus:bg-transparent flex-1 border-0"
              disabled={isListening}
              style={{ minHeight: '140px', height: '140px' }}
            />
          </div>
          
          {/* 底部按钮栏 */}
          <div className="flex gap-1.5 flex-wrap items-center pt-1">
            {/* 左侧按钮组 */}
            <div className="flex gap-1.5 items-center">
              {/* 语音按钮 - 圆形 */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-full p-0 border border-border/40 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 hover:shadow-lg text-muted-foreground hover:text-primary md:h-9 md:w-9 transition-all duration-300 ${
                  isListening ? 'border-destructive/60 bg-destructive/10 text-destructive shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' : ''
                }`}
                onClick={toggleRecording}
                disabled={!isSupported}
                title={!isSupported ? '浏览器不支持' : isListening ? '停止录音' : '开始录音'}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              
              {/* 位置按钮 - 开关 */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-full p-0 border transition-all duration-300 md:h-9 md:w-9 ${
                  isLocationEnabled 
                    ? 'border-blue-500/80 bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'border-border/40 bg-background/50 backdrop-blur-sm text-muted-foreground hover:bg-primary/10 hover:border-primary/50 hover:shadow-lg hover:text-primary'
                } ${
                  isLocationLoading ? 'animate-pulse' : ''
                }`}
                onClick={toggleLocation}
                disabled={isLocationLoading}
                title={
                  isLocationEnabled 
                    ? (location ? `📍 已启用 - ${location.city || '位置已记录'}${location.district ? `, ${location.district}` : ''}\n精度: ${location.accuracy.toFixed(0)}米${location.altitude ? `\n海拔: ${location.altitude.toFixed(0)}米` : ''}` : '获取位置中...') 
                    : '点击启用位置记录'
                }
              >
                <MapPin className={`h-5 w-5 ${isLocationEnabled ? 'fill-current' : ''}`} />
              </Button>
            </div>
            
            {/* 状态指示 */}
            {isListening && (
              <div className="flex items-center gap-1.5 px-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
                <span className="text-xs text-destructive font-medium">录音中</span>
              </div>
            )}
            
            {/* 右侧按钮组 */}
            <div className="ml-auto flex items-center gap-1.5 md:gap-2">
              {/* 字数统计 */}
              <span className="text-xs text-muted-foreground/70 px-2 hidden md:inline">
                {inputText.length} 字
              </span>
              
              {/* 发送按钮 - 圆形黑色 */}
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                className="gap-2 whitespace-nowrap text-sm font-medium ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none relative z-10 flex rounded-full p-0 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30 items-center justify-center h-10 w-10 md:h-9 md:w-9 bg-foreground hover:bg-foreground/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] text-background"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-5 w-5">
                  <path fill="currentColor" d="M11 19V7.415l-3.293 3.293a1 1 0 1 1-1.414-1.414l5-5 .074-.067a1 1 0 0 1 1.34.067l5 5a1 1 0 1 1-1.414 1.414L13 7.415V19a1 1 0 1 1-2 0"></path>
                </svg>
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      {/* 精简的提示 - 只在有错误时显示 */}
      {(error || (!isSupported && !isListening)) && (
        <div className="mt-3">
          <PermissionGuide 
            error={error} 
            isSupported={isSupported} 
            isListening={isListening}
          />
        </div>
      )}
      
      {/* 快捷键提示 - 仅桌面端显示 */}
      {isDesktop && (
        <p className="mt-3 text-xs text-muted-foreground/40 text-center">
          Cmd/Ctrl + Enter 快速保存
        </p>
      )}
    </div>
  );
}

