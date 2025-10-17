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
import { Sparkles, Save, Download, Bug, CheckCircle, ArrowLeft } from 'lucide-react';

export default function DiaryPage() {
  const { records } = useRecords();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<DiaryGenerationProgress | null>(null);
  const [editedContent, setEditedContent] = useState<TiptapDocument | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<string>('😊');
  
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
      
      // 显示成功消息
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-yellow-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header - 更紧凑的设计 */}
        <header className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-3 sm:mb-4 shadow-lg shadow-orange-500/25">
            <span className="text-xl sm:text-2xl">📖</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            今日日记
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            AI 为你创作温暖真实的生活日记
          </p>
        </header>
        
        {/* API Key 设置 - 移动端优化 */}
        {showApiKeyInput && (
          <div className="mb-4 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-xs sm:text-sm">🔑</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  配置 API Key
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  需要 OpenAI API Key 来生成日记
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-all text-sm"
              />
              <Button 
                onClick={handleSetApiKey} 
                disabled={!apiKey.trim()}
                size="sm"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap"
              >
                设置
              </Button>
            </div>
          </div>
        )}

        {/* Generate Button - 移动端优化设计 */}
        {!diary && (
          <div className="text-center py-6 sm:py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 mb-4">
              <span className="text-xl sm:text-2xl">✨</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              还没有今日日记
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs mx-auto">
              让 AI 为你创作一篇温暖真实的生活日记
            </p>
            
            {/* 心情选择 */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">选择今日心情</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {[
                  { emoji: '😊', label: '开心' },
                  { emoji: '😌', label: '平静' },
                  { emoji: '😔', label: '低落' },
                  { emoji: '🤔', label: '思考' },
                  { emoji: '😴', label: '疲惫' },
                  { emoji: '😄', label: '兴奋' }
                ].map((mood) => (
                  <button
                    key={mood.emoji}
                    onClick={() => setSelectedMood(mood.emoji)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                      selectedMood === mood.emoji
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 scale-110'
                        : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
                    }`}
                    title={mood.label}
                  >
                    <span className="text-lg">{mood.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || records.length === 0}
              className="w-full max-w-xs px-6 py-3 text-sm rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/35 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>生成今日日记</span>
                </>
              )}
            </Button>
            {records.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-600 mt-3">
                今天还没有记录，先去记录一些生活片段吧~
              </p>
            )}
          </div>
        )}
        
        {/* Progress - 更紧凑的设计 */}
        {isGenerating && progress && (
          <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{progress.message}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  日记已生成并保存！
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  现在可以编辑或查看日记内容
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Diary Editor - 移动端优化设计 */}
        {diary && editedContent && !isGenerating && (
          <div className="space-y-3">
            {/* Metadata Card - 移动端优化 */}
            <div className="p-3 sm:p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex-shrink-0">
                    <span className="text-base sm:text-lg">{getMoodEmoji(diary.metadata.mood)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{diary.metadata.date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {diary.metadata.wordCount} 字
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/')}
                    className="flex-1 sm:flex-none rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">返回首页</span>
                    <span className="sm:hidden">返回</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerate}
                    className="flex-1 sm:flex-none rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">重新生成</span>
                    <span className="sm:hidden">重新</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSave}
                    className="flex-1 sm:flex-none rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    保存
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExport}
                    className="flex-1 sm:flex-none rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">导出</span>
                    <span className="sm:hidden">导出</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Editor Card - 移动端优化 */}
            <div className="rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden min-h-[300px] sm:min-h-[400px]">
              <DiaryEditor
                content={editedContent}
                onChange={setEditedContent}
                editable={true}
                className="min-h-[300px] sm:min-h-[400px]"
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

