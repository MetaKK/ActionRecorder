"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Send, 
  Mic, 
  Plus,
  Loader2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Camera,
  Paperclip,
  Circle
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
  const [isClient, setIsClient] = useState(false);

  // 确保客户端渲染一致性
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // 自动调整高度 - 支持多行自适应 (line-height: 28px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 28 * 6; // 最大6行 (line-height: 28px)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
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
      "flex-shrink-0 relative",
      "bg-gradient-to-b from-white/60 via-white/80 to-white/95",
      "dark:from-gray-950/60 dark:via-gray-950/80 dark:to-gray-950/95",
      "backdrop-blur-2xl",
      "border-t border-gray-200/40 dark:border-gray-800/40",
      "py-5 px-4 sm:px-6",
      className
    )}>
      {/* 顶部光效 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-700/50 to-transparent" />
      
      <div className="w-full max-w-4xl mx-auto">
        <div className={cn(
          "group relative overflow-hidden",
          "bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50",
          "rounded-[26px] border-[1.5px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          // 阴影系统
          "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]",
          "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)]",
          "focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]",
          // 边框和光环
          isFocused 
            ? "border-blue-400/60 dark:border-blue-500/60 ring-[3px] ring-blue-400/10 dark:ring-blue-500/10" 
            : "border-gray-300/60 dark:border-gray-700/60",
          isVoiceRecording && "border-purple-400/60 dark:border-purple-500/60 ring-[3px] ring-purple-400/10 dark:ring-purple-500/10 animate-pulse"
        )}>
          {/* 内光效 */}
          <div className={cn(
            "absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500",
            "bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5",
            isFocused && "opacity-100",
            isVoiceRecording && "from-purple-500/5 to-blue-500/5 opacity-100"
          )} />
          
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2.5 px-4 py-3.5">
            {/* 添加附件菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full transition-all duration-300 ease-out",
                    "flex items-center justify-center group/btn relative",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-gray-900 dark:hover:text-gray-100",
                    "hover:bg-gray-100/90 dark:hover:bg-gray-800/90",
                    "hover:shadow-sm hover:scale-105",
                    "active:scale-95 active:shadow-none",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                  tabIndex={0}
                >
                  <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90 duration-300" strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start"
                className={cn(
                  "w-56 rounded-[20px]",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
                  "border-[1.5px] border-gray-200/70 dark:border-gray-700/70",
                  "bg-white/98 dark:bg-gray-900/98 backdrop-blur-3xl",
                  "p-2"
                )}
                sideOffset={18}
              >
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="rounded-[14px] py-3 px-4 cursor-pointer transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  <Camera className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-300" strokeWidth={2} />
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">拍照</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleFileSelect}
                  className="rounded-[14px] py-3 px-4 cursor-pointer transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  <Paperclip className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-300" strokeWidth={2} />
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">添加文件</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-transparent via-gray-300/50 dark:via-gray-600/50 to-transparent h-[1px]" />
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="rounded-[14px] py-3 px-4 cursor-pointer transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  <ImageIcon className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-300" strokeWidth={2} />
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">添加图片</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 输入框 - 多行自适应设计 */}
            <div className="flex-1 relative min-h-[28px]">
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
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent",
                  "text-gray-900 dark:text-gray-50",
                  "placeholder:text-gray-400/80 dark:placeholder:text-gray-500/80",
                  "focus:outline-none focus:ring-0",
                  "leading-7 text-[15px] font-normal antialiased",
                  "overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "selection:bg-blue-100 dark:selection:bg-blue-900/30"
                )}
                style={{
                  minHeight: "28px",
                  maxHeight: "168px" // 6行
                }}
              />
            </div>

            {/* 工具栏 - 精致设计 */}
            <div className="flex items-center gap-2 pb-1">
              {/* 语音播放按钮 */}
              {isClient && lastMessage && (
                <button
                  type="button"
                  onClick={handlePlayLastMessage}
                  disabled={disabled}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all duration-300 ease-out",
                    "flex items-center justify-center relative overflow-hidden",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-blue-600 dark:hover:text-blue-400",
                    "hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50",
                    "dark:hover:from-blue-950/40 dark:hover:to-cyan-950/40",
                    "hover:shadow-sm hover:scale-105",
                    "active:scale-95 active:shadow-none",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
                    isPlaying && "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 text-blue-600 dark:text-blue-400 shadow-sm scale-105"
                  )}
                  aria-label={isPlaying ? "停止播放" : "播放最后一条消息"}
                >
                  {isPlaying ? (
                    <VolumeX className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Volume2 className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              )}

              {/* 语音录制按钮 */}
              {isClient && isVoiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={disabled}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all duration-300 ease-out",
                    "flex items-center justify-center relative overflow-hidden",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-purple-600 dark:hover:text-purple-400",
                    "hover:bg-gradient-to-br hover:from-purple-50 hover:via-fuchsia-50 hover:to-blue-50",
                    "dark:hover:from-purple-950/40 dark:hover:via-fuchsia-950/40 dark:hover:to-blue-950/40",
                    "hover:shadow-sm hover:scale-105",
                    "active:scale-95 active:shadow-none",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
                    isVoiceRecording && "bg-gradient-to-br from-purple-50 via-fuchsia-50 to-blue-50 dark:from-purple-950/50 dark:via-fuchsia-950/50 dark:to-blue-950/50 text-purple-600 dark:text-purple-400 shadow-md scale-105"
                  )}
                  aria-label={isVoiceRecording ? "停止录音" : "开始录音"}
                >
                  {isVoiceRecording ? (
                    <>
                      <Circle className="h-5 w-5 fill-current animate-pulse" strokeWidth={0} />
                      <span className="absolute -inset-1 rounded-full animate-ping opacity-40 bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400" />
                    </>
                  ) : (
                    <Mic className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              )}

              {/* 发送按钮 - 渐变设计 */}
              <button
                type="submit"
                disabled={isLoading || !value.trim() || disabled}
                className={cn(
                  "h-10 w-10 rounded-full transition-all duration-300 ease-out relative overflow-hidden",
                  "flex items-center justify-center",
                  "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600",
                  "dark:from-blue-600 dark:via-blue-700 dark:to-cyan-700",
                  "text-white",
                  "hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700",
                  "dark:hover:from-blue-700 dark:hover:via-blue-800 dark:hover:to-cyan-800",
                  "hover:shadow-[0_4px_16px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_4px_16px_rgba(59,130,246,0.3)]",
                  "hover:scale-105",
                  "active:scale-95 active:shadow-sm",
                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100",
                  "shadow-[0_2px_8px_rgba(59,130,246,0.25)]"
                )}
                aria-label="发送消息"
              >
                {/* 发光效果 */}
                {!isLoading && !disabled && value.trim() && (
                  <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Send className="h-5 w-5 relative z-10" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </form>

          {/* 语音录制多层波纹指示器 */}
          {isVoiceRecording && (
            <div className="absolute -top-1.5 -right-1.5 pointer-events-none">
              <div className="relative h-4 w-4">
                {/* 核心光点 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500 animate-pulse shadow-lg shadow-purple-500/50" />
                {/* 第一层波纹 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400 animate-ping opacity-60" />
                {/* 第二层波纹 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-fuchsia-300 to-blue-300 animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
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
