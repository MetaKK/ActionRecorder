/**
 * 性能监控工具
 * 基于Web Vitals进行性能监控和分析
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { isDev, isProd } from './env';

// 性能指标阈值（基于Web Vitals建议）
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

type PerformanceRating = 'good' | 'needs-improvement' | 'poor';

/**
 * 评估性能指标等级
 */
function getRating(metric: Metric): PerformanceRating {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (metric.value <= threshold.good) return 'good';
  if (metric.value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * 性能指标回调函数
 */
function handleMetric(metric: Metric) {
  const rating = getRating(metric);
  
  // 开发环境：输出到控制台
  if (isDev()) {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} ${metric.name}:`,
      Math.round(metric.value),
      'ms',
      `(${rating})`
    );
  }
  
  // 生产环境：可以发送到分析服务
  if (isProd()) {
    // 这里可以集成Google Analytics、Sentry等
    // sendToAnalytics(metric);
  }
  
  // 保存到localStorage用于开发调试（仅开发环境）
  if (typeof window !== 'undefined' && isDev()) {
    const perfData = JSON.parse(localStorage.getItem('perf-metrics') || '{}');
    perfData[metric.name] = {
      value: metric.value,
      rating,
      timestamp: Date.now(),
    };
    localStorage.setItem('perf-metrics', JSON.stringify(perfData));
  }
}

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring() {
  // 仅在客户端执行
  if (typeof window === 'undefined') return;
  
  try {
    // 监听所有Web Vitals指标
    // 注意：FID已被INP取代，从web-vitals v3开始
    onCLS(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
    
    console.log('🎯 Performance monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

/**
 * 获取当前性能指标
 */
export function getPerformanceMetrics(): Record<string, { value: number; rating: PerformanceRating; timestamp: number }> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem('perf-metrics');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * 清除性能指标
 */
export function clearPerformanceMetrics() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('perf-metrics');
  }
}

/**
 * 自定义性能标记
 */
export function mark(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
  }
}

/**
 * 测量两个标记之间的时间
 */
export function measure(name: string, startMark: string, endMark?: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      const endM = endMark || performance.now().toString();
      performance.measure(name, startMark, endM);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        console.log(`⏱️ ${name}:`, Math.round(measure.duration), 'ms');
        return measure.duration;
      }
    } catch (error) {
      console.error('Performance measurement failed:', error);
    }
  }
  return null;
}

