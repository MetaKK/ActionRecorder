"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ImmersiveIframeProps {
  /** iframe 源地址 */
  src: string;
  
  /** 页面标题 */
  title?: string;
  
  /** 是否允许全屏 */
  allowFullscreen?: boolean;
  
  /** 沙箱权限 */
  sandbox?: string;
  
  /** 加载提示文本 */
  loadingText?: string;
  
  /** 额外的 iframe 属性 */
  iframeProps?: React.IframeHTMLAttributes<HTMLIFrameElement>;
}

/**
 * 沉浸式 iframe 组件
 * 用于嵌入外部网页，提供无感知的沉浸式体验
 */
export function ImmersiveIframe({
  src,
  title = "外部内容",
  allowFullscreen = true,
  sandbox = "allow-scripts allow-same-origin allow-forms allow-popups",
  loadingText = "加载中...",
  iframeProps = {},
}: ImmersiveIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 重置状态
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-900">
      {/* 加载状态 */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center
            bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
        >
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            {loadingText}
          </p>
        </motion.div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center
            bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800"
        >
          <div className="text-center px-6">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-gray-900 dark:text-gray-100 text-xl font-semibold mb-2">
              加载失败
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              无法加载外部内容，请检查网络连接或稍后再试
            </p>
          </div>
        </motion.div>
      )}

      {/* iframe 内容 */}
      <iframe
        src={src}
        title={title}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        allow={allowFullscreen ? "fullscreen" : ""}
        sandbox={sandbox}
        {...iframeProps}
        style={{
          display: hasError ? 'none' : 'block',
        }}
      />
    </div>
  );
}

