/**
 * 简化的存储实现 - MVP 版本
 * 直接使用 IndexedDB，保留未来扩展接口
 */

import { Record, MediaData } from '@/lib/types';

class SimpleStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'life-recorder';
  private readonly VERSION = 2; // ⭐ 升级版本以支持新索引
  private readonly STORE_RECORDS = 'records';
  private readonly STORE_MEDIA = 'media';
  
  /**
   * 检查数据库是否已初始化
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Storage initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        
        console.log(`🔄 Upgrading database from v${oldVersion} to v${this.VERSION}...`);
        
        // 记录表 - v1
        if (!db.objectStoreNames.contains(this.STORE_RECORDS)) {
          const store = db.createObjectStore(this.STORE_RECORDS, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('createdAt', 'createdAt');
          
          // ⭐ v2: 添加优化索引
          store.createIndex('hasAudio', 'hasAudio', { unique: false });
          store.createIndex('hasImages', 'hasImages', { unique: false });
          store.createIndex('createdAt_id', ['createdAt', 'id'], { unique: false });
          
          console.log('✅ Created records store with v2 indexes');
        } else if (oldVersion < 2 && transaction) {
          // ⭐ 升级现有数据库到 v2：添加新索引
          const recordStore = transaction.objectStore(this.STORE_RECORDS);
          
          if (!recordStore.indexNames.contains('hasAudio')) {
            recordStore.createIndex('hasAudio', 'hasAudio', { unique: false });
            console.log('✅ Added hasAudio index');
          }
          if (!recordStore.indexNames.contains('hasImages')) {
            recordStore.createIndex('hasImages', 'hasImages', { unique: false });
            console.log('✅ Added hasImages index');
          }
          if (!recordStore.indexNames.contains('createdAt_id')) {
            recordStore.createIndex('createdAt_id', ['createdAt', 'id'], { unique: false });
            console.log('✅ Added createdAt_id index');
          }
        }
        
        // 媒体表
        if (!db.objectStoreNames.contains(this.STORE_MEDIA)) {
          const store = db.createObjectStore(this.STORE_MEDIA, { keyPath: 'id' });
          store.createIndex('type', 'type');
          console.log('✅ Created media store');
        }
        
        console.log('✅ Database upgrade complete');
      };
    });
  }
  
  /**
   * 保存记录
   */
  async saveRecord(record: Record): Promise<void> {
    if (!this.db) {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }
    
    // 先保存媒体
    if (record.images?.length) {
      for (const media of record.images) {
        await this.saveMedia(media);
      }
    }
    
    // 保存记录（不含媒体 data）
    const recordToSave = {
      ...record,
      images: record.images?.map(m => ({ ...m, data: undefined })),
    };
    
    const tx = this.db.transaction([this.STORE_RECORDS], 'readwrite');
    const store = tx.objectStore(this.STORE_RECORDS);
    
    return new Promise((resolve, reject) => {
      const req = store.put(recordToSave);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  
  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<Record[]> {
    if (!this.db) {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction([this.STORE_RECORDS], 'readonly');
    const store = tx.objectStore(this.STORE_RECORDS);
    
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = async () => {
        const records = req.result as Record[];
        
        // 加载媒体
        for (const record of records) {
          if (record.images?.length) {
            record.images = await Promise.all(
              record.images.map(m => this.getMedia(m.id))
            ).then(arr => arr.filter(Boolean) as MediaData[]);
          }
          record.createdAt = new Date(record.createdAt);
          record.updatedAt = new Date(record.updatedAt);
        }
        
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  }
  
  /**
   * 更新记录
   */
  async updateRecord(id: string, updates: Partial<Record>): Promise<void> {
    if (!this.db) {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction([this.STORE_RECORDS], 'readwrite');
    const store = tx.objectStore(this.STORE_RECORDS);
    
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) {
          reject(new Error('Record not found'));
          return;
        }
        
        const updated = { ...record, ...updates, updatedAt: new Date() };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
  
  /**
   * 删除记录
   */
  async deleteRecord(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction([this.STORE_RECORDS, this.STORE_MEDIA], 'readwrite');
    const recordStore = tx.objectStore(this.STORE_RECORDS);
    const mediaStore = tx.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      // 先获取记录以删除关联媒体
      const getReq = recordStore.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result as Record;
        
        // 删除媒体
        if (record?.images?.length) {
          record.images.forEach(m => {
            mediaStore.delete(m.id);
            if (m.data?.startsWith('blob:')) {
              URL.revokeObjectURL(m.data);
            }
          });
        }
        
        // 删除记录
        const delReq = recordStore.delete(id);
        delReq.onsuccess = () => resolve();
        delReq.onerror = () => reject(delReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
  
  /**
   * 保存媒体
   */
  async saveMedia(media: MediaData): Promise<void> {
    if (!this.db) {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }
    
    const blob = this.base64ToBlob(media.data, media.mimeType);
    
    const mediaRecord = {
      id: media.id,
      type: media.type,
      blob,
      width: media.width,
      height: media.height,
      size: media.size,
      mimeType: media.mimeType,
      duration: media.duration,
      thumbnail: media.thumbnail,
      createdAt: media.createdAt,
    };
    
    const tx = this.db.transaction([this.STORE_MEDIA], 'readwrite');
    const store = tx.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      const req = store.put(mediaRecord);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  
  /**
   * 获取媒体
   */
  async getMedia(id: string): Promise<MediaData | null> {
    if (!this.db) {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction([this.STORE_MEDIA], 'readonly');
    const store = tx.objectStore(this.STORE_MEDIA);
    
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        const url = URL.createObjectURL(result.blob);
        resolve({
          id: result.id,
          type: result.type,
          data: url,
          width: result.width,
          height: result.height,
          size: result.size,
          mimeType: result.mimeType,
          duration: result.duration,
          thumbnail: result.thumbnail,
          createdAt: new Date(result.createdAt),
        });
      };
      req.onerror = () => reject(req.error);
    });
  }
  
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }
}

// 单例
let instance: SimpleStorage | null = null;
let initPromise: Promise<SimpleStorage> | null = null;

export async function getStorage(): Promise<SimpleStorage> {
  if (instance && instance.isInitialized()) {
    return instance;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    if (!instance) {
      instance = new SimpleStorage();
    }
    
    if (!instance.isInitialized()) {
      await instance.init();
    }
    
    return instance;
  })();
  
  return initPromise;
}

