/**
 * 日记页面
 * AI 自动生成今日日记
 */

'use client';

import './styles.css';
import { useState, useEffect } from 'react';
import { useRecords } from '@/lib/hooks/use-records';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DiaryEditor } from '@/components/ai/diary-editor';
import { generateDiary } from '@/lib/ai/diary/generator';
import { getTodayDiary, saveDiary, migrateFromLocalStorage } from '@/lib/storage/diary-db';
import { debugChatData } from '@/lib/ai/diary/sources';
import { useRouter } from 'next/navigation';
import {
  Diary,
  DiaryStyle,
  DiaryGenerationOptions,
  DiaryGenerationProgress,
  TiptapDocument,
} from '@/lib/ai/diary/types';
import { Sparkles, Save, Download, Bug } from 'lucide-react';

export default function DiaryPage() {
  const { records } = useRecords();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<DiaryGenerationProgress | null>(null);
  const [editedContent, setEditedContent] = useState<TiptapDocument | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  
  // 固定使用最佳风格：叙事型（温暖、真实、生动）
  const BEST_DIARY_STYLE = DiaryStyle.NARRATIVE;
  
  // 加载今日日记
  useEffect(() => {
    const loadTodayDiary = async () => {
      try {
        // 尝试从 localStorage 迁移数据（首次使用）
        await migrateFromLocalStorage();
        
        const existingDiary = await getTodayDiary();
        if (existingDiary) {
          setDiary(existingDiary);
          setEditedContent(existingDiary.content.document);
        }
      } catch (error) {
        console.error('Failed to load today diary:', error);
      }
    };
    
    loadTodayDiary();
    
    // 检查是否有 API Key
    const storedKey = sessionStorage.getItem('api_key') || localStorage.getItem('api_key');
    if (!storedKey) {
      setShowApiKeyInput(true);
    }
  }, []);
  
  // 生成日记
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(null);
    
    try {
      const options: DiaryGenerationOptions = {
        style: BEST_DIARY_STYLE,
        includeImages: true,
        includeCitations: true,
      };
      
      const newDiary = await generateDiary(records, options, setProgress);
      setDiary(newDiary);
      setEditedContent(newDiary.content.document);
      
      // 自动保存到 IndexedDB
      await saveDiary(newDiary);
      
      // 显示成功消息并返回首页
      alert('日记已生成并保存！');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Failed to generate diary:', error);
      alert('生成日记失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 保存日记
  const handleSave = async () => {
    if (!diary || !editedContent) return;
    
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
    alert('日记已保存！');
  };
  
  // 导出日记
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
  };
  
  // 调试聊天数据
  const handleDebug = () => {
    debugChatData();
    alert('调试信息已输出到控制台，请查看开发者工具');
  };
  
  // 设置 API Key
  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem('api_key', apiKey.trim());
      setShowApiKeyInput(false);
      alert('API Key 已设置！');
    } else {
      alert('请输入有效的 API Key');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#191919] overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header - Apple Style */}
        <header className="mb-8 sm:mb-12 text-center px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 sm:mb-6 shadow-lg shadow-orange-500/30">
            <span className="text-2xl sm:text-3xl">📔</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 sm:mb-3">
            今日日记
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            AI 为你创作温暖真实的生活日记，记录每一个美好瞬间
          </p>
        </header>
        
        {/* API Key 设置 - Notion Style */}
        {showApiKeyInput && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 mx-2 sm:mx-0">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-xl sm:text-2xl flex-shrink-0">🔑</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  配置 API Key
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  需要 OpenAI API Key 来生成日记。请从 OpenAI 官网获取 API Key。
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-all text-sm sm:text-base"
              />
              <Button 
                onClick={handleSetApiKey} 
                disabled={!apiKey.trim()}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap"
              >
                设置
              </Button>
            </div>
          </div>
        )}

        {/* Generate Button - Apple Style */}
        {!diary && (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 mb-4 sm:mb-6">
              <span className="text-4xl sm:text-5xl">✨</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              还没有今日日记
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              点击下方按钮，让 AI 为你创作一篇温暖真实的生活日记
            </p>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || records.length === 0}
              className="px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/40 active:scale-95 sm:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  <span>生成今日日记</span>
                </>
              )}
            </Button>
            {records.length === 0 && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-600 mt-4 sm:mt-6 px-4">
                今天还没有记录，先去记录一些生活片段吧~
              </p>
            )}
          </div>
        )}
        
        {/* Progress - Notion Style */}
        {isGenerating && progress && (
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 mx-2 sm:mx-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{progress.message}</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Diary Editor - Notion Style */}
        {diary && editedContent && !isGenerating && (
          <div className="space-y-3 sm:space-y-4">
            {/* Metadata Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mx-2 sm:mx-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex-shrink-0">
                    <span className="text-xl sm:text-2xl">{getMoodEmoji(diary.metadata.mood)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{diary.metadata.date}</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {diary.metadata.wordCount} 字
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerate}
                    className="flex-1 sm:flex-none rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">重新生成</span>
                    <span className="sm:hidden">重新</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSave}
                    className="flex-1 sm:flex-none rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                    保存
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExport}
                    className="flex-1 sm:flex-none rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                    导出
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Editor Card */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px] sm:min-h-[600px] mx-2 sm:mx-0">
              <DiaryEditor
                content={editedContent}
                onChange={setEditedContent}
                editable={true}
                className="min-h-[450px] sm:min-h-[500px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 辅助函数
function getStyleLabel(style: DiaryStyle): string {
  const labels = {
    [DiaryStyle.NARRATIVE]: '📖 叙事体',
    [DiaryStyle.REFLECTIVE]: '💭 反思型',
    [DiaryStyle.BULLET]: '📝 要点式',
    [DiaryStyle.POETIC]: '🌸 文艺型',
    [DiaryStyle.ANALYTICAL]: '📊 分析型',
  };
  return labels[style] || style;
}

function getMoodEmoji(mood: string): string {
  const emojiMap: Record<string, string> = {
    '积极愉快': '😊',
    '有些低落': '😔',
    '复杂交织': '😐',
    '平静自然': '😌',
  };
  return emojiMap[mood] || '📝';
}

