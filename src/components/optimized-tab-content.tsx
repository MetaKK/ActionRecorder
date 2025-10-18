/**
 * 优化的Tab内容组件 - 基于Apple设计原则
 * 
 * 特点：
 * - 流畅的过渡动画
 * - 智能预加载
 * - 即时反馈
 * - 内存优化
 */

'use client';

import { memo, Suspense, useMemo } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { 
  TimelineSkeleton, 
  StatisticsSkeleton 
} from '@/components/ui/skeleton';

// 动态导入组件
const Timeline = dynamic(
  () => import('@/components/timeline').then(mod => ({ default: mod.Timeline })),
  { 
    loading: () => <TimelineSkeleton />,
    ssr: false
  }
);

const Statistics = dynamic(
  () => import('@/components/statistics').then(mod => ({ default: mod.Statistics })),
  { 
    loading: () => <StatisticsSkeleton />,
    ssr: false
  }
);

import dynamic from 'next/dynamic';

interface OptimizedTabContentProps {
  activeTab: string;
  isLoading: boolean;
  transitionDirection: 'forward' | 'backward' | 'none';
  recordsCount: number;
}

// Apple风格的过渡动画类
const getTransitionClasses = (
  isLoading: boolean, 
  transitionDirection: 'forward' | 'backward' | 'none'
) => {
  if (!isLoading) {
    return 'animate-in fade-in duration-200';
  }

  switch (transitionDirection) {
    case 'forward':
      return 'animate-in slide-in-from-right-4 fade-in duration-200';
    case 'backward':
      return 'animate-in slide-in-from-left-4 fade-in duration-200';
    default:
      return 'animate-in fade-in duration-200';
  }
};

// 优化的Tab内容渲染器
const TabContentRenderer = memo(({ 
  activeTab, 
  isLoading, 
  transitionDirection 
}: OptimizedTabContentProps) => {
  const transitionClasses = useMemo(() => 
    getTransitionClasses(isLoading, transitionDirection),
    [isLoading, transitionDirection]
  );

  return (
    <div className={transitionClasses}>
      <ErrorBoundary>
        <Suspense fallback={
          activeTab === 'timeline' ? <TimelineSkeleton /> : <StatisticsSkeleton />
        }>
          {activeTab === 'timeline' && <Timeline />}
          {activeTab === 'statistics' && <Statistics />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

TabContentRenderer.displayName = 'TabContentRenderer';

export { TabContentRenderer };
