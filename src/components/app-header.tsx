'use client';

import { Menu } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export function AppHeader() {
  return (
    <header 
      className={cn(
        "sticky top-0 z-50",
        "bg-background/80 backdrop-blur-md",
        "border-b border-border/40"
      )}
    >
      <div 
        className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8"
      >
        {/* 左侧 Logo */}
        <a
          href="/"
          className="flex items-center gap-2 z-[1052] transition-opacity hover:opacity-80"
          aria-label={siteConfig.name}
        >
          <div className="flex items-center gap-2">
            {/* Logo Icon - 可以替换为实际的 logo */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
              <span className="text-sm font-bold text-white">L</span>
            </div>
            
            {/* Logo Text */}
            <span className="text-lg font-semibold tracking-tight text-foreground">
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
            "hover:bg-muted hover:text-foreground",
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

