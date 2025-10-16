"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * 车窗风景组件 - 模拟旅行时从车窗看到的风景
 * 灵感来自 travel-pov-app
 */
export function TravelView() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100">
      {/* 天空背景 */}
      <div className="absolute inset-0">
        {/* 云朵动画 */}
        <motion.div
          className="absolute top-10 left-0 w-full h-32"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/70 rounded-full blur-sm"
              style={{
                width: `${80 + Math.random() * 100}px`,
                height: `${40 + Math.random() * 40}px`,
                left: `${i * 25}%`,
                top: `${Math.random() * 60}px`,
              }}
            />
          ))}
        </motion.div>

        {/* 更多云朵层 */}
        <motion.div
          className="absolute top-20 left-0 w-full h-32"
          animate={{
            x: ['-150%', '250%'],
          }}
          transition={{
            duration: 80,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/50 rounded-full blur-md"
              style={{
                width: `${100 + Math.random() * 120}px`,
                height: `${50 + Math.random() * 50}px`,
                left: `${i * 30}%`,
                top: `${Math.random() * 80}px`,
              }}
            />
          ))}
        </motion.div>

        {/* 太阳 */}
        <motion.div
          className="absolute top-12 right-20 w-24 h-24 bg-yellow-300 rounded-full blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 远山 */}
      <div className="absolute bottom-1/3 left-0 w-full">
        <motion.div
          className="relative w-[200%] h-48 flex"
          animate={{
            x: [0, '-50%'],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{
                width: '25%',
              }}
            >
              <svg
                viewBox="0 0 200 100"
                className="w-full h-48"
                preserveAspectRatio="none"
              >
                <path
                  d={`M 0,100 L 0,${60 + Math.random() * 20} L ${50 + Math.random() * 50},${40 + Math.random() * 20} L ${100 + Math.random() * 50},${60 + Math.random() * 20} L 200,100 Z`}
                  fill="rgba(99, 102, 241, 0.3)"
                />
              </svg>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 近景树木 */}
      <div className="absolute bottom-0 left-0 w-full h-1/2">
        <motion.div
          className="relative w-[300%] h-full flex items-end"
          animate={{
            x: [0, '-66.66%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(30)].map((_, i) => {
            const height = 60 + Math.random() * 100;
            const isTree = Math.random() > 0.3;
            return (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center justify-end"
                style={{
                  width: '80px',
                  marginLeft: `${10 + Math.random() * 40}px`,
                }}
              >
                {isTree ? (
                  // 树
                  <>
                    <div
                      className="bg-green-600/80 rounded-full"
                      style={{
                        width: `${40 + Math.random() * 40}px`,
                        height: `${height}px`,
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                      }}
                    />
                    <div
                      className="bg-amber-800"
                      style={{
                        width: '8px',
                        height: '30px',
                      }}
                    />
                  </>
                ) : (
                  // 灌木
                  <div
                    className="bg-green-700/70 rounded-t-full"
                    style={{
                      width: `${30 + Math.random() * 30}px`,
                      height: `${30 + Math.random() * 40}px`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* 道路/地面 */}
      <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-gray-600/30 to-transparent">
        {/* 道路标线 */}
        <motion.div
          className="absolute bottom-10 left-0 w-[200%] h-2 flex gap-8"
          animate={{
            x: [0, '-50%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 bg-white/60 rounded-full"
              style={{
                width: '60px',
                height: '4px',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* 车窗框架效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 顶部遮罩 */}
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-gray-900/20 to-transparent" />
        {/* 底部遮罩 */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-900/20 to-transparent" />
        {/* 左侧窗框 */}
        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-gray-900/30 to-transparent" />
        {/* 右侧窗框 */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-gray-900/30 to-transparent" />
      </div>

      {/* 时间显示 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full
            border border-white/20 shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl font-light text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-white/80">
              享受这份宁静
            </div>
          </div>
        </motion.div>
      </div>

      {/* 底部提示文字 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="text-white/60 text-lg font-light text-center">
          <motion.div
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            放慢脚步，感受旅途中的美好
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

