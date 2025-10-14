/**
 * 存储统计 Hook
 * 性能优化版本：使用 useMemo 和 debounce
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getStorage } from '@/lib/storage/simple';
import { useRecords } from './use-records';

export interface StorageStats {
  // 记录统计
  totalRecords: number;
  textRecords: number;
  audioRecords: number;
  imageRecords: number;
  videoRecords: number;
  
  // 存储空间（字节）
  usedSpace: number;
  totalSpace: number;
  availableSpace: number;
  
  // 媒体统计
  totalImages: number;
  totalVideos: number;
  
  // 格式化显示
  usedSpaceFormatted: string;
  totalSpaceFormatted: string;
  usagePercentage: number;
  
  // 最近活动
  lastRecordDate?: Date;
  recordsThisWeek: number;
  recordsThisMonth: number;
}

/**
 * 格式化字节为可读格式
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * 计算存储统计
 */
export function useStorageStats(): {
  stats: StorageStats | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const { records } = useRecords();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  // 使用 useMemo 缓存计算结果
  const recordsStats = useMemo(() => {
    const result = {
      textRecords: 0,
      audioRecords: 0,
      imageRecords: 0,
      videoRecords: 0,
      totalImages: 0,
      totalVideos: 0,
      totalSize: 0,
    };
    
    for (const record of records) {
      // 文本记录
      if (record.content && record.content.trim()) {
        result.textRecords++;
      }
      
      // 音频记录
      if (record.hasAudio) {
        result.audioRecords++;
      }
      
      // 统计媒体
      if (record.images && record.images.length > 0) {
        let hasImage = false;
        let hasVideo = false;
        
        for (const media of record.images) {
          result.totalSize += media.size || 0;
          
          if (media.type === 'image') {
            result.totalImages++;
            hasImage = true;
          } else if (media.type === 'video') {
            result.totalVideos++;
            hasVideo = true;
          }
        }
        
        if (hasImage) result.imageRecords++;
        if (hasVideo) result.videoRecords++;
      }
      
      // 音频大小估算
      if (record.audioData) {
        result.totalSize += record.audioData.length * 0.75;
      }
      
      // 文本大小
      result.totalSize += (record.content?.length || 0) * 2; // UTF-16
    }
    
    return result;
  }, [records]);
  
  const calculateStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 使用缓存的统计结果
      const {
        textRecords,
        audioRecords,
        imageRecords,
        videoRecords,
        totalImages,
        totalVideos,
        totalSize: usedSpace,
      } = recordsStats;
      
      // 计算存储空间
      let totalSpace = 0;
      let availableSpace = 0;
      
      // 估算总空间（Chrome: 可用磁盘的 60%）
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        totalSpace = estimate.quota || 0;
        availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
      } else {
        // 降级：假设 100GB
        totalSpace = 100 * 1024 * 1024 * 1024;
        availableSpace = totalSpace - usedSpace;
      }
      
      const usagePercentage = totalSpace > 0 
        ? Math.min(100, (usedSpace / totalSpace) * 100)
        : 0;
      
      // 时间统计
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recordsThisWeek = records.filter(r => r.createdAt >= oneWeekAgo).length;
      const recordsThisMonth = records.filter(r => r.createdAt >= oneMonthAgo).length;
      
      const lastRecordDate = records.length > 0 
        ? new Date(Math.max(...records.map(r => r.createdAt.getTime())))
        : undefined;
      
      setStats({
        totalRecords: records.length,
        textRecords,
        audioRecords,
        imageRecords,
        videoRecords,
        
        usedSpace,
        totalSpace,
        availableSpace,
        
        totalImages,
        totalVideos,
        
        usedSpaceFormatted: formatBytes(usedSpace),
        totalSpaceFormatted: formatBytes(totalSpace),
        usagePercentage,
        
        lastRecordDate,
        recordsThisWeek,
        recordsThisMonth,
      });
    } catch (error) {
      console.error('Failed to calculate storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [recordsStats]);
  
  // 使用 debounce 优化，避免频繁计算
  useEffect(() => {
    // 清除之前的定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // 设置新的定时器，300ms 后计算
    debounceTimer.current = setTimeout(() => {
      calculateStats();
    }, 300);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [recordsStats, calculateStats]);
  
  return {
    stats,
    isLoading,
    refresh: calculateStats,
  };
}

