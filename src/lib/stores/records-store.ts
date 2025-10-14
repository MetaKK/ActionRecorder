/**
 * Zustand Store - 记录状态管理
 */

import { create } from 'zustand';
import { Record, RecordsStore, Location, ImageData } from '@/lib/types';
import { saveRecords, loadRecords } from '@/lib/utils/storage';
import { differenceInDays } from 'date-fns';

export const useRecordsStore = create<RecordsStore>((set, get) => ({
  records: [],
  
  /**
   * 添加新记录
   */
  addRecord: (
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
      location,  // 添加位置信息
      
      // 添加音频信息
      audioData: audio?.audioData,
      audioDuration: audio?.audioDuration,
      audioFormat: audio?.audioFormat,
      hasAudio: !!audio,
      
      // 添加图片信息
      images: images && images.length > 0 ? images : undefined,
      hasImages: images ? images.length > 0 : false,
      
      timestamp: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => {
      const newRecords = [newRecord, ...state.records];
      saveRecords(newRecords);
      return { records: newRecords };
    });
  },
  
  /**
   * 更新记录
   */
  updateRecord: (id: string, content: string) => {
    set(state => {
      const newRecords = state.records.map(record =>
        record.id === id
          ? { ...record, content: content.trim(), updatedAt: new Date() }
          : record
      );
      saveRecords(newRecords);
      return { records: newRecords };
    });
  },
  
  /**
   * 删除记录
   */
  deleteRecord: (id: string) => {
    set(state => {
      // 找到要删除的记录
      const recordToDelete = state.records.find(record => record.id === id);
      
      // ⭐ 关键优化：释放音频数据占用的内存
      if (recordToDelete?.audioData) {
        try {
          // 如果 audioData 是 blob URL，需要 revoke
          if (recordToDelete.audioData.startsWith('blob:')) {
            URL.revokeObjectURL(recordToDelete.audioData);
            console.log('🗑️ 释放 blob URL:', recordToDelete.audioData);
          }
          
          // 计算释放的内存大小（base64 数据）
          const audioSize = recordToDelete.audioData.length;
          const sizeInKB = (audioSize / 1024).toFixed(2);
          console.log(`🗑️ 删除音频数据: ${sizeInKB} KB`);
        } catch (err) {
          console.warn('释放音频资源失败:', err);
        }
      }
      
      // 过滤掉要删除的记录
      const newRecords = state.records.filter(record => record.id !== id);
      
      // 保存到 localStorage（会自动序列化，删除的记录不会被保存）
      saveRecords(newRecords);
      
      // 计算节省的存储空间
      const oldSize = JSON.stringify(state.records).length;
      const newSize = JSON.stringify(newRecords).length;
      const savedKB = ((oldSize - newSize) / 1024).toFixed(2);
      console.log(`✅ 已释放存储空间: ${savedKB} KB`);
      
      return { records: newRecords };
    });
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
   * 从 localStorage 加载数据
   */
  loadFromStorage: () => {
    const records = loadRecords();
    set({ records });
  },
}));

