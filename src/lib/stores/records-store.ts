/**
 * Zustand Store - 记录状态管理
 */

import { create } from 'zustand';
import { Record, RecordsStore, Location } from '@/lib/types';
import { saveRecords, loadRecords } from '@/lib/utils/storage';
import { differenceInDays } from 'date-fns';

export const useRecordsStore = create<RecordsStore>((set, get) => ({
  records: [],
  
  /**
   * 添加新记录
   */
  addRecord: (content: string, location?: Location) => {
    const newRecord: Record = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      location,  // 添加位置信息
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
      const newRecords = state.records.filter(record => record.id !== id);
      saveRecords(newRecords);
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

