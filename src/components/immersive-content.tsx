"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

export interface ImmersiveContentConfig {
  /** 内容类型 */
  type: 'image' | 'video' | 'image+music' | 'video+music';
  
  /** 图片URL */
  imageUrl?: string;
  
  /** 视频URL */
  videoUrl?: string;
  
  /** 音频URL */
  audioUrl?: string;
  
  /** 标题 */
  title?: string;
  
  /** 描述 */
  description?: string;
  
  /** 是否自动播放音频 */
  autoPlay?: boolean;
  
  /** 是否循环播放 */
  loop?: boolean;
  
  /** 是否静音 */
  muted?: boolean;
  
  /** 音量 (0-1) */
  volume?: number;
}

interface ImmersiveContentProps {
  config: ImmersiveContentConfig;
  className?: string;
}

export function ImmersiveContent({ config, className = "" }: ImmersiveContentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(config.muted || false);
  const [volume, setVolume] = useState(config.volume || 0.7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 音频控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      
      if (config.autoPlay && !isMuted) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [volume, isMuted, config.autoPlay]);

  // 视频控制
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      
      if (config.autoPlay && !isMuted) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [volume, isMuted, config.autoPlay]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("内容加载失败");
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg">{error}</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            🎵
          </motion.div>
          <p className="text-lg">正在加载内容...</p>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {/* 图片内容 */}
        {(config.type === 'image' || config.type === 'image+music') && config.imageUrl && (
          <Image
            ref={imageRef}
            src={config.imageUrl}
            alt={config.title || "沉浸式内容"}
            width={800}
            height={600}
            className="w-full h-full object-cover"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}

        {/* 视频内容 */}
        {(config.type === 'video' || config.type === 'video+music') && config.videoUrl && (
          <video
            ref={videoRef}
            src={config.videoUrl}
            className="w-full h-full object-cover"
            loop={config.loop}
            muted={isMuted}
            onLoadedData={handleLoad}
            onError={handleError}
            playsInline
          />
        )}

        {/* 音频内容（背景音乐） */}
        {(config.type === 'image+music' || config.type === 'video+music') && config.audioUrl && (
          <audio
            ref={audioRef}
            src={config.audioUrl}
            loop={config.loop}
            muted={isMuted}
            onLoadedData={handleLoad}
            onError={handleError}
            preload="auto"
          />
        )}

        {/* 内容信息覆盖层 */}
        {(config.title || config.description) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {config.title && (
                <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
              )}
              {config.description && (
                <p className="text-lg opacity-90">{config.description}</p>
              )}
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* 播放/暂停按钮 */}
          {(config.type.includes('music') || config.type === 'video' || config.type === 'video+music') && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </motion.button>
          )}

          {/* 音量控制 */}
          {(config.type.includes('music') || config.type === 'video' || config.type === 'video+music') && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </motion.button>
          )}

          {/* 全屏按钮 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <Maximize2 size={20} />
          </motion.button>
        </div>

        {/* 音量滑块 */}
        {!isMuted && (config.type.includes('music') || config.type === 'video' || config.type === 'video+music') && (
          <div className="absolute top-4 right-20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #fff 0%, #fff ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <AnimatePresence>
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}
