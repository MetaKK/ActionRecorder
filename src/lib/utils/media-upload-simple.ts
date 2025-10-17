/**
 * 简化的媒体上传工具
 * 直接处理文件上传到 IndexedDB
 */

export type MediaType = 'image' | 'video' | 'audio' | 'file';

interface FileValidation {
  valid: boolean;
  error?: string;
}

const MAX_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  file: 50 * 1024 * 1024, // 50MB
};

export function validateFile(file: File, type: MediaType): FileValidation {
  const maxSize = MAX_SIZES[type];
  
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `文件太大，${type === 'image' ? '图片' : type === 'video' ? '视频' : type === 'audio' ? '音频' : '文件'}最大 ${sizeMB}MB`
    };
  }

  return { valid: true };
}

export async function uploadFileToIndexedDB(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
}

