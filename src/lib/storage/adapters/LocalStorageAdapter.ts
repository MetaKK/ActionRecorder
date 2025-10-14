/**
 * LocalStorage 存储适配器
 * 用于存储文本记录和小文件（< 100KB）
 */

import { IStorageAdapter } from '../interfaces/IStorageAdapter';
import { Record, MediaData, StorageCapabilities, StorageInfo } from '../interfaces/types';

export class LocalStorageAdapter implements IStorageAdapter {
  readonly name = 'LocalStorage';
  
  readonly capabilities: StorageCapabilities = {
    maxRecordSize: 100 * 1024,           // 100KB
    maxMediaSize: 0,                     // 不支持媒体文件
    maxTotalSize: 5 * 1024 * 1024,      // 5MB (浏览器限制)
    supportsBinary: false,
    supportsSync: false,
    requiresAuth: false,
    requiresNetwork: false,
  };
  
  private readonly STORAGE_KEY = 'life-recorder-records';
  
  /**
   * 初始化 LocalStorage
   */
  async initialize(): Promise<void> {
    // SSR 检查
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('LocalStorage is not available');
    }
    
    console.log('✅ LocalStorage initialized successfully');
  }
  
  /**
   * 保存单条记录
   */
  async saveRecord(record: Record): Promise<void> {
    const records = await this.getAllRecords();
    
    // 检查是否已存在
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    try {
      const serialized = JSON.stringify(records);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      // 如果存储失败（空间不足）
      throw new Error('LocalStorage quota exceeded. Please clear old records or upgrade to premium.');
    }
  }
  
  /**
   * 批量保存记录
   */
  async saveRecords(records: Record[]): Promise<void> {
    try {
      const serialized = JSON.stringify(records);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      throw new Error('LocalStorage quota exceeded');
    }
  }
  
  /**
   * 获取单条记录
   */
  async getRecord(id: string): Promise<Record | null> {
    const records = await this.getAllRecords();
    const record = records.find(r => r.id === id);
    return record || null;
  }
  
  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<Record[]> {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      
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
      
      // 转换日期字符串为 Date 对象
      return parsed.map((record) => ({
        ...record,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      })) as Record[];
    } catch (error) {
      console.error('Failed to load records from LocalStorage:', error);
      return [];
    }
  }
  
  /**
   * 更新记录
   */
  async updateRecord(id: string, updates: Partial<Record>): Promise<void> {
    const record = await this.getRecord(id);
    
    if (!record) {
      throw new Error(`Record not found: ${id}`);
    }
    
    const updatedRecord = {
      ...record,
      ...updates,
      updatedAt: new Date(),
    };
    
    await this.saveRecord(updatedRecord);
  }
  
  /**
   * 删除记录
   */
  async deleteRecord(id: string): Promise<void> {
    const records = await this.getAllRecords();
    const newRecords = records.filter(r => r.id !== id);
    
    await this.saveRecords(newRecords);
    
    console.log(`✅ Deleted record: ${id}`);
  }
  
  /**
   * 保存媒体文件（不支持）
   */
  async saveMedia(media: MediaData): Promise<string> {
    throw new Error('LocalStorage does not support media files. Use IndexedDB instead.');
  }
  
  /**
   * 获取媒体文件（不支持）
   */
  async getMedia(id: string): Promise<MediaData | null> {
    throw new Error('LocalStorage does not support media files');
  }
  
  /**
   * 删除媒体文件（不支持）
   */
  async deleteMedia(id: string): Promise<void> {
    throw new Error('LocalStorage does not support media files');
  }
  
  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<StorageInfo> {
    const records = await this.getAllRecords();
    const serialized = JSON.stringify(records);
    const usedSize = serialized.length;
    
    return {
      totalRecords: records.length,
      totalSize: this.capabilities.maxTotalSize,
      usedSize,
      availableSize: this.capabilities.maxTotalSize - usedSize,
      mediaCount: 0,
    };
  }
  
  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('✅ Cleared all data from LocalStorage');
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 尝试读取数据
      await this.getAllRecords();
      return true;
    } catch (error) {
      console.error('❌ LocalStorage health check failed:', error);
      return false;
    }
  }
}

