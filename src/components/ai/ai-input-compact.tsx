"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Mic, 
  MicOff, 
  Plus,
  Loader2,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder, useVoicePlayer } from "@/lib/hooks/use-voice-recorder";

interface AIInputCompactProps {
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
}

export function AIInputCompact({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "询问任何问题...",
  onVoiceResult,
  onVoiceError,
  lastMessage,
  className
}: AIInputCompactProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 40)}px`;
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

  return (
    <div className={cn(
      "relative w-full max-w-4xl mx-auto",
      className
    )}>
      <div className={cn(
        "relative bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-300 ease-in-out shadow-lg",
        "hover:shadow-xl focus-within:shadow-xl",
        isFocused 
          ? "border-blue-300 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/20" 
          : "border-gray-200 dark:border-gray-700",
        isVoiceRecording && "border-red-300 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20"
      )}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
          {/* 添加按钮 */}
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

          {/* 输入框 */}
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
                "min-h-[24px] max-h-[40px] overflow-hidden"
              )}
              style={{
                height: "auto",
                minHeight: "24px",
                maxHeight: "40px"
              }}
            />
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-1">
            {/* 语音播放按钮 */}
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

            {/* 语音录制按钮 */}
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

            {/* 发送按钮 */}
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !value.trim() || disabled}
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-200",
                "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500",
                "hover:scale-105 active:scale-95",
                "shadow-sm hover:shadow-md"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {/* 语音录制指示器 */}
        {isVoiceRecording && (
          <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 animate-pulse shadow-lg" />
        )}
      </div>

      {/* 快捷提示 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded border">Enter</kbd>
            <span>发送</span>
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
            value.length > 1800 ? "text-orange-500" : "text-gray-500 dark:text-gray-400"
          )}>
            {value.length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}
