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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Edit3, Calendar, TrendingUp } from 'lucide-react';
import { DiaryPreview } from '@/lib/ai/diary/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DiaryCardProps {
  diary: DiaryPreview;
  onEdit?: (id: string) => void;
  className?: string;
}

export function DiaryCard({ diary, onEdit, className }: DiaryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn('group relative', className)}
    >
      {/* 特殊标识：渐变边框 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-all duration-300" />
      
      <Link
        href={`/ai/diary/${diary.id}`}
        className="relative block"
      >
        <div className={cn(
          'relative rounded-2xl p-4 sm:p-6 transition-all duration-300',
          'border-2 border-transparent',
          'shadow-sm hover:shadow-xl',
          theme.bg,
          'backdrop-blur-xl',
          'transform hover:scale-[1.02] active:scale-[0.98]'
        )}>
          {/* 日记标识 - 左上角 */}
          <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4">
            <motion.div
              animate={{
                rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
          </div>

          {/* 装饰性微光效果 */}
          <motion.div
            animate={{
              opacity: isHovered ? [0.3, 0.6, 0.3] : 0,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl',
              `bg-gradient-to-br ${theme.gradient}`,
              'pointer-events-none'
            )}
          />

          {/* 内容区域 */}
          <div className="relative space-y-3 sm:space-y-4">
            {/* 标题行 */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl sm:text-2xl">{theme.icon}</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    今日日记
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <time>{formatDate(diary.date)}</time>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{diary.wordCount} 字</span>
                </div>
              </div>

              {/* 编辑按钮 */}
              {onEdit && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(diary.id);
                  }}
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                  title="编辑日记"
                >
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                </motion.button>
              )}
            </div>

            {/* 摘要内容 */}
            <div className="relative">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                {diary.excerpt}
              </p>
              
              {/* 渐变遮罩 */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
            </div>

            {/* 底部装饰 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    {diary.mood}
                  </span>
                </div>
              </div>

              <motion.div
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400"
              >
                查看详情 →
              </motion.div>
            </div>
          </div>

          {/* 书籍装订线装饰 */}
          <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-amber-300 via-orange-400 to-yellow-300 rounded-r-full opacity-30" />
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
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl opacity-10 blur" />
      <div className="relative rounded-2xl p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
        <div className="space-y-3 sm:space-y-4 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48" />
            </div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6" />
          </div>
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

