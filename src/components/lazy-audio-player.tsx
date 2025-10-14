/**
 * 懒加载音频播放器组件
 * 使用 Intersection Observer 延迟加载音频数据
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface LazyAudioPlayerProps {
  audioData: string;
  duration?: number;
  format?: string;
  className?: string;
}

export function LazyAudioPlayer({
  audioData,
  duration = 0,
  format = 'audio/webm',
  className,
}: LazyAudioPlayerProps) {
  const [elementRef, isVisible] = useIntersectionObserver({
    rootMargin: '100px', // 提前 100px 开始准备
    freezeOnceVisible: false, // 音频需要持续观察（暂停/播放）
  });

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 当元素可见时，加载音频数据
  useEffect(() => {
    if (isVisible && !audioSrc) {
      // 延迟加载音频 URL
      setAudioSrc(audioData);
    }
  }, [isVisible, audioData, audioSrc]);

  // 监听音频事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      // 确保 duration 是有效的数字
      const validDuration = audio.duration && isFinite(audio.duration) ? audio.duration : duration;
      setAudioDuration(validDuration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      // 确保 currentTime 是有效的数字
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error('音频加载失败');
      setIsLoaded(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc, duration]);

  // 播放/暂停
  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('音频播放失败:', error);
    }
  };

  // 切换静音
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar || !audioSrc || !audioDuration || !isFinite(audioDuration)) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * audioDuration;

    // 确保新时间是有效的
    if (isFinite(newTime) && newTime >= 0 && newTime <= audioDuration) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    // 处理无效值（NaN、Infinity、undefined、null）
    if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    
    // 确保是非负数
    const validSeconds = Math.max(0, seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = Math.floor(validSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度，确保结果是有效的数字
  const progress = (audioDuration > 0 && isFinite(audioDuration) && isFinite(currentTime)) 
    ? Math.min(100, Math.max(0, (currentTime / audioDuration) * 100))
    : 0;

  return (
    <div
      ref={elementRef}
      className={cn(
        "group flex items-center gap-3 rounded-xl",
        "bg-gradient-to-br from-sky-50/50 via-blue-50/30 to-cyan-50/40",
        "dark:from-sky-950/20 dark:via-blue-950/15 dark:to-cyan-950/20",
        "border border-sky-200/40 dark:border-sky-800/30",
        "p-3.5 backdrop-blur-md",
        "transition-all duration-300 ease-out",
        "hover:border-sky-300/60 dark:hover:border-sky-700/50",
        "hover:shadow-lg hover:shadow-sky-500/10",
        "hover:scale-[1.01]",
        className
      )}
    >
      {/* 隐藏的音频元素 */}
      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="metadata" />
      )}

      {/* 播放/暂停按钮 - Apple 风格 */}
      <button
        onClick={togglePlay}
        disabled={!audioSrc || !isLoaded}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-full",
          "bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500",
          "text-white shadow-lg shadow-sky-500/30",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-sky-500/40",
          "active:scale-95",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
          !audioSrc && "animate-pulse"
        )}
        aria-label={isPlaying ? "暂停" : "播放"}
      >
        {/* 按钮光晕效果 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/20 to-transparent" />
        
        {!audioSrc || !isLoaded ? (
          <Volume2 className="relative z-10 h-5 w-5" strokeWidth={2.5} />
        ) : isPlaying ? (
          <Pause className="relative z-10 h-5 w-5" fill="currentColor" strokeWidth={0} />
        ) : (
          <Play className="relative z-10 h-5 w-5 ml-0.5" fill="currentColor" strokeWidth={0} />
        )}
      </button>

      {/* 进度条和时间 - Apple 风格 */}
      <div className="flex-1 space-y-2">
        {/* 进度条容器 */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className={cn(
            "group/progress relative h-1.5 cursor-pointer rounded-full overflow-hidden",
            "bg-gradient-to-r from-sky-200/40 via-blue-200/40 to-cyan-200/40",
            "dark:from-sky-800/30 dark:via-blue-800/30 dark:to-cyan-800/30",
            "transition-all duration-200",
            "hover:h-2",
            !audioSrc && "animate-pulse"
          )}
        >
          {/* 进度条填充 - 渐变科技感 */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500",
              "transition-all duration-150 ease-out",
              "shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            )}
            style={{ width: `${progress}%` }}
          >
            {/* 进度条高光 */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
          </div>
          
          {/* 进度指示点 - Apple 风格 */}
          {audioSrc && progress > 0 && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full",
                "bg-white shadow-lg shadow-sky-500/50",
                "border-2 border-sky-400",
                "transition-all duration-200",
                "opacity-0 group-hover/progress:opacity-100",
                "scale-0 group-hover/progress:scale-100",
                isPlaying && "opacity-100 scale-100"
              )}
              style={{ left: `calc(${progress}% - 7px)` }}
            >
              {/* 指示点内部光晕 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 opacity-60" />
            </div>
          )}
        </div>

        {/* 时间显示 - Apple 风格 */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium tabular-nums text-sky-600 dark:text-sky-400">
            {audioSrc ? formatTime(currentTime) : '--:--'}
          </span>
          <span className="tabular-nums text-muted-foreground/70">
            {audioSrc ? formatTime(audioDuration) : formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 音量按钮 - Apple 风格 */}
      <button
        onClick={toggleMute}
        disabled={!audioSrc}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          "text-sky-600 dark:text-sky-400",
          "bg-sky-100/50 dark:bg-sky-900/20",
          "border border-sky-200/40 dark:border-sky-800/30",
          "transition-all duration-300 ease-out",
          "hover:bg-sky-200/60 dark:hover:bg-sky-800/30",
          "hover:border-sky-300/60 dark:hover:border-sky-700/50",
          "hover:scale-110",
          "active:scale-95",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
        aria-label={isMuted ? "取消静音" : "静音"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Volume2 className="h-4 w-4" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

