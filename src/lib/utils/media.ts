/**
 * 媒体处理工具（图片 + 视频）
 */

import { MediaData, MediaType } from '../types';

/**
 * 媒体文件配置
 */
const MEDIA_CONFIG = {
  // 图片配置
  image: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    acceptTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  // 视频配置
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    acceptTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    thumbnailTime: 0.5, // 取第0.5秒作为缩略图
  },
  // 通用配置
  maxFiles: 9, // 最多9个文件
};

/**
 * 检测文件是图片还是视频
 */
function getMediaType(file: File): MediaType | null {
  if (MEDIA_CONFIG.image.acceptTypes.includes(file.type)) {
    return 'image';
  }
  if (MEDIA_CONFIG.video.acceptTypes.includes(file.type)) {
    return 'video';
  }
  return null;
}

/**
 * 验证媒体文件
 */
export function validateMediaFile(file: File): string | null {
  const mediaType = getMediaType(file);
  
  if (!mediaType) {
    return '不支持的文件类型，请上传图片（JPG/PNG/WebP/GIF）或视频（MP4/WebM/MOV）';
  }
  
  if (mediaType === 'image' && file.size > MEDIA_CONFIG.image.maxSize) {
    return `图片文件过大，请选择小于 ${MEDIA_CONFIG.image.maxSize / 1024 / 1024}MB 的图片`;
  }
  
  if (mediaType === 'video' && file.size > MEDIA_CONFIG.video.maxSize) {
    return `视频文件过大，请选择小于 ${MEDIA_CONFIG.video.maxSize / 1024 / 1024}MB 的视频`;
  }
  
  return null;
}

/**
 * 压缩图片
 */
function compressImage(
  file: File,
  maxWidth: number = MEDIA_CONFIG.image.maxWidth,
  maxHeight: number = MEDIA_CONFIG.image.maxHeight,
  quality: number = MEDIA_CONFIG.image.quality
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算缩放比例
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 生成视频缩略图
 */
function generateVideoThumbnail(file: File): Promise<{
  thumbnail: string;
  width: number;
  height: number;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      // 跳转到指定时间生成缩略图
      video.currentTime = Math.min(MEDIA_CONFIG.video.thumbnailTime, duration / 2);
    };
    
    video.onseeked = () => {
      try {
        // 创建 canvas 捕获当前帧
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 转换为 Base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        
        URL.revokeObjectURL(url);
        
        resolve({
          thumbnail,
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('视频加载失败'));
    };
    
    video.src = url;
  });
}

/**
 * Blob 转 Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * File 转 Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 处理图片文件
 */
async function processImage(file: File): Promise<MediaData> {
  try {
    // 压缩图片
    const compressedBlob = await compressImage(file);
    const base64 = await blobToBase64(compressedBlob);
    
    // 获取尺寸
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          data: base64,
          width: img.width,
          height: img.height,
          size: compressedBlob.size,
          mimeType: 'image/jpeg',
          createdAt: new Date(),
        });
      };
      img.onerror = () => reject(new Error('图片处理失败'));
      img.src = base64;
    });
  } catch (error) {
    throw new Error(`图片处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 处理视频文件
 */
async function processVideo(file: File): Promise<MediaData> {
  try {
    // 生成缩略图
    const { thumbnail, width, height, duration } = await generateVideoThumbnail(file);
    
    // 视频转 Base64
    const base64 = await fileToBase64(file);
    
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'video',
      data: base64,
      width,
      height,
      size: file.size,
      mimeType: file.type,
      duration,
      thumbnail,
      createdAt: new Date(),
    };
  } catch (error) {
    throw new Error(`视频处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 处理单个媒体文件
 */
export async function processMediaFile(file: File): Promise<MediaData> {
  const mediaType = getMediaType(file);
  
  if (!mediaType) {
    throw new Error('不支持的文件类型');
  }
  
  if (mediaType === 'image') {
    return processImage(file);
  } else {
    return processVideo(file);
  }
}

/**
 * 处理多个媒体文件
 */
export async function processMediaFiles(files: FileList | File[]): Promise<MediaData[]> {
  const fileArray = Array.from(files).slice(0, MEDIA_CONFIG.maxFiles);
  const results: MediaData[] = [];
  
  for (const file of fileArray) {
    // 验证文件
    const error = validateMediaFile(file);
    if (error) {
      console.warn(`跳过文件 ${file.name}: ${error}`);
      continue;
    }
    
    try {
      const media = await processMediaFile(file);
      results.push(media);
    } catch (error) {
      console.error(`处理文件 ${file.name} 失败:`, error);
    }
  }
  
  return results;
}

/**
 * 获取媒体配置（用于UI显示）
 */
export function getMediaConfig() {
  return {
    maxFiles: MEDIA_CONFIG.maxFiles,
    acceptTypes: [
      ...MEDIA_CONFIG.image.acceptTypes,
      ...MEDIA_CONFIG.video.acceptTypes,
    ].join(','),
    maxImageSize: MEDIA_CONFIG.image.maxSize,
    maxVideoSize: MEDIA_CONFIG.video.maxSize,
  };
}

