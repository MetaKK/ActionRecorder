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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                activeTab === tab.id
                  ? [
                      // ⭐ 天空蓝渐变 - 明亮清新科技感
                      "border-sky-400/70 bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400",
                      "text-white dark:text-white",
                      "shadow-2xl shadow-sky-400/40",
                      "cursor-default",
                      // 明亮发光效果
                      "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-sky-300 before:to-cyan-300 before:blur-xl before:opacity-50 before:-z-10",
                      // 玻璃质感内发光
                      "after:absolute after:inset-[1px] after:rounded-[11px] after:bg-gradient-to-br after:from-white/25 after:to-transparent after:pointer-events-none",
                    ]
                  : [
                      "border-border/30 bg-background/50 backdrop-blur-sm text-muted-foreground",
                      "hover:border-sky-400/40 hover:bg-sky-400/5 hover:text-sky-600 dark:hover:text-sky-400",
                      "hover:shadow-md hover:shadow-sky-400/10",
                    ]
              )}
            >
              <span
                className={cn(
                  "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-300",
                  activeTab === tab.id 
                    ? "opacity-100 scale-110 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" 
                    : "opacity-50 group-hover:opacity-70"
                )}
              >
                {tab.icon}
              </span>
              <span className={cn(
                "relative z-10 text-sm font-semibold transition-all duration-300",
                activeTab === tab.id ? "tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "tracking-normal"
              )}>
                {tab.label}
              </span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-white/25 text-white backdrop-blur-sm ring-1 ring-white/40 shadow-lg"
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

        {/* 左侧渐变遮罩 - 精确匹配 ElevenLabs (w-44 = 176px) */}
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 h-full w-44 transition-opacity duration-200",
            showLeftGradient ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: 'linear-gradient(to right, hsl(var(--background)) 0%, transparent 100%)'
          }}
        />

        {/* 右侧渐变遮罩 - 精确匹配 ElevenLabs (w-44 = 176px) */}
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 h-full w-44 transition-opacity duration-200",
            showRightGradient ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: 'linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)'
          }}
        />

        {/* 左侧滚动按钮 - 天空蓝主题 */}
        <button
          aria-label="向左滚动"
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-sky-400/30 bg-background/95 backdrop-blur-md shadow-lg shadow-sky-400/20 transition-all",
            "hover:border-sky-400/50 hover:bg-sky-400/10 hover:shadow-xl hover:shadow-sky-400/30 hover:scale-110",
            "active:scale-95",
            showLeftButton ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronLeft className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </button>

        {/* 右侧滚动按钮 - 天空蓝主题 */}
        <button
          aria-label="向右滚动"
          onClick={() => scroll('right')}
          className={cn(
            "absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-sky-400/30 bg-background/95 backdrop-blur-md shadow-lg shadow-sky-400/20 transition-all",
            "hover:border-sky-400/50 hover:bg-sky-400/10 hover:shadow-xl hover:shadow-sky-400/30 hover:scale-110",
            "active:scale-95",
            showRightButton ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </button>
      </div>
    </div>
  );
}

