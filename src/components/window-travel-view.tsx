"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
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

export function WindowTravelView({
  videos,
  windowFrames,
  autoPlay = true,
  loop = true,
  className = "",
}: WindowTravelViewProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentWindowIndex, setCurrentWindowIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // 默认静音，用户点击后取消静音
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [showStartScreen, setShowStartScreen] = useState(true); // 显示启动页面
  const [showTitle, setShowTitle] = useState(true); // 控制标题显示
  const [isTransitioning, setIsTransitioning] = useState(false); // 切换状态
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  
  const videoOpacity = useTransform(y, [-100, 0, 100], [0.3, 1, 0.3]);
  const windowOpacity = useTransform(x, [-100, 0, 100], [0.3, 1, 0.3]);

  const currentVideo = videos[currentVideoIndex];
  const currentWindow = windowFrames[currentWindowIndex];
  const nextVideoIndex = (currentVideoIndex + 1) % videos.length;
  // const prevVideoIndex = (currentVideoIndex - 1 + videos.length) % videos.length;

  // 视频加载完成
  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 视频可以播放时也设置为加载完成
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 预加载下一个视频
  useEffect(() => {
    if (nextVideoRef.current && videos[nextVideoIndex]) {
      nextVideoRef.current.src = videos[nextVideoIndex].videoUrl;
      nextVideoRef.current.load();
    }
  }, [nextVideoIndex, videos]);

  // 初始化视频
  useEffect(() => {
    if (videoRef.current && !showStartScreen) {
      videoRef.current.muted = isMuted;
      if (autoPlay) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [currentVideoIndex, isMuted, autoPlay, showStartScreen]);

  // 标题自动隐藏效果 - 每次切换视频时重新显示，2秒后消失
  useEffect(() => {
    setShowTitle(true);
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [currentVideoIndex]);

  // 手势处理 - 移动端优化
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // 移动端优化的方向判断
      const absX = Math.abs(offset.x);
      const absY = Math.abs(offset.y);
      const totalDistance = Math.sqrt(absX * absX + absY * absY);
      
      // TikTok风格极致优化阈值
      const mobileThreshold = 15; // 极低滑动距离阈值 - 轻轻一划就能触发
      const mobileVelocityThreshold = 50; // 极低速度阈值 - 慢速滑动也能触发
      
      // 如果移动距离太小，忽略
      if (totalDistance < 8) return;
      
      // TikTok风格方向判断 - 更宽松的条件
      const isVerticalSwipe = absY > absX * 0.8; // 更宽松的垂直滑动判断
      const isHorizontalSwipe = absX > absY * 0.8 && absX > 15; // 水平滑动需要更明显的距离

      // 垂直滑动 - 切换视频
      if (isVerticalSwipe) {
        if (offset.y < -mobileThreshold || velocity.y < -mobileVelocityThreshold) {
          // 向上滑 - 下一个视频
          setDirection('up');
          setIsTransitioning(true);
          setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
        } else if (offset.y > mobileThreshold || velocity.y > mobileVelocityThreshold) {
          // 向下滑 - 上一个视频
          setDirection('down');
          setIsTransitioning(true);
          setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
        }
      }
      // 水平滑动 - 切换窗口
      else if (isHorizontalSwipe) {
        if (offset.x < -mobileThreshold || velocity.x < -mobileVelocityThreshold) {
          // 向左滑 - 下一个窗口
          setDirection('left');
          setIsTransitioning(true);
          setCurrentWindowIndex((prev) => (prev + 1) % windowFrames.length);
        } else if (offset.x > mobileThreshold || velocity.x > mobileVelocityThreshold) {
          // 向右滑 - 上一个窗口
          setDirection('right');
          setIsTransitioning(true);
          setCurrentWindowIndex((prev) => (prev - 1 + windowFrames.length) % windowFrames.length);
        }
      }

      // 重置
      setTimeout(() => {
        setDirection(null);
        setIsTransitioning(false);
        y.set(0);
        x.set(0);
      }, 500);
    },
    [videos.length, windowFrames.length, y, x]
  );

  // const toggleMute = () => {
  //   setIsMuted(!isMuted);
  //   if (videoRef.current) {
  //     videoRef.current.muted = !isMuted;
  //   }
  // };

  // 开始体验 - 关闭启动页面并播放视频
  const handleStartExperience = useCallback(() => {
    setShowStartScreen(false);
    
    // 等待一小段时间确保视频元素已准备好
    setTimeout(() => {
      if (videoRef.current) {
        // 设置音量为最大
        videoRef.current.volume = 1.0;
        videoRef.current.muted = isMuted;
        
        // 先加载视频
        videoRef.current.load();
        
        // 等待加载完成后播放
        videoRef.current.addEventListener('loadeddata', () => {
          setIsLoading(false);
          if (videoRef.current) {
            // 智能播放策略：根据用户设置决定是否静音
            videoRef.current.muted = isMuted;
            videoRef.current.volume = 1.0;
            
            videoRef.current.play().catch((error) => {
              console.warn('播放失败，尝试静音播放:', error);
              // 如果播放失败，静音后重试
              if (videoRef.current) {
                videoRef.current.muted = true;
                setIsMuted(true);
                videoRef.current.play().catch(console.error);
              }
            });
          }
        }, { once: true });
      }
    }, 100);
  }, [isMuted]);

  // 切换静音状态
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // 获取切换动画变体 - 更流畅的切换效果
  const getVideoVariants = () => {
    if (!direction) return {};
    
    return {
      initial: direction === 'up' ? { y: '100%', opacity: 0.8 } : { y: '-100%', opacity: 0.8 },
      animate: { y: 0, opacity: 1 },
      exit: direction === 'up' ? { y: '-100%', opacity: 0.8 } : { y: '100%', opacity: 0.8 },
    };
  };

  const getWindowVariants = () => {
    if (!direction) return {};
    
    return {
      initial: direction === 'left' ? { 
        x: '100%', 
        opacity: 0.7,
        scale: 0.95,
        rotateY: 15
      } : { 
        x: '-100%', 
        opacity: 0.7,
        scale: 0.95,
        rotateY: -15
      },
      animate: { 
        x: 0, 
        opacity: 1,
        scale: 1,
        rotateY: 0
      },
      exit: direction === 'left' ? { 
        x: '-100%', 
        opacity: 0.7,
        scale: 0.95,
        rotateY: -15
      } : { 
        x: '100%', 
        opacity: 0.7,
        scale: 0.95,
        rotateY: 15
      },
    };
  };

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
              {/* 图标 */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-8xl"
              >
                ✈️
              </motion.div>

              {/* 标题 */}
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

              {/* 开始按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartExperience}
                className="mt-4 px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all"
              >
                开始体验
              </motion.button>

              {/* 提示 */}
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
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        dragPropagation={false}
        onDragEnd={handleDragEnd}
        style={{ y, opacity: videoOpacity }}
        className="absolute inset-0 z-0"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentVideo.id}
            {...getVideoVariants()}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 25,
              mass: 0.8
            }}
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
              onLoadedData={handleVideoLoad}
              onCanPlay={handleCanPlay}
              onError={() => setIsLoading(false)}
              onEnded={(event) => {
                // 确保视频循环播放
                const video = event.target as HTMLVideoElement;
                if (loop && video) {
                  video.currentTime = 0;
                  video.play().catch(console.error);
                }
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

      {/* 窗口框架层 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragPropagation={false}
        onDragEnd={handleDragEnd}
        style={{ x, opacity: windowOpacity }}
        className="absolute inset-0 z-10 pointer-events-none touch-none"
        onTouchStart={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        onTouchEnd={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentWindow.id}
            {...getWindowVariants()}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 20,
              mass: 1.2,
              duration: 0.6
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <Image
              src={currentWindow.imageUrl}
              alt={currentWindow.name || "窗口框架"}
              width={800}
              height={600}
              className="w-full h-full object-cover"
              style={{
                filter: isTransitioning ? "brightness(0.9) contrast(1.1)" : "brightness(1) contrast(1)",
                transition: "filter 0.3s ease-out",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden"
              }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 沉浸式UI层 - 仅显示标题 */}
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


        {/* 视频标题 - 左下角，2秒后自动消失 */}
        <AnimatePresence>
          {currentVideo.title && showTitle && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-6 left-6 pointer-events-none"
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

