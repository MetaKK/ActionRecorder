/**
 * 媒体文件上传工具
 * 支持图片、视频、音频等多种格式
 * 使用 IndexedDB 或 Base64 存储
 */

import { compressImage } from './image';

/**
 * 支持的文件类型
 */
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/webm'];

/**
 * 文件大小限制（MB）
 */
export const MAX_IMAGE_SIZE = 10; // 10MB
export const MAX_VIDEO_SIZE = 100; // 100MB
export const MAX_AUDIO_SIZE = 50; // 50MB

/**
 * 文件类型判断
 */
export function getFileType(file: File): 'image' | 'video' | 'audio' | 'other' {
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (SUPPORTED_VIDEO_TYPES.includes(file.type)) return 'video';
  if (SUPPORTED_AUDIO_TYPES.includes(file.type)) return 'audio';
  return 'other';
}

/**
 * 验证文件
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const fileType = getFileType(file);
  const sizeMB = file.size / (1024 * 1024);

  if (fileType === 'image' && sizeMB > MAX_IMAGE_SIZE) {
    return { valid: false, error: `图片大小不能超过 ${MAX_IMAGE_SIZE}MB` };
  }

  if (fileType === 'video' && sizeMB > MAX_VIDEO_SIZE) {
    return { valid: false, error: `视频大小不能超过 ${MAX_VIDEO_SIZE}MB` };
  }

  if (fileType === 'audio' && sizeMB > MAX_AUDIO_SIZE) {
    return { valid: false, error: `音频大小不能超过 ${MAX_AUDIO_SIZE}MB` };
  }

  if (fileType === 'other') {
    return { valid: false, error: '不支持的文件类型' };
  }

  return { valid: true };
}

/**
 * 上传文件到 IndexedDB
 */
export async function uploadToIndexedDB(file: File): Promise<string> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileType = getFileType(file);

  // 对图片进行压缩
  if (fileType === 'image') {
    const compressedBlob = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
    });
    return await saveToIndexedDB(compressedBlob, file.name, file.type);
  }

  // 其他文件直接存储
  return await saveToIndexedDB(file, file.name, file.type);
}

/**
 * 保存到 IndexedDB
 */
async function saveToIndexedDB(blob: Blob, name: string, type: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DiaryMediaDB', 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media', { keyPath: 'id' });
      }
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const transaction = db.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');

      // 读取 blob 为 ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      const mediaObject = {
        id,
        data: arrayBuffer,
        name,
        type,
        size: blob.size,
        createdAt: new Date().toISOString(),
      };

      const putRequest = store.put(mediaObject);

      putRequest.onsuccess = () => {
        resolve(`indexeddb://${id}`);
      };

      putRequest.onerror = () => {
        reject(new Error('Failed to save media to IndexedDB'));
      };
    };
  });
}

/**
 * 从 IndexedDB 读取媒体文件
 */
export async function getFromIndexedDB(id: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DiaryMediaDB', 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          const blob = new Blob([result.data], { type: result.type });
          resolve(blob);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get media from IndexedDB'));
      };
    };
  });
}

/**
 * 转换为 Base64（小文件备选方案）
 */
export async function uploadToBase64(file: File): Promise<string> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileType = getFileType(file);

  // 压缩图片
  if (fileType === 'image') {
    const compressedBlob = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    });
    return await blobToBase64(compressedBlob);
  }

  // 其他小文件
  if (file.size < 5 * 1024 * 1024) {
    return await fileToBase64(file);
  }

  throw new Error('文件太大，请使用 IndexedDB 存储');
}

/**
 * File 转 Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Blob 转 Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(file: File, maxSize = 200): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('只能为图片生成缩略图');
  }

  const compressedBlob = await compressImage(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.7,
  });

  return await blobToBase64(compressedBlob);
}

/**
 * 从 URL 加载媒体
 */
export async function loadMediaFromURL(url: string): Promise<Blob | null> {
  // IndexedDB URL
  if (url.startsWith('indexeddb://')) {
    const id = url.replace('indexeddb://', '');
    return await getFromIndexedDB(id);
  }

  // Base64 URL
  if (url.startsWith('data:')) {
    const response = await fetch(url);
    return await response.blob();
  }

  // HTTP URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await fetch(url);
    return await response.blob();
  }

  return null;
}

/**
 * 清理未使用的媒体文件
 */
export async function cleanupUnusedMedia(usedMediaIds: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DiaryMediaDB', 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      const getAllRequest = store.getAllKeys();

      getAllRequest.onsuccess = () => {
        const allKeys = getAllRequest.result as string[];
        const unusedKeys = allKeys.filter((key) => !usedMediaIds.includes(key));

        unusedKeys.forEach((key) => {
          store.delete(key);
        });

        console.log(`Cleaned up ${unusedKeys.length} unused media files`);
        resolve();
      };

      getAllRequest.onerror = () => {
        reject(new Error('Failed to get media keys'));
      };
    };
  });
}

/**
 * 获取存储统计
 */
export async function getStorageStats(): Promise<{
  count: number;
  totalSize: number;
  sizeByType: Record<string, number>;
}> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DiaryMediaDB', 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const allMedia = getAllRequest.result;
        
        const stats = {
          count: allMedia.length,
          totalSize: 0,
          sizeByType: {} as Record<string, number>,
        };

        allMedia.forEach((media: { size: number; type: string }) => {
          stats.totalSize += media.size;
          stats.sizeByType[media.type] = (stats.sizeByType[media.type] || 0) + media.size;
        });

        resolve(stats);
      };

      getAllRequest.onerror = () => {
        reject(new Error('Failed to get storage stats'));
      };
    };
  });
}

