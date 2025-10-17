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
  DiaryType,
  DiaryGenerationOptions,
  DiaryGenerationProgress,
  TiptapDocument,
} from '@/lib/ai/diary/types';
import { Sparkles, Save, Download, CheckCircle, ArrowLeft, PenTool, Wand2, Plus, X } from 'lucide-react';

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
  const [entryMode, setEntryMode] = useState<'ai' | 'manual' | null>(null);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  
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
  }, []);
  
  // 生成日记
  const handleGenerate = async () => {
    // 检查API Key
    if (!checkApiKey()) {
      return;
    }
    
    // 检查是否有记录
    if (records.length === 0) {
      alert('今天还没有记录，请先添加一些生活片段再生成日记');
      return;
    }
    
    setIsGenerating(true);
    setProgress(null);
    setShowSuccessMessage(false);
    
    try {
      const options: DiaryGenerationOptions = {
        style: BEST_DIARY_STYLE,
        includeImages: true,
        includeCitations: true,
      };
      
      const newDiary = await generateDiary(records, options, setProgress);
      
      // 验证生成的日记
      if (!newDiary || !newDiary.content || !newDiary.metadata) {
        throw new Error('生成的日记数据无效');
      }
      
      setDiary(newDiary);
      setEditedContent(newDiary.content.document);
      
      // 自动保存到 IndexedDB
      try {
        await saveDiary(newDiary);
        console.log('✅ 日记已自动保存');
      } catch (saveError) {
        console.error('保存失败:', saveError);
        // 即使保存失败，也显示日记内容
        alert('警告：日记已生成但保存失败，请手动保存');
      }
      
      // 显示成功消息
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to generate diary:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`生成日记失败：${errorMessage}\n\n请检查API Key是否正确，或稍后重试。`);
      setProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 保存日记
  const handleSave = async () => {
    if (!diary || !editedContent) {
      alert('没有可保存的日记内容');
      return;
    }
    
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
      
      // 使用Toast而不是alert
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (error) {
      console.error('保存失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`保存失败：${errorMessage}`);
    }
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
  
  // 检查API Key
  const checkApiKey = () => {
    const storedKey = sessionStorage.getItem('api_key') || localStorage.getItem('api_key');
    if (!storedKey) {
      setShowApiKeyInput(true);
      return false;
    }
    return true;
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

  // 创建手动日记
  const handleCreateManual = async () => {
    setIsCreatingManual(true);
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const newDiary: Diary = {
        metadata: {
          id: `diary_${Date.now()}_${Math.random().toString(36).substring(7)}`, // 确保ID唯一
          date: today,
          createdAt: now,
          generatedAt: now,
          style: DiaryStyle.NARRATIVE,
          type: DiaryType.MANUAL,
          wordCount: 0,
          mood: selectedMood || '😊', // 默认值
          tags: [],
          sources: {
            recordsCount: 0,
            chatsCount: 0,
            filesCount: 0,
          },
          version: 1,
          isPinned: false,
        },
        content: {
          format: 'tiptap-json',
          version: '1.0',
          document: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [],
              },
            ],
          },
        },
        citations: [],
        images: [],
      };

      setDiary(newDiary);
      setEditedContent(newDiary.content.document);
      setEntryMode('manual');
      
      // 自动保存到 IndexedDB
      try {
        await saveDiary(newDiary);
        console.log('✅ 空白日记已创建并保存');
      } catch (saveError) {
        console.error('保存空白日记失败:', saveError);
        // 即使保存失败，也允许用户继续编辑
        alert('警告：日记创建成功但保存失败，请在编辑后手动保存');
      }
    } catch (error) {
      console.error('Failed to create manual diary:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`创建日记失败：${errorMessage}`);
    } finally {
      setIsCreatingManual(false);
    }
  };

  // 重置到选择模式
  const handleResetMode = () => {
    setEntryMode(null);
    setDiary(null);
    setEditedContent(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-yellow-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-200/10 dark:bg-amber-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-200/10 dark:bg-orange-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-200/5 dark:bg-yellow-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 relative z-10">
        {/* 回退按钮 */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Header - 恢复原始样式 */}
        <header className="mb-4 sm:mb-6 text-center">
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
        
        {/* API Key 设置 - 只在AI生成模式显示 */}
        {showApiKeyInput && entryMode === 'ai' && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/30 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <span className="text-sm">🔑</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  配置 OpenAI API Key
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AI 生成功能需要您的 OpenAI API Key
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-all text-sm"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSetApiKey} 
                  disabled={!apiKey.trim()}
                  size="sm"
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-200 hover:shadow-lg"
                >
                  确认设置
                </Button>
                <Button 
                  onClick={handleResetMode}
                  variant="outline"
                  size="sm"
                  className="px-4 py-2 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 双入口选择界面 */}
        {!diary && !entryMode && (
          <div className="text-center py-6 sm:py-8">

            {/* 心情选择 */}
            <div className="mb-8 animate-fade-in-up delay-300">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-center gap-2">
                <span className="text-base">💭</span>
                今天的心情
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {[
                  { emoji: '😊', label: '开心', color: 'from-yellow-100 to-orange-100' },
                  { emoji: '😌', label: '平静', color: 'from-blue-100 to-cyan-100' },
                  { emoji: '😔', label: '低落', color: 'from-gray-100 to-slate-100' },
                  { emoji: '🤔', label: '思考', color: 'from-purple-100 to-indigo-100' },
                  { emoji: '😴', label: '疲惫', color: 'from-gray-100 to-zinc-100' },
                  { emoji: '😄', label: '兴奋', color: 'from-pink-100 to-rose-100' }
                ].map((mood, index) => (
                  <button
                    key={mood.emoji}
                    onClick={() => setSelectedMood(mood.emoji)}
                    className={`w-12 h-12 rounded-xl border-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
                      selectedMood === mood.emoji
                        ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 scale-110 shadow-lg shadow-amber-500/25'
                        : `border-gray-200 dark:border-gray-700 hover:border-amber-300 bg-gradient-to-br ${mood.color} dark:from-gray-800 dark:to-gray-700 hover:shadow-md`
                    }`}
                    title={mood.label}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-xl transition-transform duration-200 hover:scale-110">{mood.emoji}</span>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 animate-fade-in-up">
                  已选择心情：{selectedMood}
                </p>
              )}
            </div>

            {/* 双入口选择卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* AI 生成入口 */}
              <div className="group relative animate-fade-in-up">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <Card className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/30 hover:border-amber-300/60 dark:hover:border-amber-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 cursor-pointer group-hover:scale-[1.02] group-hover:-translate-y-1"
                      onClick={() => {
                        if (checkApiKey()) {
                          setEntryMode('ai');
                        }
                      }}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                      <Wand2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors duration-300">
                      AI 智能生成
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      基于你的生活记录，AI 为你创作温暖真实的日记
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>需要 API Key</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 手动编写入口 */}
              <div className="group relative animate-fade-in-up delay-150">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <Card className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer group-hover:scale-[1.02] group-hover:-translate-y-1"
                      onClick={handleCreateManual}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                      <PenTool className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                      自由创作
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      用你的文字，记录内心最真实的想法和感受
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                      <PenTool className="w-4 h-4" />
                      <span>立即开始</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

          </div>
        )}

        {/* AI 生成模式 */}
        {!diary && entryMode === 'ai' && (
          <div className="text-center py-6 sm:py-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI 智能生成
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                基于你的生活记录，AI 为你创作温暖真实的日记
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || records.length === 0}
              className="w-full max-w-sm px-6 py-3 text-sm rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/35 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>AI 正在创作中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>开始 AI 生成</span>
                </>
              )}
            </Button>
            
            {records.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-600 mt-3">
                今天还没有记录，先去记录一些生活片段吧~
              </p>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetMode}
              className="mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4 mr-1" />
              返回选择
            </Button>
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
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {diary.metadata.date}
                      {diary.metadata.type === 'manual' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <PenTool className="w-3 h-3 mr-1" />
                          手动创作
                        </span>
                      )}
                      {diary.metadata.type === 'auto' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          <Wand2 className="w-3 h-3 mr-1" />
                          AI 生成
                        </span>
                      )}
                    </div>
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
                  {diary.metadata.type === 'auto' && (
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
                  )}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetMode}
                    className="flex-1 sm:flex-none rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">新建日记</span>
                    <span className="sm:hidden">新建</span>
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

