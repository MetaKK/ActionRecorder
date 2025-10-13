/**
 * 音频播放组件
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base64ToBlob, formatDuration } from '@/lib/utils/audio';

interface AudioPlayerProps {
  audioData: string;  // 可以是 Base64 或 URL
  duration?: number;
  compact?: boolean;
}

export function AudioPlayer({ audioData, duration = 0, compact = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 判断是 Base64 还是 URL
    let url: string;
    let needsCleanup = false;
    
    if (audioData.startsWith('data:') || audioData.startsWith('blob:')) {
      // 如果是 Base64 或 Blob URL，直接使用
      url = audioData;
    } else {
      // 否则假定是 Base64，转换为 Blob URL
      const blob = base64ToBlob(audioData);
      url = URL.createObjectURL(blob);
      needsCleanup = true;
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;

    // 监听音频加载
    audio.onloadedmetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setActualDuration(audio.duration);
      }
    };

    // 监听播放进度
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // 播放结束
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // 清理
    return () => {
      audio.pause();
      if (needsCleanup) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioData]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!audioRef.current || actualDuration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * actualDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className={`flex items-center gap-3 ${
      compact 
        ? 'p-2 rounded-lg bg-muted/20 border border-border/20' 
        : 'p-3 rounded-xl bg-muted/30 border border-border/30'
    }`}>
      <Button
        size="icon"
        variant="ghost"
        className={`${compact ? 'h-7 w-7' : 'h-9 w-9'} rounded-full flex-shrink-0 hover:bg-primary/10 hover:text-primary`}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        ) : (
          <Play className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ml-0.5`} />
        )}
      </Button>

      <Volume2 className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div 
          className={`${compact ? 'h-1' : 'h-1.5'} bg-muted rounded-full overflow-hidden cursor-pointer group`}
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary transition-all group-hover:bg-primary/80"
            style={{ width: actualDuration > 0 ? `${(currentTime / actualDuration) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground font-mono flex-shrink-0 tabular-nums`}>
        {formatDuration(currentTime)} / {formatDuration(actualDuration)}
      </span>
    </div>
  );
}

