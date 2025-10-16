"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface ImmersiveContainerProps {
  children: ReactNode;
  /**
   * 是否显示返回按钮
   * @default true
   */
  showBackButton?: boolean;
  /**
   * 返回按钮的位置
   * @default 'top-left'
   */
  backButtonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /**
   * 自定义返回路径，默认返回上一页
   */
  backRoute?: string;
  /**
   * 是否显示情绪小人（但不弹卡片）
   * @default true
   */
  showEmotionCharacter?: boolean;
  /**
   * 是否全屏沉浸（隐藏所有UI）
   * @default false
   */
  fullImmersive?: boolean;
}

export function ImmersiveContainer({
  children,
  showBackButton = true,
  backButtonPosition = 'top-left',
  backRoute,
  showEmotionCharacter = true,
  fullImmersive = false,
}: ImmersiveContainerProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backRoute) {
      router.push(backRoute);
    } else {
      router.back();
    }
  };

  // 根据位置计算返回按钮的样式
  const getBackButtonPosition = () => {
    switch (backButtonPosition) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      default:
        return 'top-6 left-6';
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 沉浸式内容区域 */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* 返回按钮 */}
      <AnimatePresence>
        {showBackButton && !fullImmersive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className={`fixed ${getBackButtonPosition()} z-50 
              flex items-center gap-2 px-4 py-2.5 
              bg-white/90 dark:bg-gray-900/90 
              backdrop-blur-xl backdrop-saturate-150
              border border-gray-200/50 dark:border-gray-700/50
              rounded-full shadow-lg 
              hover:bg-white dark:hover:bg-gray-900
              transition-all duration-300
              group`}
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300 
              group-hover:text-gray-900 dark:group-hover:text-white
              transition-colors" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300
              group-hover:text-gray-900 dark:group-hover:text-white
              transition-colors">
              返回
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 情绪小人（沉浸式模式下，不显示思考窗） */}
      {showEmotionCharacter && !fullImmersive && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative cursor-default"
            style={{
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              width: '56px',
              height: '56px',
              borderRadius: '100%',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                className="relative w-[56px] h-[56px] rounded-full overflow-hidden"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                {/* AI头像 - 静态显示 */}
                <img
                  src="/img/9ade71d75a1c0e93.png"
                  alt="AI助手"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 小鸭子装饰 */}
              <img
                src="/img/46e91f58a3919e25.png"
                alt="装饰"
                className="absolute pointer-events-none"
                style={{
                  width: '66px',
                  height: '66px',
                  objectFit: 'contain',
                  top: '30%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

