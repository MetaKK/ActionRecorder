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
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
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
              "min-h-[44px] max-h-[120px] resize-none border-0 bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
              "rounded-2xl border border-input shadow-sm"
            )}
            rows={1}
          />
          
          {/* 工具栏 */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isVoiceSupported && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleVoiceToggle}
                className={cn(
                  "h-8 w-8 p-0",
                  isVoiceRecording && "text-red-500"
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
                  "h-8 w-8 p-0",
                  isPlaying && "text-blue-500"
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
              className="h-8 w-8 p-0"
              aria-label="上传图片"
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !value.trim() || disabled}
          className="h-11 w-11 rounded-full p-0"
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

      {/* 快捷提示 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Enter 发送</span>
          <span>Shift+Enter 换行</span>
          {isVoiceSupported && (
            <span>点击麦克风开始语音输入</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{value.length}/2000</span>
        </div>
      </div>
    </div>
  );
}
