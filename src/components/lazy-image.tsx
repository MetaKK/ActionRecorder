/**
 * 懒加载图片组件
 * 使用 Intersection Observer 实现按需加载
 */

'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onClick?: () => void;
  loading?: 'eager' | 'lazy';
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  onClick,
  loading = 'lazy',
}: LazyImageProps) {
  const [elementRef, isVisible] = useIntersectionObserver({
    rootMargin: '50px', // 提前 50px 开始加载
    freezeOnceVisible: true,
  });
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // 当元素可见时，开始加载图片
  useEffect(() => {
    if (loading === 'eager' || isVisible) {
      setImageSrc(src);
    }
  }, [isVisible, src, loading]);

  // 处理图片加载完成
  const handleLoad = () => {
    setImageLoaded(true);
  };

  // 处理图片加载失败
  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "relative overflow-hidden bg-muted/30",
        className
      )}
      onClick={onClick}
    >
      {/* 占位符 - 显示直到图片加载完成 */}
      {!imageLoaded && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-gradient-to-br from-muted/40 to-muted/20",
            "animate-pulse",
            placeholderClassName
          )}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}

      {/* 实际图片 */}
      {imageSrc && !imageError && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* 错误状态 */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <span className="text-xs text-muted-foreground/60">加载失败</span>
        </div>
      )}
    </div>
  );
}

/**
 * 懒加载视频缩略图组件
 */
interface LazyVideoThumbnailProps {
  thumbnail?: string;
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function LazyVideoThumbnail({
  thumbnail,
  src,
  alt,
  className,
  onClick,
}: LazyVideoThumbnailProps) {
  // 如果有缩略图，使用懒加载图片
  if (thumbnail) {
    return (
      <LazyImage
        src={thumbnail}
        alt={alt}
        className={className}
        onClick={onClick}
      />
    );
  }

  // 否则显示视频图标占位符
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-muted/40 to-muted/20",
        "flex items-center justify-center",
        className
      )}
      onClick={onClick}
    >
      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
    </div>
  );
}

