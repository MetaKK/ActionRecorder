/**
 * AI 日记生成页面
 * 基于 Apple 设计原则，极致温暖科技感
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecords } from '@/lib/hooks/use-records';
import { Button } from '@/components/ui/button';
import { generateDiary } from '@/lib/ai/diary/generator';
import { saveDiary } from '@/lib/storage/diary-db';
import {
  DiaryStyle,
  DiaryGenerationOptions,
  DiaryGenerationProgress,
  DiaryGenerationStatus,
} from '@/lib/ai/diary/types';
import {
  Sparkles,
  ArrowLeft,
  Zap,
  Heart,
  Brain,
  Wand2,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function DiaryGeneratePage() {
  const router = useRouter();
  const { records } = useRecords();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<DiaryGenerationProgress | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedDiaryId, setGeneratedDiaryId] = useState<string | null>(null);

  // 检查 API Key
  useEffect(() => {
    const storedKey = sessionStorage.getItem('api_key') || localStorage.getItem('api_key');
    if (!storedKey) {
      setShowApiKeyInput(true);
    } else {
      setApiKey(storedKey);
    }
  }, []);

  // 设置 API Key
  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem('api_key', apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  // 开始生成
  const handleGenerate = async () => {
    if (records.length === 0) {
      alert('今天还没有记录，请先添加一些生活片段');
      return;
    }

    setIsGenerating(true);
    setProgress(null);
    setGenerationComplete(false);

    try {
      const options: DiaryGenerationOptions = {
        style: DiaryStyle.NARRATIVE,
        includeImages: true,
        includeCitations: true,
      };

      const newDiary = await generateDiary(records, options, setProgress);

      if (!newDiary || !newDiary.content || !newDiary.metadata) {
        throw new Error('生成的日记数据无效');
      }

      await saveDiary(newDiary);
      setGeneratedDiaryId(newDiary.metadata.id);
      setGenerationComplete(true);

      // 2秒后自动跳转到编辑页面
      setTimeout(() => {
        router.push(`/ai/diary/${newDiary.metadata.id}`);
      }, 2000);
    } catch (error) {
      console.error('日记生成失败:', error);
      alert('日记生成失败，请重试');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* 背景动画光效 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-amber-400/30 to-orange-400/30 dark:from-amber-600/20 dark:to-orange-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-yellow-400/30 to-amber-400/30 dark:from-yellow-600/20 dark:to-amber-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/ai/diary')}
            className="hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </motion.div>

        {/* 主标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-orange-500/20"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI 智能生成
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            让 AI 为你创作今天的温暖日记
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* API Key 配置 */}
          {showApiKeyInput && !isGenerating && (
            <motion.div
              key="api-key"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div className="p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/30 shadow-lg">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">🔑</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      配置 API Key
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      需要 OpenAI API Key 才能使用 AI 功能
                    </p>
                  </div>
                </div>
                
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-all mb-3"
                />
                
                <Button
                  onClick={handleSetApiKey}
                  disabled={!apiKey.trim()}
                  className="w-full h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  确认设置
                </Button>
              </div>
            </motion.div>
          )}

          {/* 生成中 */}
          {isGenerating && !generationComplete && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* 进度卡片 */}
              <div className="p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="text-center mb-6">
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block mb-3"
                  >
                    <Sparkles className="w-10 h-10 text-amber-500" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                    AI 正在创作中
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {progress?.message || '准备开始...'}
                  </p>
                </div>

                {/* 进度条 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">进度</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {progress?.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress?.progress || 0}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>
                </div>

                {/* 步骤指示 */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { icon: Brain, label: '分析数据', step: 30 },
                    { icon: Wand2, label: 'AI 创作', step: 60 },
                    { icon: Heart, label: '完善细节', step: 90 },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`text-center p-3 rounded-lg transition-all ${
                        (progress?.progress || 0) >= item.step
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 mx-auto mb-1.5 ${
                          (progress?.progress || 0) >= item.step
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      />
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 生成完成 */}
          {generationComplete && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-green-200/50 dark:border-green-800/30 shadow-lg"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-md"
              >
                <Check className="w-6 h-6 text-white" />
              </motion.div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                日记创作完成！
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                正在跳转到编辑页面...
              </p>
            </motion.div>
          )}

          {/* 开始生成按钮 */}
          {!showApiKeyInput && !isGenerating && !generationComplete && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 今日数据统计 */}
              <div className="p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  今日数据
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-0.5">
                      {records.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      生活片段
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/30">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                      {records.reduce((acc, r) => {
                        const content = r.content as { text?: string };
                        return acc + (content.text?.length || 0);
                      }, 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      文字数量
                    </div>
                  </div>
                </div>
              </div>

              {/* 开始生成按钮 */}
              <Button
                onClick={handleGenerate}
                disabled={records.length === 0}
                className="w-full h-11 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                开始生成日记
              </Button>

              {records.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  今天还没有记录，先去添加一些生活片段吧
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

