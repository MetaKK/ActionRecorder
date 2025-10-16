"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  VolumeX,
  X,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder, useVoicePlayer } from "@/lib/hooks/use-voice-recorder";

interface AIInputOptimizedProps {
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
  lastMessage?: string;
}

export function AIInputOptimized({
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
}: AIInputOptimizedProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{file: File, preview: string, type: 'image' | 'file'}[]>([]);
  const [isComposing, setIsComposing] = useState(false);

  // 语音录制功能
  const { 
    isRecording, 
    startRecording, 
    stopRecording
  } = useVoiceRecorder({
    onResult: onVoiceResult,
    onError: onVoiceError,
  });

  // 语音播放功能
  const { 
    isPlaying, 
    playText, 
    stopPlaying 
  } = useVoicePlayer();

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // 语音转录结果通过onVoiceResult回调处理

  // 处理文件上传
  const handleFileUpload = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      onImageUpload?.(file);
    } else {
      onFileUpload?.(file);
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setPreviewFiles(prev => [...prev, {
        file,
        preview,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      }]);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload, onFileUpload]);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // 处理拖拽
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      handleFileUpload(file);
    });
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // 移除预览文件
  const removePreview = useCallback((index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(e);
      }
    }
  }, [onSubmit, isLoading, value, isComposing]);

  // 处理语音录制
  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
      onVoiceStop?.();
    } else {
      startRecording();
      onVoiceStart?.();
    }
  }, [isRecording, startRecording, stopRecording, onVoiceStart, onVoiceStop]);

  // 处理语音播放
  const handleVoicePlay = useCallback(() => {
    if (isPlaying) {
      stopPlaying();
    } else if (lastMessage) {
      playText(lastMessage);
    }
  }, [isPlaying, stopPlaying, playText, lastMessage]);

  return (
    <div className="relative">
      {/* 拖拽覆盖层 */}
      {dragOver && (
        <div className="absolute inset-0 z-10 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">拖拽文件到此处</p>
          </div>
        </div>
      )}

      {/* 文件预览 */}
      {previewFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {previewFiles.map((item, index) => (
            <div key={index} className="relative group">
              {item.type === 'image' ? (
                <div className="relative">
                  <img
                    src={item.preview}
                    alt=""
                    className="h-16 w-16 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePreview(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded border">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm truncate max-w-20">{item.file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => removePreview(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          placeholder="输入消息... (支持拖拽文件上传)"
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[60px] max-h-[200px] resize-none pr-20",
            dragOver && "border-primary"
          )}
        />

        {/* 工具栏 */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* 图片上传 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="h-8 w-8 p-0"
            title="上传图片"
          >
            <Image className="h-4 w-4" />
          </Button>

          {/* 文件上传 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="h-8 w-8 p-0"
            title="上传文件"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* 语音录制 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleVoiceToggle}
            disabled={disabled || isLoading}
            className={cn(
              "h-8 w-8 p-0",
              isRecording && "text-red-500"
            )}
            title={isRecording ? "停止录音" : "开始录音"}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* 语音播放 */}
          {lastMessage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoicePlay}
              disabled={disabled || isLoading}
              className={cn(
                "h-8 w-8 p-0",
                isPlaying && "text-primary"
              )}
              title={isPlaying ? "停止播放" : "播放最后一条消息"}
            >
              {isPlaying ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* 发送按钮 */}
          <Button
            type="submit"
            size="sm"
            onClick={onSubmit}
            disabled={disabled || isLoading || !value.trim()}
            className="h-8 w-8 p-0"
            title="发送消息"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
