"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Plus,
  Loader2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Camera,
  Paperclip
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useVoiceRecorder, useVoicePlayer } from "@/lib/hooks/use-voice-recorder";

interface AIInputMinimalProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onVoiceResult?: (text: string) => void;
  onVoiceError?: (error: string) => void;
  lastMessage?: string;
  className?: string;
  onImageUpload?: (file: File) => void;
  onFileUpload?: (file: File) => void;
}

export function AIInputMinimal({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "询问任何问题...",
  onVoiceResult,
  onVoiceError,
  lastMessage,
  className,
  onImageUpload,
  onFileUpload
}: AIInputMinimalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 语音录制功能
  const { 
    isRecording: isVoiceRecording, 
    isSupported: isVoiceSupported, 
    startRecording, 
    stopRecording
  } = useVoiceRecorder({
    onResult: (text) => {
      onChange(value + text);
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

  // 自动调整高度 - 限制为单行
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = "24px"; // 固定单行高度
    }
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(value.trim());
      }
    }
  }, [onSubmit, isLoading, value, isComposing]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && value.trim() && !disabled) {
      onSubmit(value.trim());
    }
  }, [onSubmit, isLoading, value, disabled]);

  const handleVoiceToggle = useCallback(() => {
    if (isVoiceRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isVoiceRecording, startRecording, stopRecording]);

  const handlePlayLastMessage = useCallback(() => {
    if (lastMessage) {
      if (isPlaying) {
        stopPlaying();
      } else {
        playText(lastMessage);
      }
    }
  }, [lastMessage, isPlaying, playText, stopPlaying]);

  const handleImageSelect = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className={cn(
      "flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4",
      className
    )}>
      <div className="w-full max-w-4xl mx-auto">
        <div className={cn(
          "relative bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-300 ease-in-out shadow-lg",
          "hover:shadow-xl focus-within:shadow-xl",
          isFocused 
            ? "border-blue-300 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/20" 
            : "border-gray-200 dark:border-gray-700",
          isVoiceRecording && "border-red-300 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20"
        )}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
            {/* 添加附件菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full transition-all duration-200",
                    "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
                    "flex items-center justify-center",
                    "hover:scale-105 active:scale-95"
                  )}
                  tabIndex={0}
                >
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start"
                className={cn(
                  "w-52 rounded-2xl shadow-2xl",
                  "border border-gray-200/80 dark:border-gray-700/50",
                  "bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl"
                )}
                sideOffset={12}
              >
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Camera className="mr-2.5 h-4 w-4" />
                  <span>拍照</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleFileSelect}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Paperclip className="mr-2.5 h-4 w-4" />
                  <span>添加文件</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <ImageIcon className="mr-2.5 h-4 w-4" />
                  <span>添加图片</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 输入框 - 单行设计 */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "w-full resize-none border-0 bg-transparent text-gray-900 dark:text-white",
                  "placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none",
                  "leading-6 text-sm",
                  "h-6 overflow-hidden"
                )}
                style={{
                  height: "24px",
                  minHeight: "24px",
                  maxHeight: "24px"
                }}
              />
            </div>

            {/* 工具栏 - 紧凑设计 */}
            <div className="flex items-center gap-1">
              {/* 语音播放按钮 */}
              {lastMessage && (
                <button
                  type="button"
                  onClick={handlePlayLastMessage}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-200",
                    "bg-gray-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-700 dark:hover:bg-blue-950/20 dark:hover:text-blue-400",
                    "flex items-center justify-center",
                    isPlaying && "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  )}
                  aria-label={isPlaying ? "停止播放" : "播放最后一条消息"}
                >
                  {isPlaying ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* 语音录制按钮 */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-200",
                    "bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-red-950/20 dark:hover:text-red-400",
                    "flex items-center justify-center",
                    isVoiceRecording && "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 animate-pulse"
                  )}
                  aria-label={isVoiceRecording ? "停止录音" : "开始录音"}
                >
                  {isVoiceRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* 发送按钮 */}
              <button
                type="submit"
                disabled={isLoading || !value.trim() || disabled}
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200",
                  "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500",
                  "flex items-center justify-center",
                  "hover:scale-105 active:scale-95",
                  "shadow-sm hover:shadow-md"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>

          {/* 语音录制指示器 */}
          {isVoiceRecording && (
            <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 animate-pulse shadow-lg" />
          )}
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
