/**
 * 图片网格预览组件
 */

'use client';

import { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { ImageData } from '@/lib/types';
import { ImageLightbox } from '@/components/image-lightbox';
import { cn } from '@/lib/utils';

interface ImageGridProps {
  images: ImageData[];
  onRemove?: (id: string) => void;
  readonly?: boolean;
  className?: string;
}

export function ImageGrid({ images, onRemove, readonly = false, className }: ImageGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
          {images.map((image, index) => (
            <div
              key={image.id}
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
              {/* 图片 */}
              <img
                src={image.data}
                alt={`图片 ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

            {/* 删除按钮 */}
            {!readonly && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(image.id);
                }}
                className={cn(
                  "absolute right-2 top-2 z-10",
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  "bg-black/60 backdrop-blur-sm",
                  "text-white transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-black/80 hover:scale-110",
                  "active:scale-95"
                )}
                aria-label="删除图片"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* 图片信息 + 点击提示 */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0",
              "bg-gradient-to-t from-black/60 to-transparent",
              "p-2 opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100"
            )}>
              <div className="flex items-center justify-between text-xs text-white/90">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" />
                  <span>{image.width} × {image.height}</span>
                </div>
                <span className="text-white/70">点击预览</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片计数 */}
      {images.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/70">
          <ImageIcon className="h-3 w-3" />
          <span>{images.length} 张图片</span>
          {readonly && <span className="text-muted-foreground/50">• 点击查看大图</span>}
        </div>
      )}
    </div>

      {/* 图片灯箱 */}
      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

