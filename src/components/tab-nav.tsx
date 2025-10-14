/**
 * Tab 导航组件 - 参考 ElevenLabs 设计
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
          className="scrollbar-none flex gap-2 overflow-x-auto w-full md:justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              disabled={activeTab === tab.id}
              className={cn(
                "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                activeTab === tab.id
                  ? "border-foreground/20 bg-foreground text-background shadow-md cursor-default"
                  : "border-border/40 bg-background/80 backdrop-blur-sm text-muted-foreground hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center transition-opacity",
                  activeTab === tab.id ? "opacity-100" : "opacity-50"
                )}
              >
                {tab.icon}
              </span>
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    activeTab === tab.id
                      ? "bg-background/20 text-background"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          {/* 占位元素，确保右侧有空间 */}
          <div className="w-11 shrink-0 md:w-0" />
        </div>

        {/* 左侧渐变遮罩 */}
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 h-full w-11 bg-gradient-to-r from-background to-transparent transition-opacity duration-200",
            showLeftGradient ? "opacity-100" : "opacity-0"
          )}
        />

        {/* 右侧渐变遮罩 */}
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 h-full w-11 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
            showRightGradient ? "opacity-100" : "opacity-0"
          )}
        />

        {/* 左侧滚动按钮 */}
        <button
          aria-label="向左滚动"
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-background shadow-sm transition-all hover:bg-muted/50",
            showLeftButton ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* 右侧滚动按钮 */}
        <button
          aria-label="向右滚动"
          onClick={() => scroll('right')}
          className={cn(
            "absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-background shadow-sm transition-all hover:bg-muted/50",
            showRightButton ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

