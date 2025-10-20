"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo, useMotionValue } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export interface TravelContent {
  id: string;
  videoUrl: string;
  title?: string;
  location?: string;
}

export interface WindowFrame {
  id: string;
  imageUrl: string;
  name?: string;
}

interface WindowTravelViewProps {
  videos: TravelContent[];
  windowFrames: WindowFrame[];
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export function WindowTravelOptimized({
  videos,
  windowFrames,
  autoPlay = true,
  loop = true,
  className = "",
}: WindowTravelViewProps) {
  // 核心状态 - 简化状态管理
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentWindowIndex, setCurrentWindowIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs - 简化引用管理
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const startTouchRef = useRef<{ y: number; time: number } | null>(null);
  
  // Motion values - 简化动画值
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  
  // 计算属性
  const currentVideo = videos[currentVideoIndex];
  const currentWindow = windowFrames[currentWindowIndex];
  const nextVideoIndex = (currentVideoIndex + 1) % videos.length;
  const prevVideoIndex = (currentVideoIndex - 1 + videos.length) % videos.length;

  // 预加载下一个视频 - 简化预加载策略
  useEffect(() => {
    if (nextVideoRef.current && videos[nextVideoIndex]) {
      nextVideoRef.current.src = videos[nextVideoIndex].videoUrl;
      nextVideoRef.current.load();
    }
  }, [nextVideoIndex, videos]);

  // 初始化视频 - 简化初始化逻辑
  useEffect(() => {
    if (videoRef.current && !showStartScreen) {
      videoRef.current.muted = isMuted;
      if (autoPlay) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [currentVideoIndex, isMuted, autoPlay, showStartScreen]);

  // 标题自动隐藏
  useEffect(() => {
    setShowTitle(true);
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [currentVideoIndex]);

  // 简化的手势处理 - 参考travel-pov-app的实现
  const handleTouchStart = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (isTransitioning) return;
    
    const touch = 'touches' in e ? e.touches[0] : e;
    startTouchRef.current = {
      y: touch.clientY,
      time: Date.now()
    };
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (!startTouchRef.current || isTransitioning) return;
    
    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    const deltaY = touch.clientY - startTouchRef.current.y;
    
    // 限制滑动范围
    const maxOffset = window.innerHeight * 0.3;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaY));
    y.set(clampedOffset);
  }, [isTransitioning, y]);

