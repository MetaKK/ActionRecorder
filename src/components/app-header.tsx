'use client';

import { Menu, Sparkles } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export function AppHeader() {
  return (
    <header 
      className={cn(
        "sticky top-0 z-50",
        // 透明背景
      )}
    >
      <div 
        className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8"
      >
        {/* 左侧 Logo - 科技感彩色渐变 */}
        <a
          href="/"
          className="flex items-center gap-2.5 z-[1052] transition-all duration-300 hover:scale-[1.02]"
          aria-label={siteConfig.name}
        >
          <div className="flex items-center gap-2.5">
            {/* Logo Icon - 科技感图标 */}
            <div className="relative flex h-7 w-7 items-center justify-center">
              <Sparkles 
                className="h-6 w-6" 
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              />
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

        {/* 右侧汉堡菜单 */}
        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg",
            "text-foreground/60 transition-all duration-200",
            "hover:bg-muted/50 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="打开菜单"
          aria-expanded="false"
          onClick={() => {
            // 预留功能：打开侧边菜单，显示登录、设置等选项
            console.log('Menu clicked - 功能待实现');
          }}
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

