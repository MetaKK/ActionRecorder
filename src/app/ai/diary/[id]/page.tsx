/**
 * 日记详情页面
 * 
 * 功能：
 * 1. 查看日记完整内容
 * 2. 切换编辑模式
 * 3. 支持分享和导出
 * 
 * 设计：
 * - 沉浸式阅读体验
 * - Apple 风格排版
 * - 响应式布局
 */

'use client';

import '../styles.css';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit3,
  Share2,
  Download,
  Calendar,
  TrendingUp,
  Heart,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiaryEditor } from '@/components/ai/diary-editor';
import { getDiary, saveDiary } from '@/lib/storage/diary-db';
import { Diary, TiptapDocument } from '@/lib/ai/diary/types';
import { cn } from '@/lib/utils';

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const diaryId = params.id as string;

  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<TiptapDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 加载日记
  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    setIsLoading(true);
    try {
      // 从 ID 中提取日期
      const date = extractDateFromId(diaryId);
      const loadedDiary = await getDiary(date);
      
      if (loadedDiary) {
        setDiary(loadedDiary);
        setEditedContent(loadedDiary.content.document);
      } else {
        console.error('Diary not found:', diaryId);
      }
    } catch (error) {
      console.error('Failed to load diary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!diary || !editedContent) return;

    setIsSaving(true);
    try {
      const updatedDiary: Diary = {
        ...diary,
        content: {
          ...diary.content,
          document: editedContent,
        },
        metadata: {
          ...diary.metadata,
          editHistory: [
            ...(diary.metadata.editHistory || []),
            {
              timestamp: new Date(),
              type: 'manual',
              changes: '用户编辑',
            },
          ],
        },
      };

      await saveDiary(updatedDiary);
      setDiary(updatedDiary);
      setIsEditing(false);
      
      // 显示成功提示
      showToast('日记已保存！');
    } catch (error) {
      console.error('Failed to save diary:', error);
      showToast('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (diary) {
      setEditedContent(diary.content.document);
    }
    setIsEditing(false);
  };

  const handleExport = () => {
    if (!diary) return;

    const json = JSON.stringify(diary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-${diary.metadata.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('日记已导出！');
  };

  const handleShare = async () => {
    if (!diary) return;

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${diary.metadata.date} 的日记`,
          text: extractExcerpt(diary),
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // 降级：复制链接
      navigator.clipboard.writeText(window.location.href);
      showToast('链接已复制到剪贴板！');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#191919] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载日记中...</p>
        </div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#191919] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            日记不存在
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            该日记可能已被删除或不存在
          </p>
          <Button onClick={() => router.push('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#191919] pb-20">
      {/* 顶部导航栏 - 固定 */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* 左侧：返回 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">返回</span>
            </Button>

            {/* 中间：标题 */}
            <div className="flex-1 text-center min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                {formatDate(diary.metadata.date)}
              </h1>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">取消</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white sm:mr-1.5"></div>
                    ) : (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1.5" />
                    )}
                    <span className="hidden sm:inline">保存</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">编辑</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-600 dark:text-gray-400 hidden sm:flex"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">分享</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    className="text-gray-600 dark:text-gray-400 hidden sm:flex"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">导出</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* 主内容区域 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <AnimatePresence mode="wait">
          {isEditing ? (
            // 编辑模式
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <DiaryEditor
                content={editedContent || undefined}
                onChange={setEditedContent}
                editable={true}
                className="min-h-[600px]"
              />
            </motion.div>
          ) : (
            // 阅读模式
            <motion.div
              key="read"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 元信息卡片 */}
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(diary.metadata.date)}</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{diary.metadata.wordCount} 字</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>{diary.metadata.mood}</span>
                  </div>
                </div>
              </div>

              {/* 日记内容 */}
              <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <DiaryEditor
                  content={diary.content.document}
                  onChange={() => {}}
                  editable={false}
                  className="min-h-[600px]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================
// 辅助函数
// ============================================

function extractDateFromId(id: string): string {
  // ID 格式: diary_1708128000000 或 直接是日期 2025-10-17
  if (id.includes('-')) {
    return id;
  }
  
  // 从时间戳 ID 中提取
  const match = id.match(/diary_(\d+)/);
  if (match) {
    const timestamp = parseInt(match[1]);
    const date = new Date(timestamp);
    return formatDateStr(date);
  }
  
  return id;
}

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  
  return `${year}年${month}月${day}日 ${weekday}`;
}

function extractExcerpt(diary: Diary): string {
  try {
    const doc = diary.content.document;
    if (!doc.content || !Array.isArray(doc.content)) {
      return '';
    }

    for (const node of doc.content) {
      if (node.type === 'paragraph' && node.content) {
        const text = extractTextFromNode(node);
        if (text) {
          return text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }
      }
    }

    return '';
  } catch (error) {
    return '';
  }
}

function extractTextFromNode(node: { text?: string; content?: unknown[] }): string {
  if (node.text) {
    return node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    return node.content.map((child) => extractTextFromNode(child as { text?: string; content?: unknown[] })).join('');
  }
  return '';
}

function showToast(message: string) {
  // 简单的 toast 提示
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg z-50 text-sm font-medium';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

