/**
 * Zustand Store - 记录状态管理
 * 使用 IndexedDB 存储
 */

import { create } from 'zustand';
import { Record, RecordsStore, Location, ImageData } from '@/lib/types';
import { getStorage } from '@/lib/storage/simple';
import { differenceInDays } from 'date-fns';

export const useRecordsStore = create<RecordsStore>((set, get) => ({
  records: [],
  
  /**
   * 添加新记录
   */
  addRecord: async (
    content: string, 
    location?: Location, 
    audio?: {
      audioData: string;
      audioDuration: number;
      audioFormat: string;
    },
    images?: ImageData[]
  ) => {
    const newRecord: Record = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      location,
      
      // 音频信息
      audioData: audio?.audioData,
      audioDuration: audio?.audioDuration,
      audioFormat: audio?.audioFormat,
      hasAudio: !!audio,
      
      // 媒体信息
      images: images && images.length > 0 ? images : undefined,
      hasImages: images ? images.length > 0 : false,
      
      timestamp: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      const storage = await getStorage();
      await storage.saveRecord(newRecord);
      
      set(state => ({
        records: [newRecord, ...state.records],
      }));
      
      console.log('✅ Record saved:', newRecord.id);
    } catch (error) {
      console.error('❌ Failed to save record:', error);
      throw error;
    }
  },
  
  /**
   * 更新记录
   */
  updateRecord: async (id: string, content: string) => {
    try {
      const storage = await getStorage();
      await storage.updateRecord(id, { content: content.trim() });
      
      set(state => ({
        records: state.records.map(record =>
          record.id === id
            ? { ...record, content: content.trim(), updatedAt: new Date() }
            : record
        ),
      }));
      
      console.log('✅ Record updated:', id);
    } catch (error) {
      console.error('❌ Failed to update record:', error);
      throw error;
    }
  },
  
  /**
   * 删除记录
   */
  deleteRecord: async (id: string) => {
    try {
      const storage = await getStorage();
      await storage.deleteRecord(id);
      
      set(state => ({
        records: state.records.filter(record => record.id !== id),
      }));
      
      console.log('✅ Record deleted:', id);
    } catch (error) {
      console.error('❌ Failed to delete record:', error);
      throw error;
    }
  },
  
  /**
   * 根据日期范围获取记录
   */
  getRecordsByDateRange: (days?: number) => {
    const { records } = get();
    
    if (!days) {
      return records;
    }
    
    const now = new Date();
    return records.filter(record => {
      const diff = differenceInDays(now, record.createdAt);
      return diff <= days;
    });
  },
  
  /**
   * 从存储加载数据
   */
  loadFromStorage: async () => {
    try {
      const storage = await getStorage();
      const records = await storage.getAllRecords();
      set({ records });
      console.log(`✅ Loaded ${records.length} records`);
    } catch (error) {
      console.error('❌ Failed to load records:', error);
      set({ records: [] });
    }
  },
}));

// 自动加载数据 - 延迟执行确保组件挂载后
if (typeof window !== 'undefined') {
  // 使用 setTimeout 确保在下一个事件循环中执行
  setTimeout(() => {
    useRecordsStore.getState().loadFromStorage();
  }, 0);
}

