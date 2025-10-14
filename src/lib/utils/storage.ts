/*
 * @Author: meta-kk 11097094+teacher-kk@user.noreply.gitee.com
 * @Date: 2025-10-13 15:05:24
 * @LastEditors: meta-kk 11097094+teacher-kk@user.noreply.gitee.com
 * @LastEditTime: 2025-10-13 21:21:25
 * @FilePath: /Code/life-recorder/src/lib/utils/storage.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * localStorage 封装
 */

import { Record } from '@/lib/types';

const STORAGE_KEY = 'life-recorder-data';

/**
 * 保存记录到 localStorage
 */
export function saveRecords(records: Record[]): void {
  try {
    const serialized = JSON.stringify(records);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save records:', error);
    throw new Error('存储空间已满，请导出并清理旧记录');
  }
}

/**
 * 从 localStorage 加载记录
 */
export function loadRecords(): Record[] {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return [];
    }
    
    const parsed = JSON.parse(serialized) as Array<{
      id: string;
      content: string;
      timestamp: number;
      createdAt: string | Date;
      updatedAt: string | Date;
    }>;
    
    // 将日期字符串转换回 Date 对象
    return parsed.map((record) => ({
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load records:', error);
    return [];
  }
}

/**
 * 清空所有记录（释放所有内存）
 */
export function clearRecords(): void {
  try {
    // 先加载所有记录以便释放 blob URLs
    const records = loadRecords();
    
    // 释放所有音频的 blob URLs
    let totalBlobsRevoked = 0;
    let totalDataSize = 0;
    
    records.forEach(record => {
      if (record.audioData) {
        // 释放 blob URL
        if (record.audioData.startsWith('blob:')) {
          URL.revokeObjectURL(record.audioData);
          totalBlobsRevoked++;
        }
        
        // 计算数据大小
        totalDataSize += record.audioData.length;
      }
    });
    
    // 从 localStorage 移除
    localStorage.removeItem(STORAGE_KEY);
    
    const sizeInKB = (totalDataSize / 1024).toFixed(2);
    const sizeInMB = (totalDataSize / 1024 / 1024).toFixed(2);
    
    console.group('🗑️ 清空所有记录');
    console.log(`删除记录数: ${records.length}`);
    console.log(`释放 Blob URLs: ${totalBlobsRevoked} 个`);
    console.log(`释放数据大小: ${sizeInKB} KB (${sizeInMB} MB)`);
    console.log(`✅ localStorage 已清空`);
    console.groupEnd();
  } catch (error) {
    console.error('清空记录失败:', error);
    // 即使出错也尝试清空 localStorage
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * 获取当前存储使用情况
 */
export function getStorageInfo(): {
  totalRecords: number;
  totalSize: number;
  audioRecords: number;
  audioSize: number;
} {
  try {
    const records = loadRecords();
    const serialized = JSON.stringify(records);
    const totalSize = serialized.length;
    
    let audioRecords = 0;
    let audioSize = 0;
    
    records.forEach(record => {
      if (record.audioData) {
        audioRecords++;
        audioSize += record.audioData.length;
      }
    });
    
    return {
      totalRecords: records.length,
      totalSize,
      audioRecords,
      audioSize,
    };
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return {
      totalRecords: 0,
      totalSize: 0,
      audioRecords: 0,
      audioSize: 0,
    };
  }
}

/**
 * 清理旧记录（保留最近 N 天的记录）
 */
export function cleanupOldRecords(daysToKeep: number = 30): {
  deleted: number;
  saved: number;
  freedSize: number;
} {
  try {
    const records = loadRecords();
    const now = Date.now();
    const keepThreshold = daysToKeep * 24 * 60 * 60 * 1000; // 转换为毫秒
    
    let deletedCount = 0;
    let freedSize = 0;
    let blobsRevoked = 0;
    
    // 分离保留和删除的记录
    const recordsToKeep: Record[] = [];
    const recordsToDelete: Record[] = [];
    
    records.forEach(record => {
      const age = now - record.timestamp;
      if (age > keepThreshold) {
        recordsToDelete.push(record);
      } else {
        recordsToKeep.push(record);
      }
    });
    
    // 释放要删除的记录的资源
    recordsToDelete.forEach(record => {
      if (record.audioData) {
        if (record.audioData.startsWith('blob:')) {
          URL.revokeObjectURL(record.audioData);
          blobsRevoked++;
        }
        freedSize += record.audioData.length;
      }
      deletedCount++;
    });
    
    // 保存保留的记录
    saveRecords(recordsToKeep);
    
    const freedKB = (freedSize / 1024).toFixed(2);
    const freedMB = (freedSize / 1024 / 1024).toFixed(2);
    
    console.group(`🧹 清理 ${daysToKeep} 天前的记录`);
    console.log(`删除记录: ${deletedCount} 条`);
    console.log(`保留记录: ${recordsToKeep.length} 条`);
    console.log(`释放 Blob URLs: ${blobsRevoked} 个`);
    console.log(`释放空间: ${freedKB} KB (${freedMB} MB)`);
    console.groupEnd();
    
    return {
      deleted: deletedCount,
      saved: recordsToKeep.length,
      freedSize,
    };
  } catch (error) {
    console.error('清理旧记录失败:', error);
    return {
      deleted: 0,
      saved: 0,
      freedSize: 0,
    };
  }
}

