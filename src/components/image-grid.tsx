/**
 * 媒体网格预览组件（图片 + 视频）
 * 性能优化：使用懒加载图片组件
 */

'use client';

import { useState, useMemo } from 'react';
import { X, Image as ImageIcon, Video, Play } from 'lucide-react';
import { MediaData } from '@/lib/types';
import { ImageLightbox } from '@/components/image-lightbox';
import { LazyImage, LazyVideoThumbnail } from '@/components/lazy-image';
import { cn } from '@/lib/utils';

interface ImageGridProps {
  images: MediaData[];
  onRemove?: (id: string) => void;
  readonly?: boolean;
  className?: string;
}

export function ImageGrid({ images, onRemove, readonly = false, className }: ImageGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 统计图片和视频数量
  const stats = useMemo(() => {
    const imageCount = images.filter(m => m.type === 'image').length;
    const videoCount = images.filter(m => m.type === 'video').length;
    return { imageCount, videoCount };
  }, [images]);

  if (images.length === 0) return null;

  // 打开灯箱预览
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className={cn("w-full", className)}>
        <div className={cn(
          "grid gap-2",
          images.length === 1 && "grid-cols-1",
          images.length === 2 && "grid-cols-2",
          images.length >= 3 && "grid-cols-3"
        )}>
          {images.map((media, index) => {
            const isVideo = media.type === 'video';
            
            return (
              <div
                key={media.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg bg-muted/30",
                  "animate-in fade-in zoom-in duration-300",
                  "cursor-pointer",
                  images.length === 1 && "aspect-[4/3]",
                  images.length >= 2 && "aspect-square"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => openLightbox(index)}
              >
                {/* 缩略图（图片或视频）- 懒加载 */}
                {isVideo ? (
                  <LazyVideoThumbnail
                    thumbnail={media.thumbnail}
                    src={media.data}
                    alt={`视频 ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <LazyImage
                    src={media.data}
                    alt={`图片 ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {/* 视频播放图标 */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-black/80">
                      <Play className="h-6 w-6 text-white" fill="white" />
                    </div>
                  </div>
                )}

                {/* 删除按钮 - Apple 风格 */}
                {!readonly && onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(media.id);
                    }}
                    className={cn(
                      "absolute right-1.5 top-1.5 z-10",
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      // Apple 风格：灰色毛玻璃背景
                      "bg-white/80 dark:bg-black/60",
                      "backdrop-blur-md",
                      "border border-black/10 dark:border-white/20",
                      // 文字颜色：灰色，hover 时变红
                      "text-gray-600 dark:text-gray-300",
                      "shadow-sm",
                      "transition-all duration-200 ease-out",
                      // 桌面端：hover 显示，移动端：始终显示
                      "opacity-80 md:opacity-0 md:group-hover:opacity-100",
                      // Hover 效果：变红 + 放大
                      "hover:text-red-500 hover:bg-white dark:hover:bg-black/80",
                      "hover:scale-110 hover:shadow-md",
                      "active:scale-90"
                    )}
                    aria-label={`删除${isVideo ? '视频' : '图片'}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                )}

                {/* 媒体信息 + 点击提示 */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0",
                  "bg-gradient-to-t from-black/60 to-transparent",
                  "p-2 opacity-0 transition-opacity duration-200",
                  "group-hover:opacity-100"
                )}>
                  <div className="flex items-center justify-between text-xs text-white/90">
                    <div className="flex items-center gap-1.5">
                      {isVideo ? (
                        <>
                          <Video className="h-3 w-3" />
                          <span>{Math.floor(media.duration || 0)}s</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-3 w-3" />
                          <span>{media.width} × {media.height}</span>
                        </>
                      )}
                    </div>
                    <span className="text-white/70">点击{isVideo ? '播放' : '预览'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 媒体计数 */}
        {images.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/70">
            {stats.imageCount > 0 && (
              <>
                <ImageIcon className="h-3 w-3" />
                <span>{stats.imageCount} 张图片</span>
              </>
            )}
            {stats.imageCount > 0 && stats.videoCount > 0 && (
              <span>•</span>
            )}
            {stats.videoCount > 0 && (
              <>
                <Video className="h-3 w-3" />
                <span>{stats.videoCount} 个视频</span>
              </>
            )}
            {readonly && <span className="text-muted-foreground/50">• 点击{stats.videoCount > 0 ? '播放' : '查看'}</span>}
          </div>
        )}
      </div>

      {/* 媒体灯箱（支持图片和视频） */}
      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

