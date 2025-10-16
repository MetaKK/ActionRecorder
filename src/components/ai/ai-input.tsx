"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Loader2, 
  Mic, 
  MicOff, 
  Image, 
  Paperclip,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder, useVoicePlayer } from "@/lib/hooks/use-voice-recorder";
// 移除独立的图片上传组件，集成到输入框中

interface AIInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  disabled?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onImageUpload?: (file: File) => void;
  onFileUpload?: (file: File) => void;
  onVoiceResult?: (text: string) => void;
  onVoiceError?: (error: string) => void;
  lastMessage?: string; // 用于语音播放最后一条消息
}

export function AIInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled = false,
  onVoiceStart,
  onVoiceStop,
  onImageUpload,
  onFileUpload,
  onVoiceResult,
  onVoiceError,
  lastMessage,
}: AIInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  // 语音录制功能
  const { 
    isRecording: isVoiceRecording, 
    isSupported: isVoiceSupported, 
    startRecording, 
    stopRecording
  } = useVoiceRecorder({
    onResult: (text) => {
      onVoiceResult?.(text);
    },
    onError: (error) => {
      onVoiceError?.(error);
    },
  });

  // 语音播放功能
  const { 
    isPlaying, 
    playText, 
    stopPlaying 
  } = useVoicePlayer();


  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && value.trim() && !disabled) {
      onSubmit(e);
    }
  };

  const handleVoiceToggle = () => {
    if (isVoiceRecording) {
      stopRecording();
      onVoiceStop?.();
    } else {
      startRecording();
      onVoiceStart?.();
    }
  };

  // 语音播放处理
  const handlePlayLastMessage = () => {
    if (lastMessage) {
      if (isPlaying) {
        stopPlaying();
      } else {
        playText(lastMessage);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        onImageUpload?.(file);
      } else {
        onFileUpload?.(file);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload?.(file);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="输入你的消息... (Shift+Enter换行)"
            disabled={disabled}
            className={cn(
              "min-h-[48px] max-h-[140px] resize-none border-0 bg-background/80 backdrop-blur-sm px-4 py-3 pr-14 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
              "rounded-2xl border border-border/50 shadow-sm transition-all duration-200",
              "hover:border-border/70 hover:shadow-md",
              "focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5"
            )}
            rows={1}
          />
          
          {/* 工具栏 - Apple风格优化 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
            {isVoiceSupported && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleVoiceToggle}
                className={cn(
                  "h-8 w-8 p-0 rounded-full transition-all duration-200",
                  "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400",
                  isVoiceRecording && "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 animate-pulse"
                )}
                aria-label={isVoiceRecording ? "停止录音" : "开始录音"}
              >
                {isVoiceRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {lastMessage && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handlePlayLastMessage}
                className={cn(
                  "h-8 w-8 p-0 rounded-full transition-all duration-200",
                  "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-400",
                  isPlaying && "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                )}
                aria-label={isPlaying ? "停止播放" : "播放最后一条消息"}
              >
                {isPlaying ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => imageInputRef.current?.click()}
              className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="上传图片"
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !value.trim() || disabled}
          className={cn(
            "h-12 w-12 rounded-full p-0 transition-all duration-200",
            "bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground",
            "shadow-lg hover:shadow-xl active:scale-95",
            "focus-visible:ring-2 focus-visible:ring-primary/20"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />

      {/* 快捷提示 - Notion风格优化 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground/60">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd>
            <span>发送</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Shift</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd>
            <span>换行</span>
          </span>
          {isVoiceSupported && (
            <span className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              <span>语音输入</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "transition-colors",
            value.length > 1800 ? "text-orange-500" : "text-muted-foreground/60"
          )}>
            {value.length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}
