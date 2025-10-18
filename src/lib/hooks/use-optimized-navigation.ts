/**
 * 优化的导航Hook - 基于Apple设计原则
 * 
 * 特点：
 * - 预加载关键组件
 * - 流畅的过渡动画
 * - 智能缓存策略
 * - 即时反馈
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface NavigationState {
  activeTab: string;
  isLoading: boolean;
  transitionDirection: 'forward' | 'backward' | 'none';
}

interface UseOptimizedNavigationOptions {
  defaultTab?: string;
  preloadTabs?: string[];
  enableSmoothTransitions?: boolean;
  cacheStrategy?: 'aggressive' | 'conservative' | 'smart';
}

export function useOptimizedNavigation(options: UseOptimizedNavigationOptions = {}) {
  const {
    defaultTab = 'timeline',
    preloadTabs = ['timeline'],
    enableSmoothTransitions = true,
    cacheStrategy = 'smart'
  } = options;

  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeTab: defaultTab,
    isLoading: false,
    transitionDirection: 'none'
  });

  const preloadedComponents = useRef<Set<string>>(new Set());
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // 预加载组件
  const preloadComponent = useCallback(async (tabId: string) => {
    if (preloadedComponents.current.has(tabId)) return;

    try {
      // 根据tabId预加载对应组件
      switch (tabId) {
        case 'timeline':
          await import('@/components/timeline');
          break;
        case 'statistics':
          await import('@/components/statistics');
          break;
        default:
          break;
      }
      
      preloadedComponents.current.add(tabId);
    } catch (error) {
      console.warn(`Failed to preload component for tab: ${tabId}`, error);
    }
  }, []);

  // 智能预加载策略
  useEffect(() => {
    const preloadStrategy = () => {
      switch (cacheStrategy) {
        case 'aggressive':
          // 预加载所有可能的组件
          ['timeline', 'statistics'].forEach(preloadComponent);
          break;
        case 'conservative':
          // 只预加载当前tab
          preloadComponent(navigationState.activeTab);
          break;
        case 'smart':
        default:
          // 预加载当前tab和预定义的重要tab
          preloadTabs.forEach(preloadComponent);
          break;
      }
    };

    // 延迟预加载，避免阻塞初始渲染
    const timeoutId = setTimeout(preloadStrategy, 100);
    return () => clearTimeout(timeoutId);
  }, [navigationState.activeTab, preloadTabs, cacheStrategy, preloadComponent]);

  // 优化的Tab切换函数
  const switchTab = useCallback((tabId: string) => {
    if (tabId === navigationState.activeTab) return;

    // 清除之前的过渡超时
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // 确定过渡方向
    const tabOrder = ['timeline', 'statistics'];
    const currentIndex = tabOrder.indexOf(navigationState.activeTab);
    const targetIndex = tabOrder.indexOf(tabId);
    const direction = targetIndex > currentIndex ? 'forward' : 'backward';

    setNavigationState(prev => ({
      ...prev,
      activeTab: tabId,
      isLoading: true,
      transitionDirection: direction
    }));

    // 预加载目标组件
    preloadComponent(tabId);

    // 模拟加载时间，确保过渡动画完成
    if (enableSmoothTransitions) {
      transitionTimeoutRef.current = setTimeout(() => {
        setNavigationState(prev => ({
          ...prev,
          isLoading: false,
          transitionDirection: 'none'
        }));
      }, 150); // Apple风格的快速过渡
    } else {
      setNavigationState(prev => ({
        ...prev,
        isLoading: false,
        transitionDirection: 'none'
      }));
    }
  }, [navigationState.activeTab, enableSmoothTransitions, preloadComponent]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    activeTab: navigationState.activeTab,
    isLoading: navigationState.isLoading,
    transitionDirection: navigationState.transitionDirection,
    switchTab,
    preloadComponent
  };
}
