/**
 * 移动端防放大Hook
 * 解决iOS Safari和Chrome Mobile输入框自动放大页面的问题
 */

'use client';

import { useEffect, useRef } from 'react';

interface UseMobileZoomFixOptions {
  /** 是否启用防放大功能 */
  enabled?: boolean;
  /** 是否在失焦时强制恢复缩放 */
  forceRestore?: boolean;
  /** 是否动态控制viewport */
  dynamicViewport?: boolean;
  /** 输入框字体大小阈值（默认16px） */
  fontSizeThreshold?: number;
}

export function useMobileZoomFix(options: UseMobileZoomFixOptions = {}) {
  const {
    enabled = true,
    forceRestore = true,
    dynamicViewport = true,
    fontSizeThreshold = 16
  } = options;

  const viewportRef = useRef<HTMLMetaElement | null>(null);
  const initialViewportRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 获取viewport meta标签
    const viewport = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
    if (viewport) {
      viewportRef.current = viewport;
      initialViewportRef.current = viewport.getAttribute('content') || '';
    }

    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth < 768;

    if (!isMobile) return;

    // 方法1: 设置全局输入框字体大小
    const setInputFontSize = () => {
      const style = document.createElement('style');
      style.textContent = `
        input, textarea, select {
          font-size: ${fontSizeThreshold}px !important;
        }
        /* 针对特定组件的输入框 */
        .record-input textarea,
        .timeline-item textarea,
        .search-input input {
          font-size: ${fontSizeThreshold}px !important;
        }
      `;
      document.head.appendChild(style);
    };

    // 方法2: 动态控制viewport
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (dynamicViewport && viewportRef.current) {
          viewportRef.current.setAttribute('content', 
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
          );
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (dynamicViewport && viewportRef.current) {
          // 恢复原始viewport设置
          viewportRef.current.setAttribute('content', initialViewportRef.current);
        }

        if (forceRestore) {
          // 强制恢复缩放
          setTimeout(() => {
            document.body.style.zoom = '1.01';
            setTimeout(() => {
              document.body.style.zoom = '1';
              // 滚动到顶部，防止页面位置偏移
              document.body.scrollTop = 0;
              document.documentElement.scrollTop = 0;
            }, 0);
          }, 100);
        }
      }
    };

    // 方法3: 监听键盘事件（iOS Safari特殊处理）
    const handleKeyboardShow = () => {
      if (dynamicViewport && viewportRef.current) {
        viewportRef.current.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    };

    const handleKeyboardHide = () => {
      if (dynamicViewport && viewportRef.current) {
        viewportRef.current.setAttribute('content', initialViewportRef.current);
      }
      
      if (forceRestore) {
        setTimeout(() => {
          document.body.style.zoom = '1.01';
          setTimeout(() => {
            document.body.style.zoom = '1';
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
          }, 0);
        }, 100);
      }
    };

    // 应用解决方案
    setInputFontSize();

    // 添加事件监听器
    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });

    // iOS Safari键盘事件监听
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      window.addEventListener('resize', handleKeyboardShow, { passive: true });
      document.addEventListener('visibilitychange', handleKeyboardHide, { passive: true });
    }

    // 清理函数
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('resize', handleKeyboardShow);
      document.removeEventListener('visibilitychange', handleKeyboardHide);
      
      // 恢复原始viewport
      if (viewportRef.current && initialViewportRef.current) {
        viewportRef.current.setAttribute('content', initialViewportRef.current);
      }
    };
  }, [enabled, forceRestore, dynamicViewport, fontSizeThreshold]);

  return {
    isEnabled: enabled,
    isMobile: typeof window !== 'undefined' && 
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
       window.innerWidth < 768)
  };
}
