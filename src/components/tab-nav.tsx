/**
 * Tab 导航组件 - 参考 ElevenLabs 设计
 * 优化版本：科技感高亮 + 自动居中滚动 + 平滑渐变遮罩
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNav({ tabs, activeTab, onTabChange, className }: TabNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // 检查滚动状态
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasOverflow = scrollWidth > clientWidth;
    
    setShowLeftGradient(hasOverflow && scrollLeft > 10);
    setShowRightGradient(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
    setShowLeftButton(hasOverflow && scrollLeft > 10);
    setShowRightButton(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  // 滚动到指定Tab并居中显示
  const scrollToTab = (tabId: string) => {
    const container = scrollContainerRef.current;
    const tabElement = tabRefs.current.get(tabId);
    
    if (!container || !tabElement) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tabElement.getBoundingClientRect();
    
    // 计算Tab中心点相对于容器中心点的偏移
    const tabCenter = tabRect.left + tabRect.width / 2;
    const containerCenter = containerRect.left + containerRect.width / 2;
    const offset = tabCenter - containerCenter;
    
    // 滚动到目标位置
    container.scrollBy({
      left: offset,
      behavior: 'smooth'
    });
  };

  // 处理Tab切换
  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    // 延迟执行以确保DOM已更新
    setTimeout(() => scrollToTab(tabId), 50);
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={cn("relative mb-8", className)}>
      <div className="relative flex justify-center">
        {/* 滚动容器 */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="scrollbar-none flex gap-3 overflow-x-auto w-full md:justify-center px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              onClick={() => handleTabChange(tab.id)}
              disabled={activeTab === tab.id}
              className={cn(
                "relative inline-flex h-11 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border px-5 transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                activeTab === tab.id
                  ? [
                      // 科技感蓝色渐变高亮
                      "border-blue-500/50 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-purple-500/20",
                      "text-blue-600 dark:text-blue-400",
                      "shadow-lg shadow-blue-500/25",
                      "cursor-default",
                      // 发光效果
                      "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-blue-500/10 before:to-purple-500/10 before:blur-sm before:-z-10",
                    ]
                  : [
                      "border-border/30 bg-background/50 backdrop-blur-sm text-muted-foreground",
                      "hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400",
                      "hover:shadow-md hover:shadow-blue-500/10",
                    ]
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-300",
                  activeTab === tab.id 
                    ? "opacity-100 scale-110" 
                    : "opacity-50 group-hover:opacity-70"
                )}
              >
                {tab.icon}
              </span>
              <span className={cn(
                "text-sm font-semibold transition-all duration-300",
                activeTab === tab.id ? "tracking-wide" : "tracking-normal"
              )}>
                {tab.label}
              </span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-blue-500/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/50"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          {/* 占位元素，确保右侧有空间 */}
          <div className="w-16 shrink-0 md:w-0" />
        </div>

        {/* 左侧渐变遮罩 - 精确匹配 ElevenLabs 宽度和位置 */}
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent transition-opacity duration-200",
            showLeftGradient ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: 'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 30%, transparent 100%)'
          }}
        />

        {/* 右侧渐变遮罩 - 精确匹配 ElevenLabs */}
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
            showRightGradient ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: 'linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 30%, transparent 100%)'
          }}
        />

        {/* 左侧滚动按钮 - 科技感优化 */}
        <button
          aria-label="向左滚动"
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-blue-500/30 bg-background/95 backdrop-blur-md shadow-lg shadow-blue-500/20 transition-all",
            "hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-110",
            "active:scale-95",
            showLeftButton ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>

        {/* 右侧滚动按钮 - 科技感优化 */}
        <button
          aria-label="向右滚动"
          onClick={() => scroll('right')}
          className={cn(
            "absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-blue-500/30 bg-background/95 backdrop-blur-md shadow-lg shadow-blue-500/20 transition-all",
            "hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-110",
            "active:scale-95",
            showRightButton ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  );
}

