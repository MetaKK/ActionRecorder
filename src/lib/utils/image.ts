/**
 * 图片处理工具
 */

import { ImageData } from '@/lib/types';

// 图片配置
const IMAGE_CONFIG = {
  maxWidth: 1920,          // 最大宽度
  maxHeight: 1920,         // 最大高度
  quality: 0.85,           // 压缩质量
  maxSizeKB: 500,          // 单张图片最大500KB
};

/**
 * 压缩图片
 */
export async function compressImage(
  file: File,
  maxWidth = IMAGE_CONFIG.maxWidth,
  maxHeight = IMAGE_CONFIG.maxHeight,
  quality = IMAGE_CONFIG.quality
): Promise<{ data: string; width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算缩放比例
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // 创建Canvas进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Base64
        const data = canvas.toDataURL('image/jpeg', quality);
        const size = Math.round((data.length * 3) / 4); // 估算字节大小
        
        resolve({ data, width, height, size });
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '请选择图片文件' };
  }
  
  // 检查支持的格式
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: '不支持的图片格式' };
  }
  
  // 检查文件大小（限制10MB原始文件）
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `图片大小不能超过${maxSizeMB}MB` };
  }
  
  return { valid: true };
}

/**
 * 处理图片文件，返回ImageData
 */
export async function processImageFile(file: File): Promise<ImageData> {
  // 验证文件
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // 压缩图片
  const compressed = await compressImage(file);
  
  // 如果压缩后仍然太大，降低质量重新压缩
  if (compressed.size > IMAGE_CONFIG.maxSizeKB * 1024) {
    const newQuality = Math.max(0.5, IMAGE_CONFIG.quality - 0.2);
    const recompressed = await compressImage(file, IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, newQuality);
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: recompressed.data,
      width: recompressed.width,
      height: recompressed.height,
      size: recompressed.size,
      type: 'image/jpeg',
      createdAt: new Date(),
    };
  }
  
  return {
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    data: compressed.data,
    width: compressed.width,
    height: compressed.height,
    size: compressed.size,
    type: 'image/jpeg',
    createdAt: new Date(),
  };
}

/**
 * 批量处理图片文件
 */
export async function processImageFiles(files: File[]): Promise<ImageData[]> {
  const promises = files.map(file => processImageFile(file));
  return Promise.all(promises);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

