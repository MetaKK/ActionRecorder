'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Info, X } from 'lucide-react';
import { WriterStyle } from '@/lib/ai/diary/writer-styles';
import { cn } from '@/lib/utils';

interface WriterStyleCarouselProps {
  styles: WriterStyle[];
  selectedStyle: string | null;
  onSelectStyle: (styleId: string) => void;
}

export function WriterStyleCarousel({
  styles,
  selectedStyle,
  onSelectStyle,
}: WriterStyleCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const currentStyle = styles[currentIndex];

  // 自动播放
  useEffect(() => {
    if (isAutoPlay && !selectedStyle) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlay, selectedStyle]);

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + styles.length) % styles.length);
    setIsAutoPlay(false);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % styles.length);
  };

  const handleSelect = (styleId: string) => {
    onSelectStyle(styleId);
    setIsAutoPlay(false);
  };

  // 卡片变体 - 优化后的位置和视觉效果
  const getCardPosition = (offset: number) => {
    if (offset === 0) {
      // 中心卡片：完全不透明，最大尺寸，无旋转
      return {
        x: 0,
        scale: 1,
        zIndex: 20,
        opacity: 1,
        rotateY: 0,
        filter: 'blur(0px) brightness(1)',
      };
    } else if (offset === 1) {
      // 右侧卡片：模糊+半透明，营造景深
      return {
        x: '45%',
        scale: 0.7,
        zIndex: 10,
        opacity: 0.3,
        rotateY: -20,
        filter: 'blur(2px) brightness(0.7)',
      };
    } else if (offset === -1) {
      // 左侧卡片：模糊+半透明，营造景深
      return {
        x: '-45%',
        scale: 0.7,
        zIndex: 10,
        opacity: 0.3,
        rotateY: 20,
        filter: 'blur(2px) brightness(0.7)',
      };
    } else {
      // 隐藏的卡片
      return {
        x: offset > 0 ? '100%' : '-100%',
        scale: 0.5,
        zIndex: 0,
        opacity: 0,
        rotateY: offset > 0 ? -30 : 30,
        filter: 'blur(4px) brightness(0.5)',
      };
    }
  };

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] flex items-center justify-center perspective-[2000px]">
      
      {/* 背景渐变 */}
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-20 blur-3xl transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(135deg, ${currentStyle.color.from}, ${currentStyle.color.to})`,
        }}
      />

      {/* 卡片容器 */}
      <div className="relative w-full max-w-5xl h-full">
        <AnimatePresence initial={false} custom={direction}>
          {styles.map((style, index) => {
            const offset = (index - currentIndex + styles.length) % styles.length;
            const normalizedOffset = offset > styles.length / 2 ? offset - styles.length : offset;
            
            // 只渲染中心及相邻的卡片
            if (Math.abs(normalizedOffset) > 1) return null;

            return (
              <motion.div
                key={style.id}
                custom={direction}
                initial={getCardPosition(normalizedOffset + direction)}
                animate={getCardPosition(normalizedOffset)}
                exit={getCardPosition(normalizedOffset - direction)}
                transition={{
                  duration: 0.7,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className={cn(
                    'relative w-full max-w-md h-[450px] sm:h-[550px] rounded-3xl overflow-hidden',
                    'cursor-pointer transition-all duration-500',
                    normalizedOffset === 0 
                      ? 'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/10' 
                      : 'shadow-lg pointer-events-none',
                  )}
                  onClick={() => normalizedOffset === 0 && handleSelect(style.id)}
                  onMouseEnter={() => normalizedOffset === 0 && setShowDetails(true)}
                  onMouseLeave={() => setShowDetails(false)}
                  style={{
                    // 为中心卡片添加发光效果
                    ...(normalizedOffset === 0 && {
                      boxShadow: `
                        0 20px 60px -15px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.1),
                        0 0 40px -10px ${style.color.accent}40
                      `,
                    }),
                  }}
                >
                  {/* 背景图/渐变 */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: style.background 
                        ? `url(${style.background})`
                        : `linear-gradient(135deg, ${style.color.from}, ${style.color.to})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* 优化后的渐变遮罩 - 更清晰的内容展示 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
                    
                    {/* 顶部微妙光晕（仅中心卡片） */}
                    {normalizedOffset === 0 && (
                      <div 
                        className="absolute top-0 left-0 right-0 h-1/3 opacity-30"
                        style={{
                          background: `linear-gradient(180deg, ${style.color.accent}40 0%, transparent 100%)`,
                        }}
                      />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="relative h-full flex flex-col justify-end p-8 text-white">
                    
                    {/* 标签 */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                        <span className="text-2xl">{style.icon}</span>
                        <span className="text-xs font-medium">{style.era}</span>
                      </div>
                      {normalizedOffset === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(!showDetails);
                          }}
                          className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* 主要信息 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: normalizedOffset === 0 ? 1 : 0.5, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {/* 流派 */}
                      <div className="text-sm mb-2 opacity-90 font-medium tracking-wide">
                        {style.genre}
                      </div>

                      {/* 名字 */}
                      <h2 className="text-4xl sm:text-5xl font-bold mb-2 tracking-tight">
                        {style.name}
                      </h2>
                      <p className="text-lg opacity-80 mb-4">{style.nameEn}</p>

                      {/* 描述 */}
                      <p className="text-base opacity-90 mb-6 line-clamp-2">
                        {style.description}
                      </p>

                      {/* 特征标签 */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {style.characteristics.slice(0, 4).map((char, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                          >
                            {char}
                          </span>
                        ))}
                      </div>

                      {/* 选择按钮 - Apple风格 */}
                      {normalizedOffset === 0 && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'w-full py-3.5 px-6 rounded-2xl font-semibold transition-all duration-300',
                            'flex items-center justify-center gap-2',
                            'shadow-lg shadow-black/20',
                            selectedStyle === style.id
                              ? 'bg-white text-gray-900'
                              : 'bg-white/90 backdrop-blur-xl text-gray-900 hover:bg-white',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(style.id);
                          }}
                        >
                          <Sparkles className={cn(
                            "w-4 h-4 transition-colors",
                            selectedStyle === style.id ? "text-yellow-500" : "text-gray-700"
                          )} />
                          <span className="text-[15px] tracking-tight">
                            {selectedStyle === style.id ? '已选择' : '选择此风格'}
                          </span>
                        </motion.button>
                      )}
                    </motion.div>

                    {/* 详细信息（悬浮显示）- 毛玻璃样式 */}
                    <AnimatePresence>
                      {showDetails && normalizedOffset === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 bg-black/98 backdrop-blur-2xl p-8 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-bold tracking-tight">风格特征</h3>
                              <button
                                onClick={() => setShowDetails(false)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider opacity-60">核心特点</h4>
                              <div className="flex flex-wrap gap-2">
                                {style.characteristics.map((char, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-2 text-sm rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 font-medium"
                                  >
                                    {char}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider opacity-60">风格描述</h4>
                              <p className="text-[15px] leading-relaxed opacity-90">
                                {style.description}
                              </p>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider opacity-60">流派</h4>
                              <p className="text-sm opacity-80">{style.genre}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 选中指示器 - 精致的徽章样式 */}
                  {selectedStyle === style.id && normalizedOffset === 0 && (
                    <motion.div
                      layoutId="selected-indicator"
                      className="absolute top-5 right-5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xl shadow-lg shadow-black/20 border border-white/20"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-xs font-semibold text-gray-900 tracking-tight">已选</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 控制按钮 - Apple/Netflix风格 */}
      {/* <motion.button
        onClick={handlePrevious}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl shadow-black/10 border border-white/20 hover:bg-white dark:hover:bg-gray-800 transition-all"
        aria-label="上一个"
      >
        <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
      </motion.button>
      <motion.button
        onClick={handleNext}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl shadow-black/10 border border-white/20 hover:bg-white dark:hover:bg-gray-800 transition-all"
        aria-label="下一个"
      >
        <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
      </motion.button> */}

      {/* 指示器 - 精致圆点 */}
      {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
        {styles.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
              setIsAutoPlay(false);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'rounded-full transition-all duration-300',
              index === currentIndex
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60',
            )}
            aria-label={`跳转到第 ${index + 1} 个`}
          />
        ))}
      </div> */}
    </div>
  );
}

