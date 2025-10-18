/**
 * 简化的性能监控组件
 * 避免无限循环问题，专注于核心性能指标
 */

'use client';

import { useEffect, useRef } from 'react';

interface SimplePerformanceMonitorProps {
  activeTab: string;
  isLoading: boolean;
}

export function SimplePerformanceMonitor({ 
  activeTab, 
  isLoading 
}: SimplePerformanceMonitorProps) {
  const startTimeRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);

  // 简化的性能监控 - 只在开发环境
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    if (isLoading && !isTrackingRef.current) {
      startTimeRef.current = performance.now();
      isTrackingRef.current = true;
    } else if (!isLoading && isTrackingRef.current) {
      const tabSwitchTime = performance.now() - startTimeRef.current;
      console.log(`Tab switch time: ${tabSwitchTime.toFixed(2)}ms`);
      isTrackingRef.current = false;
    }
  }, [isLoading]);

  // 开发环境下显示简单的性能指标
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded-lg font-mono">
        <div>Tab: {activeTab}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Time: {new Date().toLocaleTimeString()}</div>
      </div>
    );
  }

  return null;
}
