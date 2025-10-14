/**
 * 图片上传Hook
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { ImageData } from '@/lib/types';
import { processImageFile, processImageFiles } from '@/lib/utils/image';
import { toast } from 'sonner';

export function useImageUpload() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 添加图片
  const addImages = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // 限制最多9张图片
    const maxImages = 9;
    if (images.length >= maxImages) {
      toast.error(`最多上传${maxImages}张图片`);
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.warning(`已达到上传上限，仅处理前${remainingSlots}张图片`);
    }

    setIsUploading(true);

    try {
      const newImages = await processImageFiles(filesToProcess);
      setImages(prev => [...prev, ...newImages]);
      toast.success(`成功添加${newImages.length}张图片`);
      
      // 打印压缩信息
      newImages.forEach((img, index) => {
        const sizeKB = (img.size / 1024).toFixed(1);
        console.log(`📸 图片${index + 1}: ${img.width}x${img.height}, ${sizeKB}KB`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片处理失败';
      toast.error(message);
      console.error('图片处理失败:', error);
    } finally {
      setIsUploading(false);
    }
  }, [images.length]);

  // 删除图片
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('图片已删除');
  }, []);

  // 清空所有图片
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

  // 处理拖拽上传
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    await addImages(files);
  }, [addImages]);

  // 处理粘贴上传
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData.items);
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault();
      await addImages(imageFiles);
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

