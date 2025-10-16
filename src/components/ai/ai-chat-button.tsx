"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlugins, usePluginNavigation, registerPresetPlugins } from "@/lib/plugins";

// 初始化插件系统
if (typeof window !== "undefined") {
  registerPresetPlugins();
}

export function AIChatButton() {
  const [isThinking, setIsThinking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [currentPluginIndex, setCurrentPluginIndex] = useState(0);

  // 获取所有已启用的插件
  const plugins = usePlugins();
  const { navigateToPlugin } = usePluginNavigation();

  // 间歇性思考动画
  useEffect(() => {
    const triggerThinking = () => {
      setIsThinking(true);
      setShowBubble(true);

      // 随机选择一个插件
      setCurrentPluginIndex(Math.floor(Math.random() * plugins.length));

      // 8秒后停止思考动画
      setTimeout(() => {
        setIsThinking(false);
        setTimeout(() => setShowBubble(false), 300);
      }, 8000);
    };

    // 初始延迟 3 秒
    const initialTimeout = setTimeout(triggerThinking, 3000);

    // 之后每 15-25 秒触发一次
    const intervalId = setInterval(() => {
      const randomDelay = 15000 + Math.random() * 10000;
      setTimeout(triggerThinking, randomDelay);
    }, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [plugins.length]);

  // 处理插件点击
  const handlePluginClick = async () => {
    const plugin = plugins[currentPluginIndex];
    if (plugin) {
      await navigateToPlugin(plugin.metadata.id);
    }
  };

  const currentPlugin = plugins[currentPluginIndex];

  if (plugins.length === 0) {
    return null; // 没有插件时不显示
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 思考泡泡 */}
      <AnimatePresence>
        {showBubble && currentPlugin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative"
          >
            {/* 泡泡主体 */}
            <motion.div
              onClick={handlePluginClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative px-5 py-3 rounded-2xl cursor-pointer
                bg-gradient-to-r ${currentPlugin.metadata.color}
                shadow-lg hover:shadow-xl
                transition-shadow duration-300
              `}
            >
              {/* 渐变光晕 */}
              <div className="absolute inset-0 rounded-2xl opacity-50 blur-xl bg-gradient-to-r from-white/30 to-transparent" />

              {/* 内容 */}
              <div className="relative flex items-center gap-2 text-white">
                <motion.span
                  animate={isThinking ? {
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  className="text-xl"
                >
                  {currentPlugin.metadata.icon}
                </motion.span>
                <span className="font-medium whitespace-nowrap">
                  {currentPlugin.metadata.name}
                </span>
              </div>

              {/* 泡泡尾巴 */}
              <div 
                className={`absolute -bottom-2 right-8 w-4 h-4 bg-gradient-to-br ${currentPlugin.metadata.color} rotate-45 rounded-sm`}
                style={{
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,1))',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,1))',
                }}
              />
            </motion.div>

            {/* 小泡泡 */}
            <motion.div
              animate={{
                y: [0, -5, 0],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute -bottom-4 right-12 w-2 h-2 bg-gradient-to-br ${currentPlugin.metadata.color} rounded-full`}
            />
            <motion.div
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className={`absolute -bottom-6 right-14 w-1.5 h-1.5 bg-gradient-to-br ${currentPlugin.metadata.color} rounded-full`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 情绪小人（旧版样式） */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        className="relative"
        whileHover={{ 
          scale: 1.05,
          transition: { type: "spring", stiffness: 400, damping: 15 }
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 主容器 */}
        <div 
          className="relative w-[56px] h-[56px] cursor-pointer"
          onClick={() => {
            if (!showBubble) {
              setIsThinking(true);
              setShowBubble(true);
              setCurrentPluginIndex(Math.floor(Math.random() * plugins.length));
              setTimeout(() => {
                setIsThinking(false);
                setTimeout(() => setShowBubble(false), 300);
              }, 8000);
            }
          }}
        >
          {/* AI头像 */}
          <div
            className="relative w-[56px] h-[56px] rounded-full overflow-hidden bg-white"
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
    </div>
  );
}

