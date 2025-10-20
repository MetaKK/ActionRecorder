"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo, useMotionValue } from "framer-motion";
import { Loader2, Volume2, VolumeX } from "lucide-react";

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
  private loadingPromises = new Map<string, Promise<HTMLVideoElement>>();
  private maxSize = 5; // 增加缓存大小，移动端需要更多缓存

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

  // 移动端极致优化的视频预加载
  preloadVideo(url: string): Promise<HTMLVideoElement> {
    // 如果正在加载，返回现有的Promise
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = new Promise<HTMLVideoElement>((resolve, reject) => {
      const cached = this.getVideo(url);
      if (cached && cached.readyState >= 3) {
        resolve(cached);
        return;
      }

      const video = document.createElement('video');
      
      // 移动端极致优化属性
      video.src = url;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('x-webkit-airplay', 'allow');
      video.loop = true; // 预加载时就设置循环
      
      // 移动端循环播放强化处理
      const handleEnded = () => {
        video.currentTime = 0;
        video.play().catch(console.error);
      };
      video.addEventListener('ended', handleEnded);
      
      // 多重加载事件监听 - 确保加载完成
      const handleLoad = () => {
        this.setVideo(url, video);
        this.loadingPromises.delete(url);
        resolve(video);
      };
      
      video.addEventListener('loadeddata', handleLoad, { once: true });
      video.addEventListener('canplay', handleLoad, { once: true });
      video.addEventListener('canplaythrough', handleLoad, { once: true });
      
      video.addEventListener('error', (e) => {
        console.error('视频预加载失败:', url, e);
        this.loadingPromises.delete(url);
        reject(e);
      }, { once: true });
      
      video.load();
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  // 批量预加载 - 移动端优化
  async preloadMultipleVideos(urls: string[]): Promise<HTMLVideoElement[]> {
    const promises = urls.map(url => this.preloadVideo(url));
    return Promise.all(promises);
  }

  clear(): void {
    this.cache.forEach(video => {
      video.pause();
      video.src = '';
    });
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// 手势管理器 - TikTok风格极致优化版本
class GestureManager {
  private isDragging = false;
  private startTime = 0;
  private startPosition = { x: 0, y: 0 };
  private velocity = { x: 0, y: 0 };
  private lastMoveTime = 0;
  private touchStartY = 0;
  private touchStartX = 0;
  private hasTriggered = false; // 防止重复触发
  
  // TikTok风格极致优化阈值设置
  private readonly SWIPE_THRESHOLD = 15; // 极低滑动距离阈值 - 轻轻一划就能触发
  private readonly VELOCITY_THRESHOLD = 50; // 极低速度阈值 - 慢速滑动也能触发
  private readonly SWIPE_TIMEOUT = 200; // 缩短超时时间，更快响应
  private readonly MIN_DRAG_DISTANCE = 8; // 极低最小拖拽距离
  private readonly DIRECTION_RATIO = 0.8; // 更宽松的方向判断，更容易识别垂直滑动
  private readonly INSTANT_SWIPE_THRESHOLD = 25; // 即时切换阈值

  handleDragStart(event: MouseEvent | TouchEvent | PointerEvent): void {
    this.isDragging = true;
    this.startTime = Date.now();
    this.hasTriggered = false; // 重置触发状态
    
    // 记录触摸起始位置
    if (event.type === 'touchstart' && 'touches' in event) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    }
  }

  handleDragMove(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    if (!this.isDragging || this.hasTriggered) return;
    
    this.lastMoveTime = Date.now();
    this.velocity = {
      x: info.velocity.x,
      y: info.velocity.y
    };

    // TikTok风格即时检测 - 滑动过程中就触发切换
    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    // 即时切换检测 - 达到阈值立即触发
    if (absY > this.INSTANT_SWIPE_THRESHOLD && absY > absX * this.DIRECTION_RATIO) {
      this.hasTriggered = true;
      if (this.triggerSwipe) {
        if (offset.y < 0) {
          // 向上滑动 - 下一个视频
          this.triggerSwipe('up');
        } else {
          // 向下滑动 - 上一个视频
          this.triggerSwipe('down');
        }
      }
    }
  }

  // 触发滑动的回调函数
  private triggerSwipe: ((direction: 'up' | 'down' | 'left' | 'right') => void) | null = null;

  setSwipeCallback(callback: (direction: 'up' | 'down' | 'left' | 'right') => void) {
    this.triggerSwipe = callback;
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

    // 如果已经触发过即时切换，不再处理
    if (this.hasTriggered) return;

    // TikTok风格防抖：极短防抖时间
    if (duration < 30) return;

    // 计算实际移动距离
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    const totalDistance = Math.sqrt(absX * absX + absY * absY);
    
    // 极低距离阈值 - 轻轻一划就能触发
    if (totalDistance < this.MIN_DRAG_DISTANCE) return;

    // TikTok风格方向判断 - 更宽松的条件
    const isVerticalSwipe = absY > absX * this.DIRECTION_RATIO;
    const isHorizontalSwipe = absX > absY * this.DIRECTION_RATIO && absX > 15;

    // 垂直滑动 - 切换视频（优先处理，极低阈值）
    if (isVerticalSwipe) {
      if (offset.y < -this.SWIPE_THRESHOLD || velocity.y < -this.VELOCITY_THRESHOLD) {
        onSwipe('up');
      } else if (offset.y > this.SWIPE_THRESHOLD || velocity.y > this.VELOCITY_THRESHOLD) {
        onSwipe('down');
      }
    } 
    // 水平滑动 - 切换窗口（次要处理）
    else if (isHorizontalSwipe) {
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
  const [isMuted, setIsMuted] = useState(true); // 默认静音，用户点击后取消静音
  const [isTransitioning, setIsTransitioning] = useState(false); // 切换状态
  const [gestureDirection, setGestureDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null); // 手势方向提示
  const [dragProgress, setDragProgress] = useState(0); // 拖拽进度
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoCacheRef = useRef(new VideoCache());
  const gestureManagerRef = useRef(new GestureManager());
  
  // Motion values
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  
  // 计算属性 - 性能优化
  const currentVideo = useMemo(() => videos[currentVideoIndex], [videos, currentVideoIndex]);
  const currentWindow = useMemo(() => windowFrames[currentWindowIndex], [windowFrames, currentWindowIndex]);
  
  // 预计算下一个和上一个索引
  const nextVideoIndex = useMemo(() => (currentVideoIndex + 1) % videos.length, [currentVideoIndex, videos.length]);
  const prevVideoIndex = useMemo(() => (currentVideoIndex - 1 + videos.length) % videos.length, [currentVideoIndex, videos.length]);
  const nextWindowIndex = useMemo(() => (currentWindowIndex + 1) % windowFrames.length, [currentWindowIndex, windowFrames.length]);
  const prevWindowIndex = useMemo(() => (currentWindowIndex - 1 + windowFrames.length) % windowFrames.length, [currentWindowIndex, windowFrames.length]);
  
  // 预加载视频 - 移动端极致优化版本
  const preloadVideos = useCallback(async () => {
    if (!videos.length) return;
    
    try {
      // 激进的预加载策略：预加载所有视频
      const allUrls = videos.map(v => v.videoUrl).filter(Boolean);
      console.log('开始激进预加载所有视频:', allUrls);
      
      // 批量预加载所有视频
      await videoCacheRef.current.preloadMultipleVideos(allUrls);
      console.log('所有视频预加载完成');
    } catch (error) {
      console.error('视频预加载失败:', error);
    }
  }, [videos]);

  // 智能预加载 - 根据用户行为预测
  const smartPreload = useCallback(async () => {
    if (!videos.length) return;
    
    try {
      // 预加载当前、下一个和上一个视频
      const currentUrl = videos[currentVideoIndex]?.videoUrl;
      const nextUrl = videos[nextVideoIndex]?.videoUrl;
      const prevUrl = videos[prevVideoIndex]?.videoUrl;
      
      const urlsToPreload = [currentUrl, nextUrl, prevUrl].filter(Boolean);
      console.log('智能预加载视频:', urlsToPreload);
      
      await videoCacheRef.current.preloadMultipleVideos(urlsToPreload);
      console.log('智能预加载完成');
    } catch (error) {
      console.error('智能预加载失败:', error);
    }
  }, [videos, currentVideoIndex, nextVideoIndex, prevVideoIndex]);

  // 初始化视频播放 - 移动端极致优化版本
  const initializeVideo = useCallback(async () => {
    if (!currentVideo?.videoUrl) return;
    
    setIsLoading(true);
    console.log('开始初始化视频:', currentVideo.videoUrl);
    
    try {
      const video = await videoCacheRef.current.preloadVideo(currentVideo.videoUrl);
      
      if (video) {
        // 移动端视频属性极致优化
        video.currentTime = 0;
        video.loop = loop;
        video.muted = isMuted;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('x-webkit-airplay', 'allow');
        
        // 移动端循环播放强化处理
        if (loop) {
          // 移除旧的事件监听器
          video.removeEventListener('ended', video._loopHandler);
          
          // 创建新的循环处理器
          video._loopHandler = () => {
            console.log('视频播放结束，重新开始循环');
            video.currentTime = 0;
            video.play().catch((error) => {
              console.error('循环播放失败:', error);
              // 如果播放失败，尝试重新加载
              video.load();
              video.play().catch(console.error);
            });
          };
          
          video.addEventListener('ended', video._loopHandler);
        }
        
        // 智能播放策略：移动端极致优化
        if (autoPlay) {
          try {
            console.log('尝试播放视频:', currentVideo.videoUrl);
            await video.play();
            console.log('视频播放成功');
          } catch (error) {
            console.warn('播放失败，尝试静音播放:', error);
            // 移动端通常需要静音才能自动播放
            try {
              video.muted = true;
              await video.play();
              console.log('静音播放成功');
            } catch (mutedError) {
              console.error('静音播放也失败:', mutedError);
              // 最后尝试：重新加载视频
              video.load();
              video.play().catch(console.error);
            }
          }
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('视频初始化失败:', error);
      setIsLoading(false);
    }
  }, [currentVideo, autoPlay, loop, isMuted]);

  // 切换视频
  const switchVideo = useCallback((direction: 'up' | 'down') => {
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
    }, 500);
  }, [videos.length]);

  // 切换窗口
  const switchWindow = useCallback((direction: 'left' | 'right') => {
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
    }, 500);
  }, [windowFrames.length]);

  // 手势处理 - 移动端优化
  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    gestureManagerRef.current.handleDragStart(event);
  }, []);

  const handleDragMove = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    gestureManagerRef.current.handleDragMove(event, info);
    
    // 计算拖拽进度和方向提示
    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    const totalDistance = Math.sqrt(absX * absX + absY * absY);
    
    // 更新拖拽进度 - 更敏感的进度显示
    setDragProgress(Math.min(totalDistance / 50, 1));
    
    // 设置手势方向提示 - 更宽松的条件
    if (absY > absX * 0.8) {
      setGestureDirection(offset.y < 0 ? 'up' : 'down');
    } else if (absX > absY * 0.8) {
      setGestureDirection(offset.x < 0 ? 'left' : 'right');
    } else {
      setGestureDirection(null);
    }
  }, []);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    gestureManagerRef.current.handleDragEnd(event, info, (direction) => {
      if (direction === 'up' || direction === 'down') {
        switchVideo(direction);
      } else if (direction === 'left' || direction === 'right') {
        switchWindow(direction);
      }
      
      // 重置位置和状态
      setTimeout(() => {
        y.set(0);
        x.set(0);
        setGestureDirection(null);
        setDragProgress(0);
      }, 300);
    });
  }, [switchVideo, switchWindow, y, x]);

  // 设置即时切换回调 - TikTok风格即时响应
  useEffect(() => {
    gestureManagerRef.current.setSwipeCallback((direction) => {
      if (direction === 'up' || direction === 'down') {
        switchVideo(direction);
      } else if (direction === 'left' || direction === 'right') {
        switchWindow(direction);
      }
    });
  }, [switchVideo, switchWindow]);

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
      case 'Escape':
        event.preventDefault();
        setShowStartScreen(true);
        break;
    }
  }, [switchVideo, switchWindow, toggleMute]);

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

  // 激进预加载 - 移动端极致优化
  useEffect(() => {
    // 立即开始激进预加载所有视频
    preloadVideos();
    
    // 延迟智能预加载，确保当前视频优先
    const timer = setTimeout(() => {
      smartPreload();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [preloadVideos, smartPreload]);

  // 视频切换时的智能预加载
  useEffect(() => {
    if (!showStartScreen) {
      smartPreload();
    }
  }, [currentVideoIndex, showStartScreen, smartPreload]);

  // 键盘事件监听
  useEffect(() => {
    if (!showStartScreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showStartScreen, handleKeyDown]);

  // 清理
  useEffect(() => {
    return () => {
      videoCacheRef.current.clear();
    };
  }, []);

  // 动画变体 - 极致流畅的切换效果
  const getVideoVariants = (direction: string) => ({
    initial: direction === 'up' ? { 
      y: '100%', 
      opacity: 0.8,
      scale: 0.95,
      filter: "blur(4px)"
    } : { 
      y: '-100%', 
      opacity: 0.8,
      scale: 0.95,
      filter: "blur(4px)"
    },
    animate: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      filter: "blur(0px)"
    },
    exit: direction === 'up' ? { 
      y: '-100%', 
      opacity: 0.8,
      scale: 0.95,
      filter: "blur(4px)"
    } : { 
      y: '100%', 
      opacity: 0.8,
      scale: 0.95,
      filter: "blur(4px)"
    },
    transition: { 
      type: "spring" as const, 
      stiffness: 180, 
      damping: 22,
      mass: 0.9,
      duration: 0.6
    }
  });

  const getWindowVariants = (direction: string) => ({
    initial: direction === 'left' ? { 
      x: '100%', 
      opacity: 0.6,
      scale: 0.9,
      rotateY: 20,
      filter: "blur(2px)"
    } : { 
      x: '-100%', 
      opacity: 0.6,
      scale: 0.9,
      rotateY: -20,
      filter: "blur(2px)"
    },
    animate: { 
      x: 0, 
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: "blur(0px)"
    },
    exit: direction === 'left' ? { 
      x: '-100%', 
      opacity: 0.6,
      scale: 0.9,
      rotateY: -20,
      filter: "blur(2px)"
    } : { 
      x: '100%', 
      opacity: 0.6,
      scale: 0.9,
      rotateY: 20,
      filter: "blur(2px)"
    },
    transition: { 
      type: "spring" as const, 
      stiffness: 140, 
      damping: 18,
      mass: 1.0,
      duration: 0.7
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
              {/* 自定义加载动画 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mb-6"
              />
              
              {/* 脉冲效果 */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-white text-lg font-light tracking-wide"
              >
                正在加载旅行视频...
              </motion.div>
              
              {/* 进度指示器 */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 视频层 */}
      <motion.div
        drag="y"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        dragPropagation={false}
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
              ref={(el) => {
                if (el) {
                  // 移动端极致优化：确保视频属性正确设置
                  el.loop = loop;
                  el.muted = isMuted;
                  el.playsInline = true;
                  el.setAttribute('webkit-playsinline', 'true');
                  el.setAttribute('playsinline', 'true');
                  el.setAttribute('x-webkit-airplay', 'allow');
                  
                  // 移动端循环播放强化处理
                  if (loop) {
                    // 移除旧的事件监听器
                    el.removeEventListener('ended', el._mobileLoopHandler);
                    
                    // 创建新的循环处理器
                    el._mobileLoopHandler = () => {
                      console.log('移动端视频播放结束，重新开始循环');
                      el.currentTime = 0;
                      el.play().catch((error) => {
                        console.error('移动端循环播放失败:', error);
                        // 如果播放失败，尝试重新加载
                        el.load();
                        el.play().catch(console.error);
                      });
                    };
                    
                    el.addEventListener('ended', el._mobileLoopHandler);
                  }
                }
              }}
              src={currentVideo.videoUrl}
              className="w-full h-full object-cover"
              loop={loop}
              muted={isMuted}
              playsInline
              preload="auto"
              autoPlay={autoPlay}
              webkit-playsinline="true"
              x-webkit-airplay="allow"
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
              onEnded={(event) => {
                // 移动端循环播放双重保障
                const video = event.target as HTMLVideoElement;
                if (loop && video) {
                  console.log('视频播放结束，双重保障重新开始循环');
                  video.currentTime = 0;
                  video.play().catch((error) => {
                    console.error('双重保障循环播放失败:', error);
                    // 如果播放失败，尝试重新加载
                    video.load();
                    video.play().catch(console.error);
                  });
                }
              }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 窗口框架层 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        dragPropagation={false}
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
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden"
            }}
          >
            <Image
              src={currentWindow.imageUrl}
              alt={currentWindow.name || "窗口框架"}
              width={800}
              height={600}
              className="w-full h-full object-cover"
              priority
              style={{
                filter: isTransitioning ? "brightness(0.9) contrast(1.1)" : "brightness(1) contrast(1)",
                transition: "filter 0.3s ease-out"
              }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* UI层 */}
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

        {/* 手势方向指示器 */}
        <AnimatePresence>
          {gestureDirection && dragProgress > 0.1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full"
              >
                <span className="text-2xl text-white">
                  {gestureDirection === 'up' && '↑'}
                  {gestureDirection === 'down' && '↓'}
                  {gestureDirection === 'left' && '←'}
                  {gestureDirection === 'right' && '→'}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 拖拽进度指示器 */}
        <AnimatePresence>
          {dragProgress > 0.1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2"
            >
              <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${dragProgress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>


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
