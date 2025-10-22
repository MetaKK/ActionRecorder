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
  onInputFocus?: () => void;
  onInputBlur?: () => void;
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
  onFileUpload,
  onInputFocus,
  onInputBlur
}: AIInputMinimalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [interimText, setInterimText] = useState(""); // 临时识别文本
  
  // ⭐ 使用 ref 追踪最新的 value，避免闭包陷阱
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // 确保客户端渲染一致性
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 语音录制功能 - 支持实时反馈
  const { 
    isRecording: isVoiceRecording, 
    isSupported: isVoiceSupported, 
    startRecording, 
    stopRecording
  } = useVoiceRecorder({
    onResult: (text) => {
      // ⭐ 使用 valueRef 获取最新的已确认文本，避免闭包陷阱和重复
      onChange(valueRef.current + text);
      // 清空临时文本
      setInterimText("");
      // 通知父组件（如果需要）
      onVoiceResult?.(text);
    },
    onInterimResult: (text) => {
      // 实时临时结果 - 仅用于显示，不修改实际 value
      setInterimText(text);
    },
    onError: (error) => {
      onVoiceError?.(error);
      setInterimText("");
    },
    preventDuplicates: true,
  });

  // 语音播放功能
  const { 
    isPlaying, 
    playText, 
    stopPlaying 
  } = useVoicePlayer();

  // 自动调整高度 - 支持多行自适应 (line-height: 24px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 24 * 6; // 最大6行 (line-height: 24px)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  // 📱 移动端滚动处理
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // 键盘弹起时也滚动，确保输入框可见
    setTimeout(() => {
      onInputFocus?.();
    }, 300);
  }, [onInputFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // 延迟执行，等待键盘完全收起（iOS 需要更长延迟）
    setTimeout(() => {
      onInputBlur?.();
    }, 300);
  }, [onInputBlur]);

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
    
    // ⭐ 如果有临时文本，先将其确认为最终文本
    if (interimText) {
      const fullText = value + interimText;
      onChange(fullText);
      setInterimText('');
      
      // 如果正在录音，先停止
      if (isVoiceRecording) {
        stopRecording();
      }
      
      // 提交完整文本
      if (!isLoading && fullText.trim() && !disabled) {
        onSubmit(fullText.trim());
      }
    } else {
      // 如果正在录音，先停止
      if (isVoiceRecording) {
        stopRecording();
      }
      
      if (!isLoading && value.trim() && !disabled) {
        onSubmit(value.trim());
      }
    }
  }, [onSubmit, isLoading, value, interimText, disabled, isVoiceRecording, stopRecording, onChange]);

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
    <div 
      className={cn(
        "flex-shrink-0 relative",
        "bg-gradient-to-b from-white/50 via-white/70 to-white/90",
        "dark:from-gray-950/50 dark:via-gray-950/70 dark:to-gray-950/90",
        "backdrop-blur-xl",
        "border-t border-gray-200/30 dark:border-gray-800/30",
        "py-3 px-3 sm:px-4",
        className
      )}
    >
      {/* 顶部光效 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200/40 dark:via-gray-700/40 to-transparent" />
      
      <div className="w-full max-w-3xl mx-auto">
        <div className={cn(
          "group relative overflow-hidden",
          "bg-white/95 dark:bg-gray-900/95",
          "rounded-[22px] border transition-all duration-300 ease-out",
          // 阴影系统 - 更细腻
          "shadow-[0_1px_4px_rgba(0,0,0,0.04),0_0.5px_1px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
          "focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]",
          // 边框和光环 - 更精致
          isFocused 
            ? "border-blue-400/70 dark:border-blue-500/70 ring-[2px] ring-blue-400/8 dark:ring-blue-500/8" 
            : "border-gray-300/70 dark:border-gray-700/70",
          isVoiceRecording && "border-purple-400/70 dark:border-purple-500/70 ring-[2px] ring-purple-400/8 dark:ring-purple-500/8"
        )}>
          {/* 内光效 - 更微妙 */}
          <div className={cn(
            "absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300",
            "bg-gradient-to-br from-blue-500/[0.02] via-transparent to-purple-500/[0.02]",
            isFocused && "opacity-100",
            isVoiceRecording && "from-purple-500/[0.02] to-blue-500/[0.02] opacity-100"
          )} />
          
          <form onSubmit={handleSubmit} className="relative flex items-center gap-1.5 px-3 py-2.5">
            {/* 添加附件菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full transition-all duration-200 ease-out",
                    "flex items-center justify-center group/btn relative",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-gray-900 dark:hover:text-gray-100",
                    "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                    "active:scale-90",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                  tabIndex={0}
                >
                  <Plus className="w-[18px] h-[18px] transition-transform group-hover/btn:rotate-90 duration-200" strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start"
                className={cn(
                  "w-48 rounded-[18px]",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
                  "border border-gray-200/60 dark:border-gray-700/60",
                  "bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl",
                  "p-1.5"
                )}
                sideOffset={12}
              >
                {/* 优化后的菜单项顺序：拍照 > 图片 > 文件 */}
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="rounded-[12px] py-2.5 px-3 cursor-pointer transition-all duration-150 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  <Camera className="mr-3 h-[18px] w-[18px] text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  <span className="text-[14px] font-medium text-gray-900 dark:text-gray-100">拍照</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="rounded-[12px] py-2.5 px-3 cursor-pointer transition-all duration-150 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  <ImageIcon className="mr-3 h-[18px] w-[18px] text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  <span className="text-[14px] font-medium text-gray-900 dark:text-gray-100">添加图片</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleFileSelect}
                  className="rounded-[12px] py-2.5 px-3 cursor-pointer transition-all duration-150 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  <Paperclip className="mr-3 h-[18px] w-[18px] text-gray-600 dark:text-gray-400" strokeWidth={2} />
                  <span className="text-[14px] font-medium text-gray-900 dark:text-gray-100">添加文件</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 输入框 - 多行自适应设计 */}
            <div className="flex-1 relative flex items-center min-h-[32px]">
              <textarea
                ref={textareaRef}
                value={value + interimText}
                onChange={(e) => {
                  // 只更新确认的文本部分
                  const newValue = e.target.value;
                  if (interimText && newValue.endsWith(interimText)) {
                    onChange(newValue.slice(0, -interimText.length));
                  } else {
                    onChange(newValue);
                  }
                }}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent",
                  "text-gray-900 dark:text-gray-50",
                  "placeholder:text-gray-400/70 dark:placeholder:text-gray-500/70",
                  "focus:outline-none focus:ring-0",
                  "leading-6 text-base font-normal antialiased",
                  "overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300/60 dark:scrollbar-thumb-gray-600/60 scrollbar-track-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "selection:bg-blue-100/80 dark:selection:bg-blue-900/30",
                  "py-0.5"
                )}
                style={{
                  minHeight: "24px",
                  maxHeight: "144px" // 6行
                }}
              />
            </div>

            {/* 工具栏 - 精致设计 */}
            <div className="flex items-center gap-1">
              {/* 语音播放按钮 */}
              {isClient && lastMessage && (
                <button
                  type="button"
                  onClick={handlePlayLastMessage}
                  disabled={disabled}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-200 ease-out",
                    "flex items-center justify-center relative",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-blue-600 dark:hover:text-blue-400",
                    "hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
                    "active:scale-90",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    isPlaying && "bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                  )}
                  aria-label={isPlaying ? "停止播放" : "播放最后一条消息"}
                >
                  {isPlaying ? (
                    <VolumeX className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  ) : (
                    <Volume2 className="h-[18px] w-[18px]" strokeWidth={2.5} />
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
                    "h-8 w-8 rounded-full transition-all duration-200 ease-out",
                    "flex items-center justify-center relative",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-purple-600 dark:hover:text-purple-400",
                    "hover:bg-purple-50/80 dark:hover:bg-purple-950/30",
                    "active:scale-90",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    isVoiceRecording && "bg-gradient-to-br from-purple-50/80 via-fuchsia-50/80 to-blue-50/80 dark:from-purple-950/40 dark:via-fuchsia-950/40 dark:to-blue-950/40 text-purple-600 dark:text-purple-400"
                  )}
                  aria-label={isVoiceRecording ? "停止录音" : "开始录音"}
                >
                  {isVoiceRecording ? (
                    <>
                      <Circle className="h-[18px] w-[18px] fill-current animate-pulse" strokeWidth={0} />
                      <span className="absolute -inset-0.5 rounded-full animate-ping opacity-30 bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400" />
                    </>
                  ) : (
                    <Mic className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  )}
                </button>
              )}

              {/* 发送按钮 - 渐变设计 */}
              <button
                type="submit"
                disabled={isLoading || !value.trim() || disabled}
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200 ease-out relative overflow-hidden",
                  "flex items-center justify-center",
                  "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-600",
                  "dark:from-blue-600 dark:via-blue-600 dark:to-blue-700",
                  "text-white",
                  "hover:from-blue-600 hover:via-blue-600 hover:to-blue-700",
                  "dark:hover:from-blue-700 dark:hover:via-blue-700 dark:hover:to-blue-800",
                  "hover:shadow-[0_2px_12px_rgba(59,130,246,0.35)] dark:hover:shadow-[0_2px_12px_rgba(59,130,246,0.25)]",
                  "active:scale-90",
                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none",
                  "shadow-[0_1px_4px_rgba(59,130,246,0.2)]"
                )}
                aria-label="发送消息"
              >
                {/* 发光效果 */}
                {!isLoading && !disabled && value.trim() && (
                  <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                )}
                {isLoading ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin relative z-10" strokeWidth={2.5} />
                ) : (
                  <Send className="h-[18px] w-[18px] relative z-10" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </form>

          {/* 语音录制精致指示器 */}
          {isVoiceRecording && (
            <div className="absolute -top-1 -right-1 pointer-events-none">
              <div className="relative h-3 w-3">
                {/* 核心光点 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500 animate-pulse shadow-md shadow-purple-500/40" />
                {/* 外层波纹 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400 animate-ping opacity-50" />
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
