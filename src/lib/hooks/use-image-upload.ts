/**
 * 媒体上传Hook（图片 + 视频）
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { MediaData } from '@/lib/types';
import { processMediaFiles, getMediaConfig } from '@/lib/utils/media';
import { toast } from 'sonner';

export function useImageUpload() {
  const [images, setImages] = useState<MediaData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = getMediaConfig();

  // 添加媒体文件（图片 + 视频）
  const addImages = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // 限制最多9个文件
    const maxFiles = config.maxFiles;
    if (images.length >= maxFiles) {
      toast.error(`最多上传${maxFiles}个文件`);
      return;
    }

    const remainingSlots = maxFiles - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.warning(`已达到上传上限，仅处理前${remainingSlots}个文件`);
    }

    setIsUploading(true);

    try {
      const newMedia = await processMediaFiles(filesToProcess);
      
      if (newMedia.length === 0) {
        toast.error('没有可用的媒体文件');
        return;
      }
      
      setImages(prev => [...prev, ...newMedia]);
      
      // 统计图片和视频数量
      const imageCount = newMedia.filter(m => m.type === 'image').length;
      const videoCount = newMedia.filter(m => m.type === 'video').length;
      
      const parts: string[] = [];
      if (imageCount > 0) parts.push(`${imageCount}张图片`);
      if (videoCount > 0) parts.push(`${videoCount}个视频`);
      
      toast.success(`成功添加${parts.join('和')}`);
      
      // 打印详细信息
      newMedia.forEach((media, index) => {
        const sizeKB = (media.size / 1024).toFixed(1);
        const sizeMB = (media.size / 1024 / 1024).toFixed(2);
        const size = media.size > 1024 * 1024 ? `${sizeMB}MB` : `${sizeKB}KB`;
        
        if (media.type === 'image') {
          console.log(`📸 图片${index + 1}: ${media.width}x${media.height}, ${size}`);
        } else {
          console.log(`🎬 视频${index + 1}: ${media.width}x${media.height}, ${size}, ${media.duration?.toFixed(1)}s`);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '媒体处理失败';
      toast.error(message);
      console.error('媒体处理失败:', error);
    } finally {
      setIsUploading(false);
    }
  }, [images.length, config.maxFiles]);

  // 删除媒体
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('已删除');
  }, []);

  // 清空所有媒体
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await addImages(files);
    
    // 清空input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addImages]);

  // 处理拖拽上传（支持图片和视频）
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    await addImages(files);
  }, [addImages]);

  // 处理粘贴上传（仅支持图片，浏览器限制）
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData.items);
    const mediaFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) mediaFiles.push(file);
      }
    }

    if (mediaFiles.length > 0) {
      event.preventDefault();
      await addImages(mediaFiles);
    }
  }, [addImages]);

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    images,
    isUploading,
    fileInputRef,
    addImages,
    removeImage,
    clearImages,
    handleFileSelect,
    handleDrop,
    handlePaste,
    triggerFileSelect,
  };
}

