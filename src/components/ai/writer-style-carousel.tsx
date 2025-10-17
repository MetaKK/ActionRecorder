'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Sparkles, Info, X } from 'lucide-react';
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
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();

  const currentStyle = styles[currentIndex];

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % styles.length);
  }, [styles.length]);

  // 自动播放 - 详情展开时暂停
  useEffect(() => {
    if (isAutoPlay && !selectedStyle && !showDetails) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlay, selectedStyle, showDetails, handleNext]);

  const handleSelect = (styleId: string) => {
    onSelectStyle(styleId);
    setIsAutoPlay(false);
  };

  // 手势处理函数
  const handleDragStart = () => {
    setIsDragging(true);
    setIsAutoPlay(false); // 拖拽时暂停自动播放
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    setDragX(0);
    
    const threshold = 100; // 拖拽阈值
    const velocity = info.velocity.x;
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 || velocity > 0) {
        // 向右拖拽 - 上一张
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + styles.length) % styles.length);
      } else {
        // 向左拖拽 - 下一张
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % styles.length);
      }
    }
  };

  // 歌词滚动不需要额外的状态管理

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

      {/* 卡片容器 - 支持拖拽手势 */}
      <motion.div 
        className="relative w-full max-w-5xl h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        dragControls={dragControls}
        style={{
          x: isDragging ? dragX : 0,
        }}
      >
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
                             const newState = !showDetails;
                             setShowDetails(newState);
                             // 点击详情按钮时也暂停自动播放
                             if (newState) {
                               setIsAutoPlay(false);
                             }
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

                    {/* 详细信息（Apple风格）- 纵向滚动名言 */}
                    <AnimatePresence>
                      {showDetails && normalizedOffset === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ 
                            duration: 0.5, 
                            ease: [0.32, 0.72, 0, 1]
                          }}
                          className="absolute inset-0 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundImage: 'url(/img/grain.bg.png), linear-gradient(180deg, rgba(0,0,0,0.96) 0%, rgba(10,10,10,0.98) 100%)',
                            backgroundBlendMode: 'overlay',
                          }}
                        >
                          {/* 顶部渐变遮罩 */}
                          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />
                          
                          {/* 底部渐变遮罩 */}
                          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

                          {/* 关闭按钮 */}
                          <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setShowDetails(false)}
                            className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 flex items-center justify-center"
                          >
                            <X className="w-5 h-5" />
                          </motion.button>

                          {/* 作家信息（顶部，固定） */}
                          {/* <div className="absolute top-8 left-8 right-20 z-10">
                            <motion.div
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1, duration: 0.5 }}
                              className="flex items-center gap-3"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg"
                                   style={{
                                     backgroundImage: `linear-gradient(135deg, ${style.color.from}, ${style.color.to})`,
                                   }}>
                                {style.icon}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold tracking-tight">{style.name}</h3>
                                <p className="text-xs opacity-50 mt-0.5">{style.nameEn}</p>
                              </div>
                            </motion.div>
                          </div> */}

                          {/* 名言滚动容器 - 歌词滚动效果 */}
                          <div className="absolute inset-0 overflow-hidden">
                            <motion.div
                              key={`lyrics-${style.id}`}
                              className="relative w-full h-full"
                              animate={{
                                y: [0, -100 * style.famousQuotes.length]
                              }}
                              transition={{
                                duration: style.famousQuotes.length * 8, // 每句8秒
                                ease: 'linear',
                                repeat: Infinity,
                                repeatDelay: 2, // 循环间隔2秒
                              }}
                            >
                              {/* 渲染所有名言，形成连续滚动 */}
                              {style.famousQuotes.map((quote, index) => (
                                <div
                                  key={`quote-${index}`}
                                  className="absolute w-full flex items-center justify-center"
                                  style={{
                                    top: `${index * 100}%`, // 每句占100%高度
                                    height: '100%',
                                  }}
                                >
                                  <div className="text-center px-8 sm:px-12 max-w-4xl">
                                    {/* 名言文本 */}
                                    <p className="text-2xl sm:text-3xl md:text-4xl font-light leading-relaxed tracking-wide"
                                       style={{
                                         textShadow: '0 4px 40px rgba(0,0,0,0.8)',
                                         fontFamily: "'Noto Serif SC', 'Songti SC', 'PingFang SC', serif",
                                         letterSpacing: '0.03em',
                                         lineHeight: '1.6',
                                         WebkitFontSmoothing: 'antialiased',
                                       }}>
                                      &ldquo;{quote}&rdquo;
                                    </p>
                                    
                                    {/* 作家署名 */}
                                    <div className="flex items-center justify-center gap-4 mt-6 opacity-60">
                                      <div className="h-px w-12 bg-white/30" />
                                      <span className="text-sm tracking-[0.2em] uppercase font-medium">{style.name}</span>
                                      <div className="h-px w-12 bg-white/30" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* 循环标记 - 重复第一句名言 */}
                              <div
                                className="absolute w-full flex items-center justify-center"
                                style={{
                                  top: `${style.famousQuotes.length * 100}%`,
                                  height: '100%',
                                }}
                              >
                                <div className="text-center px-8 sm:px-12 max-w-4xl">
                                  <p className="text-2xl sm:text-3xl md:text-4xl font-light leading-relaxed tracking-wide"
                                     style={{
                                       textShadow: '0 4px 40px rgba(0,0,0,0.8)',
                                       fontFamily: "'Noto Serif SC', 'Songti SC', 'PingFang SC', serif",
                                       letterSpacing: '0.03em',
                                       lineHeight: '1.6',
                                       WebkitFontSmoothing: 'antialiased',
                                     }}>
                                    &ldquo;{style.famousQuotes[0]}&rdquo;
                                  </p>
                                  
                                  <div className="flex items-center justify-center gap-4 mt-6 opacity-60">
                                    <div className="h-px w-12 bg-white/30" />
                                    <span className="text-sm tracking-[0.2em] uppercase font-medium">{style.name}</span>
                                    <div className="h-px w-12 bg-white/30" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>

                          {/* 音频播放器接口（预留） */}
                          {/* <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                          >
                            <button className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">🎵 朗读名言</span>
                              </div>
                            </button>
                          </motion.div> */}
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
      </motion.div>

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

