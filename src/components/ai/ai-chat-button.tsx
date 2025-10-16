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
      
      // 8秒后停止思考动画
      setTimeout(() => {
        setIsThinking(false);
        setTimeout(() => setShowBubble(false), 300);
      }, 8000);
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
        {/* 思考气泡 - 云朵卡通效果 */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25 
              }}
              className="absolute bottom-full right-0 mb-3"
              style={{ transformOrigin: 'bottom right' }}
            >
              {/* 主思考气泡 - 精致长方形 */}
              <motion.button
                onClick={() => handlePluginClick(currentPlugin)}
                whileHover={{ scale: 1.08, rotate: -2 }}
                whileTap={{ scale: 0.92 }}
                className="relative group cursor-pointer"
                style={{
                  filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.15))',
                }}
              >
                {/* 长方形容器 - 精致圆角 */}
                <div 
                  className={`
                    relative overflow-hidden
                    px-3 py-2.5
                    bg-gradient-to-br ${currentPlugin.color}
                    shadow-xl hover:shadow-2xl
                    transition-all duration-200
                    border-2 border-white/40
                    rounded-xl
                  `}
                  style={{
                    minWidth: '120px',
                  }}
                >
                  {/* 内容 - 紧凑布局 */}
                  <div className="relative z-10 flex items-center gap-2.5">
                    <motion.span 
                      className="text-2xl"
                      animate={{ 
                        rotate: [0, -8, 8, -8, 0],
                        scale: [1, 1.15, 1, 1.15, 1]
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
                      <p className="text-white font-semibold text-sm leading-tight whitespace-nowrap drop-shadow-sm">
                        {currentPlugin.label}
                      </p>
                    </div>
                  </div>

                  {/* 流动光效 - 不受边界限制 */}
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                      width: '150%',
                      left: '-25%',
                    }}
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.5,
                    }}
                  />

                  {/* 微妙的脉冲光晕 */}
                  <motion.div
                    className="absolute inset-0 rounded-[inherit] pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)',
                    }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* 外部光晕效果 - 可溢出 */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at center, ${
                      currentPlugin.color.includes('blue') ? 'rgba(59, 130, 246, 0.3)' :
                      currentPlugin.color.includes('green') ? 'rgba(34, 197, 94, 0.3)' :
                      currentPlugin.color.includes('yellow') ? 'rgba(251, 191, 36, 0.3)' :
                      'rgba(236, 72, 153, 0.3)'
                    } 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                    transform: 'scale(1.3)',
                  }}
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1.3, 1.5, 1.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.button>

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

            {/* 小鸭子装饰 - 思考时短暂消失 */}
            <AnimatePresence>
              {!showBubble && (
                <motion.img
                  src="/img/46e91f58a3919e25.png"
                  alt="装饰"
                  className="absolute pointer-events-none"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: isThinking ? [-3, 3, -3] : 0,
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8,
                    y: -10,
                    transition: { duration: 0.15 },
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    rotate: {
                      duration: 2,
                      repeat: isThinking ? Infinity : 0,
                      ease: "easeInOut",
                    },
                  }}
                  style={{
                    width: '66px',
                    height: '66px',
                    objectFit: 'contain',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 状态指示器 - 与卡片颜色一致 */}
        {isThinking && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg"
            style={{
              background: currentPlugin.color.includes('blue') ? '#3b82f6' :
                         currentPlugin.color.includes('green') ? '#22c55e' :
                         currentPlugin.color.includes('yellow') ? '#fbbf24' :
                         '#ec4899'
            }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background: currentPlugin.color.includes('blue') ? '#60a5fa' :
                           currentPlugin.color.includes('green') ? '#4ade80' :
                           currentPlugin.color.includes('yellow') ? '#fcd34d' :
                           '#f472b6'
              }}
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
