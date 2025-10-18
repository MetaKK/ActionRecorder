"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo, useMotionValue } from "framer-motion";
import { Loader2 } from "lucide-react";

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

// 视频缓存管理器
class VideoCache {
  private cache = new Map<string, HTMLVideoElement>();
  private maxSize = 3; // 最多缓存3个视频

  getVideo(url: string): HTMLVideoElement | null {
    return this.cache.get(url) || null;
  }

  setVideo(url: string, video: HTMLVideoElement): void {
    if (this.cache.size >= this.maxSize) {
      // 移除最旧的视频
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const oldVideo = this.cache.get(firstKey);
        if (oldVideo) {
          oldVideo.pause();
          oldVideo.src = '';
        }
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(url, video);
  }

  preloadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const cached = this.getVideo(url);
      if (cached && cached.readyState >= 3) {
        resolve(cached);
        return;
      }

      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      
      video.addEventListener('loadeddata', () => {
        this.setVideo(url, video);
        resolve(video);
      }, { once: true });
      
      video.addEventListener('error', reject, { once: true });
      video.load();
    });
  }

  clear(): void {
    this.cache.forEach(video => {
      video.pause();
      video.src = '';
    });
    this.cache.clear();
  }
}

// 手势管理器
class GestureManager {
  private isDragging = false;
  private startTime = 0;
  private startPosition = { x: 0, y: 0 };
  private velocity = { x: 0, y: 0 };
  
  private readonly SWIPE_THRESHOLD = 50;
  private readonly VELOCITY_THRESHOLD = 500;
  private readonly SWIPE_TIMEOUT = 300;

  handleDragStart(): void {
    this.isDragging = true;
    this.startTime = Date.now();
  }

  handleDragMove(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    if (!this.isDragging) return;
    
    this.velocity = {
      x: info.velocity.x,
      y: info.velocity.y
    };
  }

  handleDragEnd(
    event: MouseEvent | TouchEvent | PointerEvent, 
    info: PanInfo,
    onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void
  ): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const { offset, velocity } = info;
    const duration = Date.now() - this.startTime;

    // 防抖：如果拖拽时间太短，忽略
    if (duration < 100) return;

    // 判断主要滑动方向
    const isVerticalSwipe = Math.abs(offset.y) > Math.abs(offset.x);
    const isHorizontalSwipe = Math.abs(offset.x) > Math.abs(offset.y);

    if (isVerticalSwipe) {
      if (offset.y < -this.SWIPE_THRESHOLD || velocity.y < -this.VELOCITY_THRESHOLD) {
        onSwipe('up');
      } else if (offset.y > this.SWIPE_THRESHOLD || velocity.y > this.VELOCITY_THRESHOLD) {
        onSwipe('down');
      }
    } else if (isHorizontalSwipe) {
      if (offset.x < -this.SWIPE_THRESHOLD || velocity.x < -this.VELOCITY_THRESHOLD) {
        onSwipe('left');
      } else if (offset.x > this.SWIPE_THRESHOLD || velocity.x > this.VELOCITY_THRESHOLD) {
        onSwipe('right');
      }
    }
  }
}