  // 切换视频 - 简化切换逻辑
  const switchVideo = useCallback((direction: 'up' | 'down') => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentVideoIndex(prev => {
      if (direction === 'up') {
        return (prev + 1) % videos.length;
      } else {
        return (prev - 1 + videos.length) % videos.length;
      }
    });
    
    // 切换完成后重置状态
    setTimeout(() => {
      setIsTransitioning(false);
      y.set(0);
    }, 300);
  }, [videos.length, isTransitioning, y]);

  // 切换窗口 - 简化窗口切换
  const switchWindow = useCallback((direction: 'left' | 'right') => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentWindowIndex(prev => {
      if (direction === 'left') {
        return (prev + 1) % windowFrames.length;
      } else {
        return (prev - 1 + windowFrames.length) % windowFrames.length;
      }
    });
    
    // 切换完成后重置状态
    setTimeout(() => {
      setIsTransitioning(false);
      x.set(0);
    }, 300);
  }, [windowFrames.length, isTransitioning, x]);

  const handleTouchEnd = useCallback(() => {
    if (!startTouchRef.current || isTransitioning) return;
    
    const threshold = window.innerHeight * 0.15; // 15% 的屏幕高度作为阈值
    const velocity = Math.abs(y.get() / (Date.now() - startTouchRef.current.time));
    
    // 根据滑动距离和速度决定是否切换视频
    if (Math.abs(y.get()) > threshold || velocity > 0.5) {
      if (y.get() > 0) {
        // 向下滑动 - 上一个视频
        switchVideo('down');
      } else if (y.get() < 0) {
        // 向上滑动 - 下一个视频
        switchVideo('up');
      }
    }
    
    // 重置状态
    y.set(0);
    startTouchRef.current = null;
  }, [y, isTransitioning, switchVideo]);

  // 简化的拖拽处理
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    // 简化的方向判断
    const isVerticalSwipe = absY > absX;
    const isHorizontalSwipe = absX > absY && absX > 20;
    
    if (isVerticalSwipe) {
      if (offset.y < -20 || velocity.y < -100) {
        switchVideo('up');
      } else if (offset.y > 20 || velocity.y > 100) {
        switchVideo('down');
      }
    } else if (isHorizontalSwipe) {
      if (offset.x < -20 || velocity.x < -100) {
        switchWindow('left');
      } else if (offset.x > 20 || velocity.x > 100) {
        switchWindow('right');
      }
    }
    
    // 重置位置
    setTimeout(() => {
      y.set(0);
      x.set(0);
    }, 300);
  }, [switchVideo, switchWindow, y, x]);

  // 开始体验
  const handleStartExperience = useCallback(() => {
    setShowStartScreen(false);
  }, []);

  // 切换静音状态
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // 键盘导航支持
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        switchVideo('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        switchVideo('down');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        switchWindow('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        switchWindow('right');
        break;
      case ' ':
        event.preventDefault();
        toggleMute();
        break;
    }
  }, [switchVideo, switchWindow, toggleMute]);

  // 触摸事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStartCapture = (e: TouchEvent) => handleTouchStart(e);
    const handleTouchMoveCapture = (e: TouchEvent) => handleTouchMove(e);
    const handleTouchEndCapture = () => handleTouchEnd();

    container.addEventListener('touchstart', handleTouchStartCapture, { passive: true });
    container.addEventListener('touchmove', handleTouchMoveCapture, { passive: false });
    container.addEventListener('touchend', handleTouchEndCapture, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStartCapture);
      container.removeEventListener('touchmove', handleTouchMoveCapture);
      container.removeEventListener('touchend', handleTouchEndCapture);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // 键盘事件监听
  useEffect(() => {
    if (!showStartScreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showStartScreen, handleKeyDown]);

  // 简化的动画变体 - 参考travel-pov-app的简洁动画
  const getVideoVariants = (direction: string) => ({
    initial: direction === 'up' ? { 
      y: '100%', 
      opacity: 0.8
    } : { 
      y: '-100%', 
      opacity: 0.8
    },
    animate: { 
      y: 0, 
      opacity: 1
    },
    exit: direction === 'up' ? { 
      y: '-100%', 
      opacity: 0.8
    } : { 
      y: '100%', 
      opacity: 0.8
    },
    transition: { 
      type: "spring" as const, 
      stiffness: 200, 
      damping: 25,
      mass: 0.8
    }
  });

  const getWindowVariants = (direction: string) => ({
    initial: direction === 'left' ? { 
      x: '100%', 
      opacity: 0.7
    } : { 
      x: '-100%', 
      opacity: 0.7
    },
    animate: { 
      x: 0, 
      opacity: 1
    },
    exit: direction === 'left' ? { 
      x: '-100%', 
      opacity: 0.7
    } : { 
      x: '100%', 
      opacity: 0.7
    },
    transition: { 
      type: "spring" as const, 
      stiffness: 150, 
      damping: 20,
      mass: 1.0
    }
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden bg-black ${className}`}
    >
      {/* 启动页面 */}
      <AnimatePresence>
        {showStartScreen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center gap-8 px-6"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-8xl"
              >
                ✈️
              </motion.div>

              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  窗口旅行
                </h1>
                <p className="text-lg text-white/80 mb-2">
                  透过窗口，看见世界
                </p>
                <p className="text-sm text-white/60">
                  沉浸式旅行视频体验
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartExperience}
                className="mt-4 px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all"
              >
                开始体验
              </motion.button>

              <div className="mt-8 text-center text-white/50 text-sm space-y-2">
                <p>💡 上下滑动切换视频</p>
                <p>💡 左右滑动切换窗口</p>
                <p>⌨️ 方向键导航，空格键静音</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载状态 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mb-6"
              />
              
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-white text-lg font-light tracking-wide"
              >
                正在加载旅行视频...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 视频层 - 简化视频处理 */}
      <motion.div
        drag="y"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        dragPropagation={false}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVideo.id}
            {...getVideoVariants('up')}
            className="absolute inset-0"
          >
            <video
              ref={videoRef}
              src={currentVideo.videoUrl}
              className="w-full h-full object-cover"
              loop={loop}
              muted={isMuted}
              playsInline
              preload="auto"
              autoPlay={autoPlay}
              onLoadedData={() => {
                setIsLoading(false);
                console.log('视频加载完成:', currentVideo.videoUrl);
              }}
              onCanPlay={() => {
                setIsLoading(false);
                console.log('视频可以播放:', currentVideo.videoUrl);
              }}
              onError={(e) => {
                console.error('视频加载失败:', currentVideo.videoUrl, e);
                setIsLoading(false);
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* 预加载下一个视频 */}
        <video
          ref={nextVideoRef}
          className="hidden"
          preload="auto"
        />
      </motion.div>

      {/* 窗口框架层 - 简化窗口处理 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        dragPropagation={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute inset-0 z-10 pointer-events-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWindow.id}
            {...getWindowVariants('left')}
            className="absolute inset-0 pointer-events-none"
          >
            <Image
              src={currentWindow.imageUrl}
              alt={currentWindow.name || "窗口框架"}
              width={800}
              height={600}
              className="w-full h-full object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* UI层 - 简化UI */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* 音频控制按钮 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all pointer-events-auto"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </motion.button>

        {/* 切换指示器 */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 视频标题 */}
        <AnimatePresence>
          {currentVideo.title && showTitle && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-6 left-6"
            >
              <h3 className="text-white text-xl font-light tracking-wide drop-shadow-lg">
                {currentVideo.title}
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}