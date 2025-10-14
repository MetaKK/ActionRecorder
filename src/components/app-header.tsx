'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 滚动超过 20px 时触发背景变化
      setIsScrolled(window.scrollY > 20);
    };

    // 初始检查
    handleScroll();

    // 监听滚动
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-50",
        "transition-all duration-500 ease-out",
        // Apple 风格：滚动后显示毛玻璃背景
        isScrolled && [
          "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
          "border-b border-border/20",
          "shadow-sm shadow-black/5"
        ]
      )}
    >
      <div 
        className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8"
      >
        {/* 左侧 Logo - Apple 风格科技感 */}
        <a
          href="/"
          className="flex items-center gap-2.5 z-[1052] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          aria-label={siteConfig.name}
        >
          <div className="flex items-center gap-2.5">
            {/* Logo Icon - 渐变色 SVG */}
            <div className="relative flex h-7 w-7 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <defs>
                  <linearGradient id="sparkles-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <path
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L12.75 18.75l1.933-.394a2.25 2.25 0 001.423-1.423l.394-1.933.394 1.933a2.25 2.25 0 001.423 1.423l1.933.394-1.933.394a2.25 2.25 0 00-1.423 1.423z"
                  fill="url(#sparkles-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            {/* Logo Text - 彩色渐变文字 */}
            <span 
              className="text-lg font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {siteConfig.name}
            </span>
          </div>
        </a>

        {/* 右侧汉堡菜单 - Apple 风格 */}
        <button
          type="button"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            "text-foreground/60 transition-all duration-200 ease-out",
            "hover:bg-foreground/5 hover:text-foreground",
            "active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          )}
          aria-label="打开菜单"
          aria-expanded="false"
          onClick={() => {
            // 预留功能：打开侧边菜单，显示登录、设置等选项
            console.log('Menu clicked - 功能待实现');
          }}
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}

