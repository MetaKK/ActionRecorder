"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatGPTAdaptiveInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onFileUpload?: (file: File) => void;
}

export function ChatGPTAdaptiveInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "询问任何问题...",
  onFileUpload,
}: ChatGPTAdaptiveInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 计算行数和高度
  const calculateHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // 重置高度以获取真实高度
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      // 计算行数
      const lineHeight = 24; // 基于leading-6 (24px)
      const lines = Math.ceil(scrollHeight / lineHeight);
      
      // 设置高度
      const newHeight = Math.min(Math.max(scrollHeight, 24), 200); // 最小24px，最大200px
      textarea.style.height = `${newHeight}px`;
      
      // 判断是否应该展开
      const shouldExpand = lines > 1 || value.length > 50;
      setIsExpanded(shouldExpand);
      
      return { height: newHeight, lines, shouldExpand };
    }
    return { height: 24, lines: 1, shouldExpand: false };
  }, [value]);

  // 自动调整高度
  useEffect(() => {
    const { shouldExpand } = calculateHeight();
    setIsExpanded(shouldExpand);
  }, [value, calculateHeight]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  }, [value, isLoading, disabled, onSubmit]);

  // 处理焦点
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // 处理提交
  const handleSubmit = useCallback(() => {
    if (value.trim() && !isLoading && !disabled) {
      onSubmit();
    }
  }, [value, isLoading, disabled, onSubmit]);

  // 处理文件上传
  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && onFileUpload) {
        Array.from(files).forEach(file => onFileUpload(file));
      }
    };
    input.click();
  }, [onFileUpload]);

  const canSubmit = value.trim() && !isLoading && !disabled;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
          isFocused && "ring-2 ring-blue-500/20 border-blue-500/50",
          isExpanded && "shadow-lg"
        )}
        animate={{
          scale: isFocused ? 1.01 : 1,
          height: "auto", // 让容器自适应内容高度
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        <motion.div 
          className="flex items-end gap-2 p-3"
          animate={{
            paddingTop: isExpanded ? "12px" : "12px",
            paddingBottom: isExpanded ? "12px" : "12px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Plus Button */}
          <motion.button
            type="button"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            disabled={disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFileSelect}
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </motion.button>

          {/* Textarea Container */}
          <div className="flex-1 relative">
            <motion.textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none leading-6"
              style={{ 
                height: "auto",
                minHeight: "24px",
                maxHeight: "200px",
                overflow: "hidden"
              }}
              animate={{
                height: "auto",
              }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Send Button */}
          <AnimatePresence mode="wait">
            {canSubmit && (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ 
                  duration: 0.3,
                  ease: "easeInOut"
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
