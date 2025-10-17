/**
 * 日记入口页面
 * 选择 AI 生成或手动创作
 * 基于 Apple 设计原则
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Wand2, PenTool, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DiaryEntryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* 背景光效 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-600/10 dark:to-orange-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-yellow-400/20 to-amber-400/20 dark:from-yellow-600/10 dark:to-amber-600/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </motion.div>

        {/* 主标题 - Apple 风格精简设计 */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
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
            className="inline-block text-4xl mb-3"
          >
            📖
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            今日日记
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            选择你的创作方式
          </p>
        </motion.header>

        {/* 双卡片选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* AI 生成卡片 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/ai/diary/generate')}
            className="group cursor-pointer"
          >
            <Card className="relative p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-amber-200/50 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden">
              {/* 背景渐变 */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                {/* 图标 */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20"
                >
                  <Wand2 className="w-6 h-6 text-white" />
                </motion.div>

                {/* 标题 */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  AI 智能生成
                </h3>

                {/* 描述 */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  基于你的生活记录，AI 为你创作温暖真实的日记
                </p>

                {/* 特性标签 */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <Sparkles className="w-3 h-3" />
                    智能分析
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    <Sparkles className="w-3 h-3" />
                    情感理解
                  </span>
                </div>
              </div>

              {/* 箭头指示 */}
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                className="absolute bottom-6 right-6 text-amber-500 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </motion.div>
            </Card>
          </motion.div>

          {/* 手动创作卡片 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // 创建新的空白日记并跳转到编辑页面
              const diaryId = `diary_${Date.now()}`;
              router.push(`/ai/diary/${diaryId}?mode=new`);
            }}
            className="group cursor-pointer"
          >
            <Card className="relative p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden">
              {/* 背景渐变 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                {/* 图标 */}
                <motion.div
                  whileHover={{ rotate: -10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 shadow-md shadow-blue-500/20"
                >
                  <PenTool className="w-6 h-6 text-white" />
                </motion.div>

                {/* 标题 */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  自由创作
                </h3>

                {/* 描述 */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  用你的文字，记录内心最真实的想法和感受
                </p>

                {/* 特性标签 */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <PenTool className="w-3 h-3" />
                    自由表达
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    <PenTool className="w-3 h-3" />
                    即刻开始
                  </span>
                </div>
              </div>

              {/* 箭头指示 */}
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                className="absolute bottom-6 right-6 text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </motion.div>
            </Card>
          </motion.div>
        </div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-xs text-gray-500 dark:text-gray-400"
        >
          <p>每天记录一点，生活更有温度 ✨</p>
        </motion.div>
      </div>
    </div>
  );
}
