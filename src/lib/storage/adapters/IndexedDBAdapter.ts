/**
 * IndexedDB 存储适配器
 * 用于存储大文件和二进制数据（图片、视频、音频）
 */

import { IStorageAdapter } from '../interfaces/IStorageAdapter';
import { Record, MediaData, StorageCapabilities, StorageInfo, MediaRecord } from '../interfaces/types';

export class IndexedDBAdapter implements IStorageAdapter {
  readonly name = 'IndexedDB';
  
  readonly capabilities: StorageCapabilities = {
    maxRecordSize: 10 * 1024 * 1024,        // 10MB
    maxMediaSize: 100 * 1024 * 1024,        // 100MB
    maxTotalSize: Number.MAX_SAFE_INTEGER,  // 取决于磁盘
    supportsBinary: true,
    supportsSync: false,
    requiresAuth: false,
    requiresNetwork: false,
  };
  
  private db: IDBDatabase | null = null;
  private readonly dbName = 'life-recorder-db';
  private readonly version = 1;
  
  // Object Store names
  private readonly STORE_RECORDS = 'records';
  private readonly STORE_MEDIA = 'media';
  
  /**
   * 初始化 IndexedDB
   */
  async initialize(): Promise<void> {
    // SSR 检查
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      throw new Error('IndexedDB is not available');
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('❌ IndexedDB initialization failed:', request.error);
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        console.log('🔄 Upgrading IndexedDB schema...');
        
        // 创建 records 对象存储
        if (!db.objectStoreNames.contains(this.STORE_RECORDS)) {
          const recordStore = db.createObjectStore(this.STORE_RECORDS, { keyPath: 'id' });
          recordStore.createIndex('timestamp', 'timestamp', { unique: false });
          recordStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('✅ Created records object store');
        }
        
        // 创建 media 对象存储
        if (!db.objectStoreNames.contains(this.STORE_MEDIA)) {
          const mediaStore = db.createObjectStore(this.STORE_MEDIA, { keyPath: 'id' });
          mediaStore.createIndex('type', 'type', { unique: false });
          mediaStore.createIndex('recordId', 'recordId', { unique: false });
          mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('✅ Created media object store');
        }
      };
    });
  }
  
  /**
   * 保存单条记录
   */
  async saveRecord(record: Record): Promise<void> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_RECORDS], 'readwrite');
    const store = transaction.objectStore(this.STORE_RECORDS);
    
    // 如果记录包含媒体，先保存媒体数据
    if (record.images && record.images.length > 0) {
      for (const media of record.images) {
        await this.saveMedia(media);
      }
    }
    
    // 保存记录（不包含媒体的原始 data，只保存引用）
    const recordToSave = {
      ...record,
      images: record.images?.map(m => ({
        ...m,
        data: undefined, // 不保存 Base64 data，节省空间
        blob: undefined, // 不保存 Blob，已经在 media store 中
      })),
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(recordToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save record'));
    });
  }
  
  /**
   * 批量保存记录
   */
  async saveRecords(records: Record[]): Promise<void> {
    for (const record of records) {
      await this.saveRecord(record);
    }
  }
  
  /**
   * 获取单条记录
   */
  async getRecord(id: string): Promise<Record | null> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_RECORDS], 'readonly');
    const store = transaction.objectStore(this.STORE_RECORDS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = async () => {
        const record = request.result as Record | undefined;
        
        if (!record) {
          resolve(null);
          return;
        }
        
        // 如果有媒体引用，加载媒体数据
        if (record.images && record.images.length > 0) {
          const loadedImages = await Promise.all(
            record.images.map(img => this.getMedia(img.id))
          );
          record.images = loadedImages.filter(img => img !== null) as MediaData[];
        }
        
        // 转换日期
        record.createdAt = new Date(record.createdAt);
        record.updatedAt = new Date(record.updatedAt);
        
        resolve(record);
      };
      
      request.onerror = () => reject(new Error('Failed to get record'));
    });
  }
  
  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<Record[]> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_RECORDS], 'readonly');
    const store = transaction.objectStore(this.STORE_RECORDS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const records = request.result as Record[];
        
        // 加载每条记录的媒体数据
        const loadedRecords = await Promise.all(
          records.map(async (record) => {
            if (record.images && record.images.length > 0) {
              const loadedImages = await Promise.all(
                record.images.map(img => this.getMedia(img.id))
              );
              record.images = loadedImages.filter(img => img !== null) as MediaData[];
            }
            
            // 转换日期
            record.createdAt = new Date(record.createdAt);
            record.updatedAt = new Date(record.updatedAt);
            
            return record;
          })
        );
        
        resolve(loadedRecords);
      };
      
      request.onerror = () => reject(new Error('Failed to get all records'));
    });
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
    this.ensureInitialized();
    
    // 先获取记录以删除关联的媒体
    const record = await this.getRecord(id);
    
    if (record?.images) {
      for (const media of record.images) {
        await this.deleteMedia(media.id);
      }
    }
    
    const transaction = this.db!.transaction([this.STORE_RECORDS], 'readwrite');
    const store = transaction.objectStore(this.STORE_RECORDS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`✅ Deleted record: ${id}`);
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to delete record'));
    });
  }
  
  /**
   * 保存媒体文件
   */
  async saveMedia(media: MediaData): Promise<string> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_MEDIA], 'readwrite');
    const store = transaction.objectStore(this.STORE_MEDIA);
    
    // 将 Base64 转换为 Blob
    const blob = this.base64ToBlob(media.data, media.mimeType);
    
    const mediaRecord: MediaRecord = {
      id: media.id,
      type: media.type,
      blob: blob,
      width: media.width,
      height: media.height,
      size: media.size,
      mimeType: media.mimeType,
      duration: media.duration,
      thumbnail: media.thumbnail,
      createdAt: new Date(media.createdAt),
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(mediaRecord);
      request.onsuccess = () => {
        console.log(`✅ Saved media: ${media.id} (${media.type}, ${(blob.size / 1024).toFixed(2)} KB)`);
        resolve(media.id);
      };
      request.onerror = () => reject(new Error('Failed to save media'));
    });
  }
  
  /**
   * 获取媒体文件
   */
  async getMedia(id: string): Promise<MediaData | null> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_MEDIA], 'readonly');
    const store = transaction.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const mediaRecord = request.result as MediaRecord | undefined;
        
        if (!mediaRecord) {
          resolve(null);
          return;
        }
        
        // 创建 Blob URL 用于播放/显示
        const blobUrl = URL.createObjectURL(mediaRecord.blob);
        
        const media: MediaData = {
          id: mediaRecord.id,
          type: mediaRecord.type,
          data: blobUrl,  // Blob URL
          width: mediaRecord.width,
          height: mediaRecord.height,
          size: mediaRecord.size,
          mimeType: mediaRecord.mimeType,
          duration: mediaRecord.duration,
          thumbnail: mediaRecord.thumbnail,
          createdAt: new Date(mediaRecord.createdAt),
        };
        
        resolve(media);
      };
      
      request.onerror = () => reject(new Error('Failed to get media'));
    });
  }
  
  /**
   * 删除媒体文件
   */
  async deleteMedia(id: string): Promise<void> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_MEDIA], 'readwrite');
    const store = transaction.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`✅ Deleted media: ${id}`);
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to delete media'));
    });
  }
  
  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<StorageInfo> {
    this.ensureInitialized();
    
    const records = await this.getAllRecords();
    
    // 获取媒体信息
    const mediaTransaction = this.db!.transaction([this.STORE_MEDIA], 'readonly');
    const mediaStore = mediaTransaction.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      const request = mediaStore.getAll();
      
      request.onsuccess = () => {
        const mediaRecords = request.result as MediaRecord[];
        
        const mediaSize = mediaRecords.reduce((sum, media) => sum + media.size, 0);
        const recordsSize = JSON.stringify(records).length;
        const totalSize = mediaSize + recordsSize;
        
        // IndexedDB 可用空间估算（取决于浏览器和磁盘）
        const availableSize = Number.MAX_SAFE_INTEGER;
        
        resolve({
          totalRecords: records.length,
          totalSize,
          usedSize: totalSize,
          availableSize,
          mediaCount: mediaRecords.length,
        });
      };
      
      request.onerror = () => reject(new Error('Failed to get storage info'));
    });
  }
  
  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.ensureInitialized();
    
    const transaction = this.db!.transaction([this.STORE_RECORDS, this.STORE_MEDIA], 'readwrite');
    
    const recordsStore = transaction.objectStore(this.STORE_RECORDS);
    const mediaStore = transaction.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      const clearRecords = recordsStore.clear();
      const clearMedia = mediaStore.clear();
      
      transaction.oncomplete = () => {
        console.log('✅ Cleared all data from IndexedDB');
        resolve();
      };
      
      transaction.onerror = () => reject(new Error('Failed to clear data'));
    });
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      // 尝试读取数据
      await this.getAllRecords();
      
      return true;
    } catch (error) {
      console.error('❌ IndexedDB health check failed:', error);
      return false;
    }
  }
  
  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.db) {
      throw new Error('IndexedDB not initialized. Call initialize() first.');
    }
  }
  
  /**
   * Base64 转 Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    // 处理 data URL
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    
    try {
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      return new Blob([ab], { type: mimeType });
    } catch (error) {
      console.error('Failed to convert Base64 to Blob:', error);
      throw new Error('Invalid Base64 data');
    }
  }
}

