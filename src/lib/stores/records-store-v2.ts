/**
 * Zustand Store V2 - 使用新的存储架构
 * 支持 IndexedDB + LocalStorage + 未来云端
 */

import { create } from 'zustand';
import { Record, RecordsStore, Location, MediaData } from '@/lib/types';
import { getStorageManager } from '@/lib/storage/instance';
import { differenceInDays } from 'date-fns';

export const useRecordsStoreV2 = create<RecordsStore>((set, get) => ({
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
    images?: MediaData[]
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
      // 使用新的存储管理器
      const manager = await getStorageManager();
      
      // 保存记录
      await manager.saveRecord(newRecord);
      
      // 保存媒体文件（如果有）
      if (images && images.length > 0) {
        for (const media of images) {
          await manager.saveMedia(media);
        }
      }
      
      // 更新状态
      set(state => ({
        records: [newRecord, ...state.records],
      }));
      
      console.log('✅ Record saved successfully:', newRecord.id);
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
      const manager = await getStorageManager();
      
      await manager.updateRecord(id, {
        content: content.trim(),
        updatedAt: new Date(),
      });
      
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
      const manager = await getStorageManager();
      
      // 获取记录以释放媒体资源
      const recordToDelete = get().records.find(r => r.id === id);
      
      if (recordToDelete?.images) {
        for (const media of recordToDelete.images) {
          await manager.deleteMedia(media.id);
          // 如果有 Blob URL，释放它
          if (media.data.startsWith('blob:')) {
            URL.revokeObjectURL(media.data);
          }
        }
      }
      
      // 删除记录
      await manager.deleteRecord(id);
      
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
      const manager = await getStorageManager();
      const records = await manager.getAllRecords();
      
      set({ records });
      
      console.log(`✅ Loaded ${records.length} records from storage`);
    } catch (error) {
      console.error('❌ Failed to load from storage:', error);
      set({ records: [] });
    }
  },
}));

// 自动加载数据
if (typeof window !== 'undefined') {
  useRecordsStoreV2.getState().loadFromStorage();
}

