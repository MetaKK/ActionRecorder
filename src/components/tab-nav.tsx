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
      {/* Apple 风格：Tab 导航 */}
      <div className="relative flex items-center justify-center">
        {/* Tab 滚动容器 */}
        <div className="relative flex flex-1 justify-center">
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
                "relative inline-flex h-11 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border px-5",
                // Apple 风格：平滑自然的过渡效果，使用贝塞尔曲线
                "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                // 聚焦状态：参考苹果设计，明显的放大 + 光晕
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "focus-visible:scale-110 focus-visible:shadow-2xl focus-visible:shadow-cyan-500/50",
                "focus-visible:z-10",
                activeTab === tab.id
                  ? [
                      // 💫 激活状态 - 大气显眼的科技风格
                      "border-cyan-300/50 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500",
                      "text-white dark:text-white",
                      "shadow-2xl shadow-cyan-500/40",
                      "scale-105",
                      "cursor-default",
                      // 强烈的光晕效果
                      "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-sky-400/60 before:to-cyan-400/60 before:blur-2xl before:opacity-80 before:-z-10",
                      // 顶部高光
                      "after:absolute after:inset-[1px] after:rounded-[11px] after:bg-gradient-to-br after:from-white/30 after:to-transparent after:pointer-events-none",
                    ]
                  : [
                      // 💫 未激活状态 - 轻盈简洁
                      "border-border/25 bg-background/40 backdrop-blur-sm text-muted-foreground",
                      "hover:border-cyan-400/35 hover:bg-gradient-to-br hover:from-sky-400/10 hover:to-cyan-400/10",
                      "hover:text-cyan-600 dark:hover:text-cyan-400",
                      "hover:shadow-md hover:shadow-cyan-400/8",
                      "hover:scale-[1.02]",
                    ]
              )}
            >
              <span
                className={cn(
                  "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-500 ease-out",
                  activeTab === tab.id 
                    ? "opacity-100 scale-125 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                    : "opacity-50 group-hover:opacity-75"
                )}
              >
                {tab.icon}
              </span>
              <span className={cn(
                "relative z-10 font-semibold transition-all duration-500 ease-out",
                activeTab === tab.id 
                  ? "text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" 
                  : "text-sm tracking-normal"
              )}>
                {tab.label}
              </span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold transition-all duration-500 ease-out",
                    activeTab === tab.id
                      ? "bg-white/30 text-white ring-2 ring-white/50 shadow-xl shadow-white/30 scale-110"
                      : "bg-muted/50 text-muted-foreground scale-100"
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

          {/* 左侧滚动按钮 - 增强可见性 */}
          <button
            aria-label="向左滚动"
            onClick={() => scroll('left')}
            className={cn(
              "absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
              "border-2 border-cyan-400/60 bg-background/95 backdrop-blur-md",
              "shadow-xl shadow-cyan-500/30 transition-all duration-300",
              "hover:border-cyan-500/80 hover:bg-gradient-to-br hover:from-sky-400/20 hover:to-cyan-400/20",
              "hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-125",
              "active:scale-100",
              showLeftButton ? "pointer-events-auto opacity-100 visible" : "pointer-events-none opacity-0 invisible"
            )}
          >
            <ChevronLeft className="h-5 w-5 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
          </button>

          {/* 右侧滚动按钮 - 增强可见性 */}
          <button
            aria-label="向右滚动"
            onClick={() => scroll('right')}
            className={cn(
              "absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
              "border-2 border-cyan-400/60 bg-background/95 backdrop-blur-md",
              "shadow-xl shadow-cyan-500/30 transition-all duration-300",
              "hover:border-cyan-500/80 hover:bg-gradient-to-br hover:from-sky-400/20 hover:to-cyan-400/20",
              "hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-125",
              "active:scale-100",
              showRightButton ? "pointer-events-auto opacity-100 visible" : "pointer-events-none opacity-0 invisible"
            )}
          >
            <ChevronRight className="h-5 w-5 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

