/**
 * 录音和文本输入组件
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Trash2, Circle, StopCircle, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGuide } from '@/components/permission-guide';
import { AudioPlayer } from '@/components/audio-player';
import { useSpeech } from '@/lib/hooks/use-speech';
import { useRecords } from '@/lib/hooks/use-records';
import { useLocation } from '@/lib/hooks/use-location';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { useIsDesktop } from '@/lib/hooks/use-device-type';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { blobToBase64, formatDuration } from '@/lib/utils/audio';

export function RecordInput() {
  const [inputText, setInputText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { addRecord } = useRecords();
  const { location, isLoading: isLocationLoading, isEnabled: isLocationEnabled, toggleLocation } = useLocation();
  const { 
    isRecording: isRecordingAudio, 
    audioBlob, 
    duration: audioDuration, 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording,
    clearAudio,
    audioURL
  } = useAudioRecorder();
  
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
  
  // 动态 placeholder 效果 - 打字机动画（仅在未聚焦时运行）
  useEffect(() => {
    // ⭐ 如果聚焦，清空 placeholder 并停止动画
    if (isFocused) {
      setPlaceholder('');
      return;
    }
    
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
  }, [placeholders, isFocused]); // ⭐ 添加 isFocused 依赖
  
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
    // 如果正在语音转文字，先停止
    if (isListening) {
      stopListening();
    }
    
    // 如果正在录制音频，先停止并获取 Blob
    let finalAudioBlob = audioBlob;
    let finalAudioDuration = audioDuration;
    
    if (isRecordingAudio) {
      const recordedBlob = await stopAudioRecording();
      if (recordedBlob) {
        finalAudioBlob = recordedBlob;
        finalAudioDuration = audioDuration; // 使用当前时长
      }
    }
    
    const content = inputText.trim();
    
    // 至少需要内容或音频之一
    if (!content && !finalAudioBlob) {
      toast.error('请输入内容或录制语音');
      return;
    }
    
    try {
      // 只有启用位置时才保存位置信息
      const currentLocation = isLocationEnabled && location ? location : undefined;
      
      // 处理音频数据
      let audioData: { audioData: string; audioDuration: number; audioFormat: string } | undefined;
      if (finalAudioBlob) {
        const base64 = await blobToBase64(finalAudioBlob);
        audioData = {
          audioData: base64,
          audioDuration: finalAudioDuration,
          audioFormat: finalAudioBlob.type,
        };
        
        console.log('💾 保存音频:', {
          size: `${(finalAudioBlob.size / 1024).toFixed(2)} KB`,
          duration: `${finalAudioDuration.toFixed(1)}秒`,
          format: finalAudioBlob.type,
        });
      }
      
      console.log('💾 保存内容:', {
        文本: content || '(无文本)',
        文本长度: content.length,
        有音频: !!audioData,
        有位置: !!currentLocation,
      });
      
      addRecord(content, currentLocation, audioData);
      setInputText('');
      clearAudio();
      
      // 成功提示
      let message = '记录已保存';
      if (content && audioData) {
        message += ' 📝🎤'; // 文本+音频
      } else if (audioData) {
        message += ' 🎤'; // 仅音频
      } else if (content) {
        message += ' 📝'; // 仅文本
      }
      
      if (currentLocation) {
        const locationText = currentLocation.city 
          ? `${currentLocation.city}${currentLocation.district ? `, ${currentLocation.district}` : ''}`
          : '位置已记录';
        message += ` 📍 ${locationText}`;
      }
      toast.success(message);
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  }, [inputText, audioBlob, audioDuration, addRecord, isListening, stopListening, isRecordingAudio, stopAudioRecording, clearAudio, isLocationEnabled, location]);
  
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
          {/* 录音中 - 状态提示 */}
          {isRecordingAudio && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500" style={{ animation: 'breathe-red 3s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">录音中</span>
                <span className="text-xs text-muted-foreground font-mono">{formatDuration(audioDuration)}</span>
              </div>
            </div>
          )}
          
          {/* 音频预览 - 录音完成后 */}
          {!isRecordingAudio && audioBlob && audioURL && (
            <div 
              className="space-y-2 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 fill-current" />
                  <span className="text-xs text-green-700 dark:text-green-300 font-semibold">录音完成</span>
                  <span className="text-xs text-muted-foreground">({formatDuration(audioDuration)})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearAudio();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <AudioPlayer audioData={audioURL} duration={audioDuration} compact />
              </div>
            </div>
          )}
          
          {/* Textarea */}
          <div className="relative flex flex-1 items-center">
            <Textarea
              placeholder={placeholder}
              value={displayText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none text-[16px] leading-relaxed placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[max(40svh,8rem)] bg-transparent focus:bg-transparent flex-1 border-0"
              disabled={isListening}
              style={{ minHeight: '140px', height: '140px' }}
            />
          </div>
          
          {/* 底部按钮栏 */}
          <div className="flex gap-1.5 flex-wrap items-center pt-1">
            {/* 左侧按钮组 */}
            <div className="flex gap-1.5 items-center">
              {/* 音频录制按钮 */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-full p-0 border transition-all duration-300 md:h-9 md:w-9 ${
                  isRecordingAudio 
                    ? 'border-red-500/80 bg-red-500/20 text-red-600 dark:text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' 
                    : audioBlob
                    ? 'border-green-500/80 bg-green-500/20 text-green-600 dark:text-green-400 shadow-lg shadow-green-500/20'
                    : 'border-border/40 bg-background/50 backdrop-blur-sm text-muted-foreground hover:bg-red/10 hover:border-red-500/50 hover:shadow-lg hover:text-red-600'
                }`}
                onClick={async () => {
                  if (isRecordingAudio) {
                    await stopAudioRecording();
                    toast.success(`录音完成 (${formatDuration(audioDuration)})`);
                  } else {
                    try {
                      await startAudioRecording();
                      toast.success('🎙️ 开始录音');
                    } catch {
                      toast.error('录音失败，请检查麦克风权限');
                    }
                  }
                }}
                title={
                  isRecordingAudio 
                    ? `⏹️ 停止录音 (${formatDuration(audioDuration)}) - 保留原声` 
                    : audioBlob 
                    ? `✅ 已录制 (${formatDuration(audioDuration)}) - 点击重新录制` 
                    : '🎙️ 录制音频 (保存完整原声)'
                }
              >
                {isRecordingAudio ? (
                  <StopCircle className="h-5 w-5 fill-current" />
                ) : audioBlob ? (
                  <Circle className="h-5 w-5 fill-current" />
                ) : (
                  <Circle className="h-5 w-5" />
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
            
            {/* 状态指示 - 语音转文字中 */}
            {isListening && (
              <div className="flex items-center gap-1.5 px-2">
                <div className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500" style={{ animation: 'breathe-purple 3s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">转文字中...</span>
              </div>
            )}
            
            {/* 右侧按钮组 */}
            <div className="ml-auto flex items-center gap-1.5 md:gap-2">
              {/* 字数统计 */}
              <span className="text-xs text-muted-foreground/70 px-2 hidden md:inline">
                {inputText.length} 字
              </span>
              
              {/* 语音转文本按钮 - 话筒 */}
        <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-full p-0 border transition-all duration-300 md:h-9 md:w-9 ${
                  isListening 
                    ? 'border-purple-500/80 bg-purple-500/20 text-purple-600 dark:text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse' 
                    : 'border-border/40 bg-background/50 backdrop-blur-sm text-muted-foreground hover:bg-purple/10 hover:border-purple-500/50 hover:shadow-lg hover:text-purple-600'
          }`}
          onClick={toggleRecording}
          disabled={!isSupported}
                title={!isSupported ? '浏览器不支持' : isListening ? '停止语音转文本 (转为可编辑文字)' : '语音转文本 (实时识别)'}
        >
          {isListening ? (
                  <MicOff className="h-5 w-5" />
          ) : (
                  <Mic className="h-5 w-5" />
          )}
        </Button>
        
              {/* 发送按钮 - 圆形黑色 */}
        <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim() && !audioBlob}
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

