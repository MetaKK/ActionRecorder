/**
 * 录音和文本输入组件
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Trash2, Circle, StopCircle, Mic, MicOff, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGuide } from '@/components/permission-guide';
import { AudioPlayer } from '@/components/audio-player';
import { ImageGrid } from '@/components/image-grid';
import { useSpeech } from '@/lib/hooks/use-speech';
import { useRecords } from '@/lib/hooks/use-records';
import { useLocation } from '@/lib/hooks/use-location';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { useImageUpload } from '@/lib/hooks/use-image-upload';
import { useIsDesktop } from '@/lib/hooks/use-device-type';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { blobToBase64, formatDuration } from '@/lib/utils/audio';
import { cn } from '@/lib/utils';

export function RecordInput() {
  const [inputText, setInputText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  
  // 图片上传Hook
  const {
    images,
    isUploading,
    fileInputRef,
    removeImage,
    clearImages,
    handleFileSelect,
    handleDrop,
    handlePaste,
    triggerFileSelect,
  } = useImageUpload();
  
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
    
    // 至少需要内容、音频或图片之一
    if (!content && !finalAudioBlob && images.length === 0) {
      toast.error('请输入内容、录制语音或上传图片');
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
      
      // 处理图片数据
      const imageData = images.length > 0 ? images : undefined;
      if (imageData) {
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        console.log('📸 保存图片:', {
          数量: images.length,
          总大小: `${(totalSize / 1024).toFixed(2)} KB`,
        });
      }
      
      console.log('💾 保存内容:', {
        文本: content || '(无文本)',
        文本长度: content.length,
        有音频: !!audioData,
        有图片: !!imageData,
        图片数量: images.length,
        有位置: !!currentLocation,
      });
      
      addRecord(content, currentLocation, audioData, imageData);
      setInputText('');
      clearAudio();
      clearImages();
      
      // 成功提示
      let message = '记录已保存';
      const features: string[] = [];
      if (content) features.push('📝');
      if (audioData) features.push('🎤');
      if (imageData) features.push(`📷${images.length}`);
      if (features.length > 0) {
        message += ' ' + features.join(' ');
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
  }, [inputText, audioBlob, audioDuration, images, addRecord, isListening, stopListening, isRecordingAudio, stopAudioRecording, clearAudio, clearImages, isLocationEnabled, location]);
  
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
    <div className="relative w-full flex flex-col items-center px-4 text-center mb-12">
      {/* Hero Section - Lovable 风格 */}
      <div className="flex w-full flex-col items-center justify-center gap-6 mb-6">
        {/* 主标题 */}
        <h1 className="text-4xl font-bold leading-none text-foreground tracking-tight md:text-5xl lg:text-6xl">
          记录生活
        </h1>
        
        {/* 副标题 */}
        <p className="max-w-2xl text-center text-lg leading-tight text-foreground/60 md:text-xl">
          用文字、语音或图片，捕捉每一个值得铭记的瞬间
        </p>
      </div>
      
      {/* Lovable 风格大输入框 */}
      <div className="relative w-full max-w-3xl">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="group flex flex-col gap-3 p-4 w-full rounded-[28px] border border-border/40 bg-muted/30 backdrop-blur-xl text-base shadow-xl transition-all duration-200 ease-out focus-within:border-foreground/20 hover:border-foreground/10 focus-within:hover:border-foreground/20"
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
          
          {/* 图片预览区域 */}
          {images.length > 0 && (
            <ImageGrid
              images={images}
              onRemove={removeImage}
              className="mb-3"
            />
          )}
          
          {/* Textarea - Lovable 风格 */}
          <div className="relative flex flex-1 items-center">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={displayText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full resize-none bg-transparent text-[16px] leading-snug placeholder:text-muted-foreground focus-visible:outline-none focus:bg-transparent border-0 p-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[max(35svh,5rem)] placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isListening}
              style={{ minHeight: '100px', height: '100px' }}
            />
          </div>
          
          {/* 底部按钮栏 - Lovable 风格 */}
          <div className="flex gap-1 flex-wrap items-center">
            {/* 左侧按钮组 */}
            <div className="flex gap-1 items-center">
              {/* 音频录制按钮 */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
                  "border border-input bg-muted transition-all duration-150 ease-in-out",
                  "hover:bg-accent hover:border-accent",
                  "text-muted-foreground hover:text-foreground",
                  isRecordingAudio && "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse",
                  audioBlob && !isRecordingAudio && "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                )}
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
              </button>
              
              {/* 位置按钮 */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
                  "border border-input bg-muted transition-all duration-150 ease-in-out",
                  "hover:bg-accent hover:border-accent",
                  "text-muted-foreground hover:text-foreground",
                  isLocationEnabled && "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  isLocationLoading && "animate-pulse"
                )}
                onClick={toggleLocation}
                disabled={isLocationLoading}
                title={
                  isLocationEnabled 
                    ? (location ? `📍 已启用 - ${location.city || '位置已记录'}${location.district ? `, ${location.district}` : ''}\n精度: ${location.accuracy.toFixed(0)}米${location.altitude ? `\n海拔: ${location.altitude.toFixed(0)}米` : ''}` : '获取位置中...') 
                    : '点击启用位置记录'
                }
              >
                <MapPin className={cn("h-4 w-4", isLocationEnabled && "fill-current")} />
              </button>
              
              {/* 媒体上传按钮 */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
                  "border border-input bg-muted transition-all duration-150 ease-in-out",
                  "hover:bg-accent hover:border-accent",
                  "text-muted-foreground hover:text-foreground",
                  images.length > 0 && "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
                  isUploading && "animate-pulse"
                )}
                onClick={triggerFileSelect}
                disabled={isUploading}
                title={
                  isUploading 
                    ? '处理中...' 
                    : images.length > 0 
                    ? `📷 已添加 ${images.length} 个文件 - 点击添加更多` 
                    : '📷🎬 添加图片或视频 (最多9个)'
                }
              >
                <ImageIcon className={cn("h-4 w-4", images.length > 0 && "fill-current")} />
              </button>
              
              {/* 隐藏的文件input - 支持图片和视频 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                aria-label="上传图片或视频"
              />
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
              
              {/* 语音转文本按钮 */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
                  "border border-input bg-muted transition-all duration-150 ease-in-out",
                  "hover:bg-accent hover:border-accent",
                  "text-muted-foreground hover:text-foreground",
                  isListening && "border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 animate-pulse"
                )}
                onClick={toggleRecording}
                disabled={!isSupported}
                title={!isSupported ? '浏览器不支持' : isListening ? '停止语音转文本' : '语音转文本'}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
        
              {/* 发送按钮 */}
              <button
                type="submit"
                disabled={!inputText.trim() && !audioBlob && images.length === 0}
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
                  "bg-foreground text-background transition-all duration-150 ease-out",
                  "hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-5 w-5">
                  <path fill="currentColor" d="M11 19V7.415l-3.293 3.293a1 1 0 1 1-1.414-1.414l5-5 .074-.067a1 1 0 0 1 1.34.067l5 5a1 1 0 1 1-1.414 1.414L13 7.415V19a1 1 0 1 1-2 0"></path>
                </svg>
              </button>
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

