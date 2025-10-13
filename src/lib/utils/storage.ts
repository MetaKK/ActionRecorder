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
 * 清空所有记录
 */
export function clearRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

