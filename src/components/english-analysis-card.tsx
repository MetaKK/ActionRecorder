/**
 * 英语学习分析卡片组件 - Timeline 集成
 * 
 * 设计理念：
 * - 与日记卡片类似的视觉风格
 * - Apple 设计风格：简洁、优雅、有深度
 * - 响应式设计：完美支持 PC 和 Mobile
 * 
 * 视觉特征：
 * - 渐变边框 + 微光效果
 * - 学习分析专用卡片样式
 * - 英语学习图标标识
 * - 悬停动画效果
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Share2, ExternalLink, BookOpen, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EnglishAnalysisCardProps {
  analysis: {
    type: 'english_analysis';
    title: string;
    description: string;
    score: number;
    passed: boolean;
    turns: number;
    analysisUrl: string;
    timestamp: number;
    summary: {
      grammarAccuracy: number;
      vocabularyDiversity: number;
      strengths: string[];
      mainIssues: string[];
    };
  };
  onShare?: (url: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function EnglishAnalysisCard({ analysis, onShare, onDelete, className }: EnglishAnalysisCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShare) {
      onShare(analysis.analysisUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(analysis.analysisUrl);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPassStatus = (passed: boolean) => {
    return passed ? '✅ 通过' : '❌ 未通过';
  };

  const getPassStatusColor = (passed: boolean) => {
    return passed 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn('group relative', className)}
    >
      <Link
        href={analysis.analysisUrl}
        className="relative block"
      >
        <div className={cn(
          'relative rounded-xl border border-gray-200/60 dark:border-gray-700/60',
          'bg-[#faf9f7] dark:bg-[#1a1a1a]',
          'shadow-sm hover:shadow-md transition-all duration-200',
          'hover:border-blue-200 dark:hover:border-blue-800/40',
          'group-hover:bg-[#f8f6f3] dark:group-hover:bg-[#1f1f1f]'
        )}>
          {/* 内容区域 */}
          <div className="p-4 sm:p-5">
            {/* 头部信息 */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">英语学习分析</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <time>{new Date(analysis.timestamp).toLocaleDateString()}</time>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>{analysis.turns} 轮对话</span>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex-shrink-0 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-9 h-7 w-7 rounded-lg hover:bg-muted active:scale-95 transition-all duration-200"
                      title="更多操作"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      分享分析
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                        删除记录
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 主要内容 */}
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {analysis.title}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {analysis.description}
              </p>
            </div>

            {/* 分数和状态 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}/100
                  </span>
                  <div className={`px-2 py-1 rounded-md ${getPassStatusColor(analysis.passed)}`}>
                    <span className="text-xs font-medium">
                      {getPassStatus(analysis.passed)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                查看详细分析 →
              </div>
            </div>

            {/* 学习摘要 */}
            {analysis.summary.strengths.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>主要优势</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                  {analysis.summary.strengths.join('、')}
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
