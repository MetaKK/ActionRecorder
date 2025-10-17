/**
 * 日记卡片组件 - Timeline 集成
 * 
 * 设计理念：
 * - 区别于普通记录卡片，使用特殊视觉样式
 * - Apple 设计风格：简洁、优雅、有深度
 * - 响应式设计：完美支持 PC 和 Mobile
 * 
 * 视觉特征：
 * - 渐变边框 + 微光效果
 * - 书籍翻页式卡片
 * - 日记图标标识
 * - 悬停动画效果
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, MoreVertical, Share2, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DiaryPreview } from '@/lib/ai/diary/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DiaryCardProps {
  diary: DiaryPreview;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onExport?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function DiaryCard({ diary, onEdit, onShare, onExport, onDelete, className }: DiaryCardProps) {

  // 根据情绪选择颜色主题
  const getMoodTheme = (mood: string) => {
    const themes: Record<string, { gradient: string; icon: string; bg: string }> = {
      '积极愉快': {
        gradient: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20',
        icon: '☀️',
        bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
      },
      '平静': {
        gradient: 'from-blue-500/20 via-cyan-500/20 to-sky-500/20',
        icon: '🌊',
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
      },
      '思考': {
        gradient: 'from-purple-500/20 via-indigo-500/20 to-violet-500/20',
        icon: '💭',
        bg: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20',
      },
      default: {
        gradient: 'from-gray-500/20 via-slate-500/20 to-zinc-500/20',
        icon: '📔',
        bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20',
      },
    };

    return themes[mood] || themes.default;
  };

  const theme = getMoodTheme(diary.mood);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn('group relative', className)}
    >
      <Link
        href={`/ai/diary/${diary.id}`}
        className="relative block"
      >
        <div className={cn(
          'relative rounded-xl border border-gray-200/60 dark:border-gray-700/60',
          'bg-[#faf9f7] dark:bg-[#1a1a1a]',
          'shadow-sm hover:shadow-md transition-all duration-200',
          'hover:border-amber-200 dark:hover:border-amber-800/40',
          'group-hover:bg-[#f8f6f3] dark:group-hover:bg-[#1f1f1f]'
        )}>
          {/* 内容区域 */}
          <div className="p-4 sm:p-5">
            {/* 头部信息 */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{theme.icon}</span>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    日记
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <time>{formatDate(diary.date)}</time>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>{diary.wordCount} 字</span>
                </div>
              </div>

              {/* 操作菜单 */}
              <div className="flex-shrink-0 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-muted active:scale-95 transition-all duration-200"
                      title="更多操作"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32 z-50">
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          onEdit(diary.id);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                    )}
                    {onShare && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          onShare(diary.id);
                        }}
                        className="cursor-pointer"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        分享
                      </DropdownMenuItem>
                    )}
                    {onExport && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          onExport(diary.id);
                        }}
                        className="cursor-pointer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        导出
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          onDelete(diary.id);
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 摘要内容 */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {diary.excerpt}
              </p>
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {diary.mood}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                查看 →
              </div>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}

/**
 * 日记卡片骨架屏
 */
export function DiaryCardSkeleton() {
  return (
    <div className="relative rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-[#faf9f7] dark:bg-[#1a1a1a] shadow-sm">
      <div className="p-4 sm:p-5 animate-pulse">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
          <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        
        <div className="mb-3 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-md" />
          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      
    </div>
  );
}

// ============================================
// 辅助函数
// ============================================

/**
 * 格式化日期显示
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  
  // 今天
  if (dateStr === formatDateStr(now)) {
    return '今天';
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDateStr(yesterday)) {
    return '昨天';
  }
  
  // 本周内
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }
  
  // 其他日期
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 今年内不显示年份
  if (year === now.getFullYear()) {
    return `${month}月${day}日`;
  }
  
  return `${year}年${month}月${day}日`;
}

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

