/**
 * 性能监控组件
 * 在应用启动时初始化性能监控
 */

'use client';

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/utils/performance';

export function PerformanceMonitor() {
  useEffect(() => {
    // 在客户端初始化性能监控
    initPerformanceMonitoring();
  }, []);
  
  // 这个组件不渲染任何UI
  return null;
}

