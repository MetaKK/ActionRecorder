/**
 * 路由性能监控组件 - 优化版本
 * 用于测试和监控路由切换性能
 * 修复了无限循环问题
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  tabSwitchTime: number;
  componentLoadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

interface RoutePerformanceMonitorProps {
  activeTab: string;
  isLoading: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function RoutePerformanceMonitor({ 
  activeTab, 
  isLoading, 
  onMetricsUpdate 
}: RoutePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    tabSwitchTime: 0,
    componentLoadTime: 0,
    renderTime: 0
  });

  const startTimeRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);
  const lastActiveTabRef = useRef<string>('');

  // 稳定的性能更新函数
  const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  }, []);

  // 监控Tab切换性能 - 使用ref避免无限循环
  useEffect(() => {
    if (isLoading && !isTrackingRef.current) {
      startTimeRef.current = performance.now();
      isTrackingRef.current = true;
    } else if (!isLoading && isTrackingRef.current) {
      const tabSwitchTime = performance.now() - startTimeRef.current;
      
      updateMetrics({ tabSwitchTime });
      
      onMetricsUpdate?.({
        tabSwitchTime,
        componentLoadTime: metrics.componentLoadTime,
        renderTime: metrics.renderTime
      });
      
      isTrackingRef.current = false;
    }
  }, [isLoading, onMetricsUpdate, updateMetrics, metrics.componentLoadTime, metrics.renderTime]);

  // 监控组件加载时间 - 只在activeTab真正变化时触发
  useEffect(() => {
    if (!activeTab || activeTab === lastActiveTabRef.current) return;
    
    lastActiveTabRef.current = activeTab;
    const componentStartTime = performance.now();
    
    const timer = setTimeout(() => {
      const componentLoadTime = performance.now() - componentStartTime;
      updateMetrics({ componentLoadTime });
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab, updateMetrics]);

  // 监控内存使用（如果支持）- 减少触发频率
  useEffect(() => {
    if ('memory' in performance && process.env.NODE_ENV === 'development') {
      const memory = (performance as any).memory;
      updateMetrics({
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      });
    }
  }, [activeTab, updateMetrics]);

  // 开发环境下显示性能指标
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded-lg font-mono">
        <div>Tab: {activeTab}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Switch: {metrics.tabSwitchTime.toFixed(2)}ms</div>
        <div>Load: {metrics.componentLoadTime.toFixed(2)}ms</div>
        {metrics.memoryUsage && (
          <div>Memory: {metrics.memoryUsage.toFixed(2)}MB</div>
        )}
      </div>
    );
  }

  return null;
}
