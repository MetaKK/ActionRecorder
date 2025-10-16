"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// AI助手插件配置
interface AIPlugin {
  id: string;
  emoji: string;
  label: string;
  route: string;
  color: string;
}

const AI_PLUGINS: AIPlugin[] = [
  {
    id: "chat",
    emoji: "💬",
    label: "AI对话",
    route: "/ai",
    color: "from-blue-500 to-purple-600",
  },
  {
    id: "analyze",
    emoji: "📊",
    label: "生活分析",
    route: "/ai/analyze",
    color: "from-green-500 to-teal-600",
  },
  {
    id: "insight",
    emoji: "💡",
    label: "洞察建议",
    route: "/ai/insight",
    color: "from-yellow-500 to-orange-600",
  },
  {
    id: "memory",
    emoji: "🧠",
    label: "记忆回顾",
    route: "/ai/memory",
    color: "from-pink-500 to-rose-600",
  },
];

export function AIChatButton() {
  const [isThinking, setIsThinking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [currentPluginIndex, setCurrentPluginIndex] = useState(0);
  const router = useRouter();

  // 间歇性思考动画 (每15-25秒触发一次，持续5秒)
  useEffect(() => {
    const triggerThinking = () => {
      setIsThinking(true);
      setShowBubble(true);
      
      // 随机选择一个插件
      setCurrentPluginIndex(Math.floor(Math.random() * AI_PLUGINS.length));
      
      // 5秒后停止思考动画
      setTimeout(() => {
        setIsThinking(false);
        setTimeout(() => setShowBubble(false), 300);
      }, 5000);
    };

    // 首次延迟3秒后触发
    const initialTimeout = setTimeout(triggerThinking, 3000);

    // 之后每15-25秒随机触发
    const interval = setInterval(() => {
      const randomDelay = 15000 + Math.random() * 10000;
      setTimeout(triggerThinking, randomDelay);
    }, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // 预加载GIF
  useEffect(() => {
    const gifImg = new Image();
    gifImg.src = "/img/896e2255367f2b04.gif";
  }, []);

  const handlePluginClick = useCallback((plugin: AIPlugin) => {
    router.push(plugin.route);
  }, [router]);

  const handleMainClick = useCallback(() => {
    // 如果正在思考，点击主角色切换到下一个插件
    if (isThinking) {
      setCurrentPluginIndex((prev) => (prev + 1) % AI_PLUGINS.length);
    } else {
      // 否则直接打开默认的AI对话
      router.push("/ai");
    }
  }, [isThinking, router]);

  const currentPlugin = AI_PLUGINS[currentPluginIndex];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* 思考气泡 - 显示在小人上方 */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }}
              className="absolute bottom-full right-0 mb-4"
            >
              {/* 主思考气泡 - 可点击 */}
              <motion.button
                onClick={() => handlePluginClick(currentPlugin)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative group
                  px-6 py-4 rounded-2xl
                  bg-gradient-to-br ${currentPlugin.color}
                  shadow-lg hover:shadow-xl
                  transition-all duration-300
                  cursor-pointer
                  backdrop-blur-sm
                  border border-white/20
                `}
              >
                {/* 气泡尾巴 */}
                <div className="absolute -bottom-2 right-8 w-4 h-4 bg-inherit transform rotate-45" />
                
                {/* 内容 */}
                <div className="flex items-center gap-3">
                  <motion.span 
                    className="text-4xl"
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {currentPlugin.emoji}
                  </motion.span>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm leading-tight">
                      {currentPlugin.label}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5">
                      点击探索 →
                    </p>
                  </div>
                </div>

                {/* 光效 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.button>

              {/* 小气泡装饰 */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute -bottom-6 right-6 w-3 h-3 bg-white rounded-full shadow-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -bottom-4 right-10 w-2 h-2 bg-white rounded-full shadow-md"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI小人角色 */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="AI助手"
          onClick={handleMainClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="notion-ai-button relative cursor-pointer"
          style={{
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--c-assCorButBac, #ffffff)',
            width: '56px',
            height: '56px',
            borderRadius: '100%',
            boxShadow: isThinking 
              ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(59, 130, 246, 0.2)'
              : 'var(--c-shaSM, 0 1px 3px rgba(0, 0, 0, 0.1))',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* 思考时的光环效果 */}
          {isThinking && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                  '0 0 0 8px rgba(59, 130, 246, 0)',
                  '0 0 0 0 rgba(59, 130, 246, 0)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}

          <div className="relative w-full h-full flex items-center justify-center">
            <div
              className="relative w-[56px] h-[56px] rounded-full overflow-hidden"
              style={{
                boxShadow: 'var(--c-shaMD, 0 2px 8px rgba(0, 0, 0, 0.15))',
              }}
            >
              {/* AI头像 - 静态/动态切换 */}
              <motion.img
                src={isThinking ? "/img/896e2255367f2b04.gif" : "/img/9ade71d75a1c0e93.png"}
                alt="AI助手"
                className="w-full h-full object-cover"
                animate={isThinking ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isThinking ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* 装饰配件 */}
            <motion.img
              src="/img/46e91f58a3919e25.png"
              alt="装饰"
              className="absolute pointer-events-none"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={isThinking ? {
                rotate: [-5, 5, -5],
              } : {}}
              transition={{
                duration: 2,
                repeat: isThinking ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* 状态指示器 */}
        {isThinking && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
          >
            <motion.div
              className="w-full h-full rounded-full bg-blue-400"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
