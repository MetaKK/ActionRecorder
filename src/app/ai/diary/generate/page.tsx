/**
 * AI 日记生成页面 - 完全重构版
 * 
 * 功能：
 * 1. 10位顶尖作家风格模板（各流派代表）
 * 2. 3D卡片轮播选择器（ElevenLabs风格）
 * 3. 自定义风格创建（文本/图片分析）
 * 4. 温暖科技感的视觉设计
 * 
 * 基于 Apple 设计原则和行业最佳实践
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
} from '@/lib/ai/diary/types';
import {
  Sparkles,
  ArrowLeft,
  Heart,
  Brain,
  Wand2,
  Check,
  AlertCircle,
  Palette,
  Zap,
} from 'lucide-react';
import { WriterStyleCarousel } from '@/components/ai/writer-style-carousel';
import { CustomStyleCreator } from '@/components/ai/custom-style-creator';
import { getAllWriterStyles } from '@/lib/ai/diary/writer-styles';

type GenerationStep = 'style-select' | 'custom-style' | 'generating' | 'complete';

export default function DiaryGeneratePage() {
  const router = useRouter();
  const { records } = useRecords();
  const [currentStep, setCurrentStep] = useState<GenerationStep>('style-select');
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<DiaryGenerationProgress | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  
  const writerStyles = getAllWriterStyles();

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

  // 选择作家风格
  const handleSelectStyle = (styleId: string) => {
    setSelectedStyleId(styleId);
  };

  // 使用自定义风格
  const handleCustomStyleGenerated = (prompt: string) => {
    setCustomPrompt(prompt);
    setSelectedStyleId('custom');
    setCurrentStep('style-select');
  };

  // 开始生成
  const handleGenerate = async () => {
    if (records.length === 0) {
      alert('今天还没有记录，请先添加一些生活片段');
      return;
    }

    if (!selectedStyleId) {
      alert('请先选择一个写作风格');
      return;
    }

    setCurrentStep('generating');
    setIsGenerating(true);
    setProgress(null);

    try {
      // 获取风格prompt
      let stylePrompt = '';
      if (selectedStyleId === 'custom') {
        stylePrompt = customPrompt;
      } else {
        const selectedStyle = writerStyles.find(s => s.id === selectedStyleId);
        stylePrompt = selectedStyle?.prompt || '';
      }

      const options: DiaryGenerationOptions = {
        style: DiaryStyle.NARRATIVE,
        includeImages: true,
        includeCitations: true,
        customPrompt: stylePrompt, // 传入风格prompt
      };

      const newDiary = await generateDiary(records, options, setProgress);

      if (!newDiary || !newDiary.content || !newDiary.metadata) {
        throw new Error('生成的日记数据无效');
      }

      await saveDiary(newDiary);
      setCurrentStep('complete');

      // 2秒后自动跳转到编辑页面
      setTimeout(() => {
        router.push(`/ai/diary/${newDiary.metadata.id}`);
      }, 2000);
    } catch (error) {
      console.error('日记生成失败:', error);
      alert('日记生成失败，请重试');
      setIsGenerating(false);
      setCurrentStep('style-select');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* 背景动画光效 - 更酷炫的效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [-100, 100, -100],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/3 -left-1/4 w-2/3 h-2/3 bg-gradient-to-br from-blue-500/30 to-purple-500/30 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
            x: [100, -100, 100],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-1/3 -right-1/4 w-2/3 h-2/3 bg-gradient-to-tl from-cyan-400/30 to-pink-400/30 dark:from-cyan-600/20 dark:to-pink-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/15 dark:to-orange-600/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* 顶部导航 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
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

          {/* 步骤指示器 */}
          <div className="flex items-center gap-2">
            {['风格', '生成'].map((label, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  (index === 0 && currentStep === 'style-select') ||
                  (index === 0 && currentStep === 'custom-style') ||
                  (index === 1 && currentStep === 'generating') ||
                  (index === 1 && currentStep === 'complete')
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <div className="w-1 h-1 rounded-full bg-current" />
                  {label}
                </div>
                {index < 1 && (
                  <div className="w-6 h-px bg-gray-300 dark:bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* API Key 配置 */}
          {showApiKeyInput && (
            <motion.div
              key="api-key"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/30 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🔑</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all mb-4"
                />
                
                <Button
                  onClick={handleSetApiKey}
                  disabled={!apiKey.trim()}
                  className="w-full h-11 text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                >
                  确认设置
                </Button>
              </div>
            </motion.div>
          )}

          {/* 风格选择步骤 */}
          {currentStep === 'style-select' && !showApiKeyInput && (
            <motion.div
              key="style-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* 主标题 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl shadow-purple-500/30"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  选择写作风格
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto">
                  从10位文学大师中选择你喜欢的风格，或上传文本/图片让AI为你定制独特风格
                </p>
              </motion.div>

              {/* 3D卡片轮播 */}
              <div className="mt-12">
                <WriterStyleCarousel
                  styles={writerStyles}
                  selectedStyle={selectedStyleId === 'custom' ? null : selectedStyleId}
                  onSelectStyle={handleSelectStyle}
                />
              </div>

              {/* 自定义风格入口 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                <button
                  onClick={() => setCurrentStep('custom-style')}
                  className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
                >
                  <Palette className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-gray-900 dark:text-white">创建自定义风格</span>
                </button>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
              </motion.div>

              {/* 底部操作区 */}
              {selectedStyleId && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {selectedStyleId === 'custom' ? '自定义风格' : writerStyles.find(s => s.id === selectedStyleId)?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          今日数据：{records.length} 个片段，
                          {records.reduce((acc, r) => {
                            const content = r.content as { text?: string };
                            return acc + (content.text?.length || 0);
                          }, 0)} 字
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerate}
                        disabled={records.length === 0}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        开始生成
                      </Button>
                    </div>
                    
                    {records.length === 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        今天还没有记录，先去添加一些生活片段吧
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 自定义风格步骤 */}
          {currentStep === 'custom-style' && (
            <motion.div
              key="custom-style"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              {/* 标题 */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  创建自定义风格
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  上传文本或图片，AI 将为你分析并生成独特的写作风格
                </p>
              </div>

              <CustomStyleCreator onStyleGenerated={handleCustomStyleGenerated} />

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('style-select')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回风格选择
                </Button>
              </div>
            </motion.div>
          )}

          {/* 生成中 */}
          {currentStep === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* 进度卡片 */}
              <div className="p-8 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <div className="text-center mb-8">
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block mb-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    AI 正在创作中
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {progress?.message || '准备开始...'}
                  </p>
                </div>

                {/* 进度条 */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">进度</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {progress?.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress?.progress || 0}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>

                {/* 步骤指示 */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Brain, label: '分析数据', step: 30 },
                    { icon: Wand2, label: 'AI 创作', step: 60 },
                    { icon: Heart, label: '完善细节', step: 90 },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`text-center p-4 rounded-xl transition-all ${
                        (progress?.progress || 0) >= item.step
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <item.icon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          (progress?.progress || 0) >= item.step
                            ? 'text-blue-600 dark:text-blue-400'
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
          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center p-10 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-green-200/50 dark:border-green-800/30 shadow-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                日记创作完成！
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                正在跳转到编辑页面...
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