export function WindowTravelOptimized({
  videos,
  windowFrames,
  autoPlay = true,
  loop = true,
  className = "",
}: WindowTravelViewProps) {
  // 核心状态
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentWindowIndex, setCurrentWindowIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoCacheRef = useRef(new VideoCache());
  const gestureManagerRef = useRef(new GestureManager());
  
  // Motion values
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  
  // 计算属性
  const currentVideo = useMemo(() => videos[currentVideoIndex], [videos, currentVideoIndex]);
  const currentWindow = useMemo(() => windowFrames[currentWindowIndex], [windowFrames, currentWindowIndex]);
  
  // 预加载视频
  const preloadVideos = useCallback(async () => {
    if (!videos.length) return;
    
    try {
      // 预加载当前和下一个视频
      const currentUrl = videos[currentVideoIndex]?.videoUrl;
      const nextIndex = (currentVideoIndex + 1) % videos.length;
      const nextUrl = videos[nextIndex]?.videoUrl;
      
      const promises = [];
      if (currentUrl) promises.push(videoCacheRef.current.preloadVideo(currentUrl));
      if (nextUrl && nextUrl !== currentUrl) promises.push(videoCacheRef.current.preloadVideo(nextUrl));
      
      await Promise.all(promises);
    } catch (error) {
      console.warn('视频预加载失败:', error);
    }
  }, [videos, currentVideoIndex]);

  // 初始化视频播放
  const initializeVideo = useCallback(async () => {
    if (!currentVideo?.videoUrl) return;
    
    setIsLoading(true);
    
    try {
      const video = await videoCacheRef.current.preloadVideo(currentVideo.videoUrl);
      
      if (video) {
        video.currentTime = 0;
        video.muted = false;
        video.loop = loop;
        
        if (autoPlay) {
          await video.play();
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('视频播放失败:', error);
      setIsLoading(false);
    }
  }, [currentVideo, autoPlay, loop]);

  // 切换视频
  const switchVideo = useCallback((direction: 'up' | 'down') => {
    setCurrentVideoIndex(prev => {
      if (direction === 'up') {
        return (prev + 1) % videos.length;
      } else {
        return (prev - 1 + videos.length) % videos.length;
      }
    });
  }, [videos.length]);

  // 切换窗口
  const switchWindow = useCallback((direction: 'left' | 'right') => {
    setCurrentWindowIndex(prev => {
      if (direction === 'left') {
        return (prev + 1) % windowFrames.length;
      } else {
        return (prev - 1 + windowFrames.length) % windowFrames.length;
      }
    });
  }, [windowFrames.length]);

  // 手势处理
  const handleDragStart = useCallback(() => {
    gestureManagerRef.current.handleDragStart();
  }, []);

  const handleDragMove = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    gestureManagerRef.current.handleDragMove(event, info);
  }, []);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    gestureManagerRef.current.handleDragEnd(event, info, (direction) => {
      if (direction === 'up' || direction === 'down') {
        switchVideo(direction);
      } else if (direction === 'left' || direction === 'right') {
        switchWindow(direction);
      }
      
      // 重置位置
      setTimeout(() => {
        y.set(0);
        x.set(0);
      }, 300);
    });
  }, [switchVideo, switchWindow, y, x]);

  // 开始体验
  const handleStartExperience = useCallback(() => {
    setShowStartScreen(false);
  }, []);

  // 标题自动隐藏
  useEffect(() => {
    setShowTitle(true);
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [currentVideoIndex]);

  // 初始化
  useEffect(() => {
    if (!showStartScreen) {
      initializeVideo();
    }
  }, [showStartScreen, initializeVideo]);

  // 预加载
  useEffect(() => {
    preloadVideos();
  }, [preloadVideos]);

  // 清理
  useEffect(() => {
    return () => {
      videoCacheRef.current.clear();
    };
  }, []);

  // 动画变体
  const getVideoVariants = (direction: string) => ({
    initial: direction === 'up' ? { y: '100%' } : { y: '-100%' },
    animate: { y: 0 },
    exit: direction === 'up' ? { y: '-100%' } : { y: '100%' },
    transition: { type: "spring" as const, stiffness: 300, damping: 30 }
  });

  const getWindowVariants = (direction: string) => ({
    initial: direction === 'left' ? { x: '100%' } : { x: '-100%' },
    animate: { x: 0 },
    exit: direction === 'left' ? { x: '-100%' } : { x: '100%' },
    transition: { type: "spring" as const, stiffness: 300, damping: 30 }
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
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <p className="text-white text-lg">正在加载旅行视频...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 视频层 */}
      <motion.div
        drag="y"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDragMove}
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
              src={currentVideo.videoUrl}
              className="w-full h-full object-cover"
              loop={loop}
              muted={false}
              playsInline
              preload="auto"
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 窗口框架层 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDragMove}
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

      {/* UI层 */}
      <div className="absolute inset-0 z-20 pointer-events-none">
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
