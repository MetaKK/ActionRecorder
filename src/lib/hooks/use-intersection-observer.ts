/**
 * Intersection Observer Hook - 用于懒加载和无限滚动
 */

'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean; // 一旦可见就停止观察
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [RefObject<HTMLDivElement | null>, boolean] {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 如果已经可见且设置了冻结，则不再观察
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);

        // 如果设置了冻结且已可见，停止观察
        if (freezeOnceVisible && isIntersecting) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return [elementRef, isVisible];
}

/**
 * 批量懒加载 Hook
 * 用于列表项的渐进式加载
 * 优化：添加防抖，减少触发距离
 */
export function useProgressiveLoading(totalItems: number, batchSize: number = 10) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [isLoading, setIsLoading] = useState(false);
  const [sentinelRef, isVisible] = useIntersectionObserver({
    rootMargin: '100px', // 从200px减少到100px，减少提前加载
  });

  useEffect(() => {
    if (isVisible && visibleCount < totalItems && !isLoading) {
      // 防抖：避免频繁触发
      setIsLoading(true);
      
      // 使用 requestAnimationFrame 优化性能
      requestAnimationFrame(() => {
        setVisibleCount(prev => Math.min(prev + batchSize, totalItems));
        
        // 300ms 后允许下次加载
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      });
    }
  }, [isVisible, visibleCount, totalItems, batchSize, isLoading]);

  return {
    visibleCount,
    sentinelRef,
    hasMore: visibleCount < totalItems,
  };
}

