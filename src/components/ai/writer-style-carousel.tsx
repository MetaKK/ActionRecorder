'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Info } from 'lucide-react';
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

  // 卡片变体
  const getCardPosition = (offset: number) => {
    if (offset === 0) {
      return {
        x: 0,
        scale: 1,
        zIndex: 20,
        opacity: 1,
        rotateY: 0,
      };
    } else if (offset === 1) {
      return {
        x: '40%',
        scale: 0.75,
        zIndex: 10,
        opacity: 0.6,
        rotateY: -25,
      };
    } else if (offset === -1) {
      return {
        x: '-40%',
        scale: 0.75,
        zIndex: 10,
        opacity: 0.6,
        rotateY: 25,
      };
    } else {
      return {
        x: offset > 0 ? '100%' : '-100%',
        scale: 0.5,
        zIndex: 0,
        opacity: 0,
        rotateY: offset > 0 ? -45 : 45,
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
                    'relative w-full max-w-md h-[450px] sm:h-[550px] rounded-2xl overflow-hidden',
                    'cursor-pointer transition-shadow duration-300',
                    normalizedOffset === 0 ? 'shadow-2xl' : 'shadow-lg',
                  )}
                  onClick={() => normalizedOffset === 0 && handleSelect(style.id)}
                  onMouseEnter={() => normalizedOffset === 0 && setShowDetails(true)}
                  onMouseLeave={() => setShowDetails(false)}
                >
                  {/* 背景图/渐变 */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br"
                    style={{
                      backgroundImage: style.background 
                        ? `url(${style.background})`
                        : `linear-gradient(135deg, ${style.color.from}, ${style.color.to})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* 遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
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

                      {/* 选择按钮 */}
                      {normalizedOffset === 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300',
                            'flex items-center justify-center gap-2',
                            selectedStyle === style.id
                              ? 'bg-white text-gray-900'
                              : 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(style.id);
                          }}
                        >
                          <Sparkles className="w-4 h-4" />
                          {selectedStyle === style.id ? '已选择此风格' : '选择此风格'}
                        </motion.button>
                      )}
                    </motion.div>

                    {/* 详细信息（悬浮显示） */}
                    <AnimatePresence>
                      {showDetails && normalizedOffset === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-0 bg-black/95 backdrop-blur-md p-8 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-4">
                            <h3 className="text-2xl font-bold mb-4">风格特征</h3>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-2 opacity-70">核心特点</h4>
                              <div className="flex flex-wrap gap-2">
                                {style.characteristics.map((char, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/20"
                                  >
                                    {char}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2 opacity-70">风格描述</h4>
                              <p className="text-sm leading-relaxed opacity-90">
                                {style.description}
                              </p>
                            </div>

                            <button
                              onClick={() => setShowDetails(false)}
                              className="w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                            >
                              收起
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 选中指示器 */}
                  {selectedStyle === style.id && (
                    <motion.div
                      layoutId="selected-indicator"
                      className="absolute top-6 right-6 p-2 rounded-full bg-white shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 控制按钮 */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg hover:scale-110 transition-transform"
        aria-label="上一个"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg hover:scale-110 transition-transform"
        aria-label="下一个"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 指示器 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {styles.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
              setIsAutoPlay(false);
            }}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-1.5 bg-white/40 hover:bg-white/60',
            )}
            aria-label={`跳转到第 ${index + 1} 个`}
          />
        ))}
      </div>
    </div>
  );
}

