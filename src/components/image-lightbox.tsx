/**
 * 媒体灯箱预览组件 - Apple 风格（支持图片 + 视频）
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Video as VideoIcon } from 'lucide-react';
import { MediaData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  images: MediaData[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const currentMedia = images[currentIndex];
  const totalImages = images.length;
  const isVideo = currentMedia?.type === 'video';

  // 重置索引当打开时
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // 上一张
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
    setIsZoomed(false);
  }, [totalImages]);

  // 下一张
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  }, [totalImages]);

  // 键盘事件
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < totalImages - 1) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // 防止body滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const lightboxContent = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-black/95 backdrop-blur-md",
        "animate-in fade-in duration-300"
      )}
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className={cn(
          "absolute right-4 top-4 z-10",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-white/10 backdrop-blur-md",
          "text-white transition-all duration-200",
          "hover:bg-white/20 hover:scale-110",
          "active:scale-95"
        )}
        aria-label="关闭"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 图片计数器 */}
      {totalImages > 1 && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <div className="rounded-full bg-white/10 backdrop-blur-md px-4 py-2">
            <span className="text-sm font-medium text-white">
              {currentIndex + 1} / {totalImages}
            </span>
          </div>
        </div>
      )}

      {/* 媒体信息 */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2">
          {isVideo && <VideoIcon className="h-3 w-3 text-white/80" />}
          <span className="text-xs text-white/80">
            {currentMedia.width} × {currentMedia.height}
            {isVideo && currentMedia.duration && ` • ${Math.floor(currentMedia.duration)}s`}
          </span>
        </div>
      </div>

      {/* 左箭头 */}
      {totalImages > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className={cn(
            "absolute left-4 top-1/2 z-10 -translate-y-1/2",
            "flex h-12 w-12 items-center justify-center rounded-full",
            "bg-white/10 backdrop-blur-md",
            "text-white transition-all duration-200",
            "hover:bg-white/20 hover:scale-110",
            "active:scale-95",
            "md:left-8"
          )}
          aria-label="上一张"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* 右箭头 */}
      {totalImages > 1 && currentIndex < totalImages - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className={cn(
            "absolute right-4 top-1/2 z-10 -translate-y-1/2",
            "flex h-12 w-12 items-center justify-center rounded-full",
            "bg-white/10 backdrop-blur-md",
            "text-white transition-all duration-200",
            "hover:bg-white/20 hover:scale-110",
            "active:scale-95",
            "md:right-8"
          )}
          aria-label="下一张"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 缩放按钮（仅图片） */}
      {!isVideo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
          className={cn(
            "absolute right-4 bottom-4 z-10",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-white/10 backdrop-blur-md",
            "text-white transition-all duration-200",
            "hover:bg-white/20 hover:scale-110",
            "active:scale-95"
          )}
          aria-label={isZoomed ? "缩小" : "放大"}
        >
          {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>
      )}

      {/* 媒体容器（图片或视频） */}
      <div
        className="relative flex h-full w-full items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isVideo ? (
          /* 视频播放器 */
          <video
            src={currentMedia.data}
            controls
            autoPlay
            className={cn(
              "max-h-full max-w-full",
              "rounded-lg shadow-2xl",
              "animate-in zoom-in-95 fade-in duration-300"
            )}
            style={{
              maxHeight: 'calc(100vh - 8rem)',
            }}
          >
            您的浏览器不支持视频播放
          </video>
        ) : (
          /* 图片显示 */
          <img
            src={currentMedia.data}
            alt={`图片 ${currentIndex + 1}`}
            className={cn(
              "max-h-full max-w-full object-contain",
              "transition-all duration-500 ease-out",
              "animate-in zoom-in-95 fade-in duration-300",
              isZoomed && "scale-150 cursor-move"
            )}
            draggable={false}
            style={{
              transformOrigin: 'center',
            }}
          />
        )}
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body
  if (typeof window === 'undefined') return null;
  return createPortal(lightboxContent, document.body);
}

