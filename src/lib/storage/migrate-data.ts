/**
 * 数据迁移工具
 * 用于从旧数据库迁移数据到统一的数据库
 */

import { Record } from '@/lib/types';

interface MediaRecord {
  id: string;
  type: 'image' | 'video';
  blob: Blob;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  duration?: number;
  thumbnail?: string;
  createdAt: Date;
}

/**
 * 检查旧数据库是否存在
 */
async function checkOldDatabase(): Promise<boolean> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return false;
  }
  
  return new Promise((resolve) => {
    const request = indexedDB.open('life-recorder-db', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const hasData = db.objectStoreNames.contains('records');
      db.close();
      resolve(hasData);
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
}

/**
 * 从旧数据库获取所有记录
 */
async function getOldRecords(): Promise<Record[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('life-recorder-db', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('records')) {
        db.close();
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['records'], 'readonly');
      const store = transaction.objectStore('records');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const records = getAllRequest.result as Record[];
        db.close();
        resolve(records);
      };
      
      getAllRequest.onerror = () => {
        db.close();
        reject(getAllRequest.error);
      };
    };
  });
}

/**
 * 从旧数据库获取所有媒体
 */
async function getOldMedia(): Promise<MediaRecord[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('life-recorder-db', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('media')) {
        db.close();
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const media = getAllRequest.result as MediaRecord[];
        db.close();
        resolve(media);
      };
      
      getAllRequest.onerror = () => {
        db.close();
        reject(getAllRequest.error);
      };
    };
  });
}

/**
 * 将数据保存到新数据库
 */
async function saveToNewDatabase(records: Record[], media: MediaRecord[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('life-recorder', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      try {
        const transaction = db.transaction(['records', 'media'], 'readwrite');
        const recordStore = transaction.objectStore('records');
        const mediaStore = transaction.objectStore('media');
        
        // 保存所有媒体
        for (const m of media) {
          mediaStore.put(m);
        }
        
        // 保存所有记录
        for (const r of records) {
          recordStore.put(r);
        }
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

/**
 * 删除旧数据库
 */
async function deleteOldDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('life-recorder-db');
    
    request.onsuccess = () => {
      console.log('✅ Old database deleted');
      resolve();
    };
    
    request.onerror = () => {
      console.warn('⚠️ Failed to delete old database:', request.error);
      // 不阻断流程，删除失败不是致命错误
      resolve();
    };
    
    request.onblocked = () => {
      console.warn('⚠️ Old database deletion blocked');
      // 可能有其他连接，稍后会自动清理
      resolve();
    };
  });
}

/**
 * 执行数据迁移
 * @returns 是否执行了迁移
 */
export async function migrateData(): Promise<boolean> {
  try {
    console.log('🔍 Checking for old database...');
    
    const hasOldDb = await checkOldDatabase();
    
    if (!hasOldDb) {
      console.log('✅ No old database found, skip migration');
      return false;
    }
    
    console.log('📦 Old database found, starting migration...');
    
    // 获取旧数据
    const [records, media] = await Promise.all([
      getOldRecords(),
      getOldMedia(),
    ]);
    
    if (records.length === 0 && media.length === 0) {
      console.log('✅ No data to migrate');
      await deleteOldDatabase();
      return false;
    }
    
    console.log(`📊 Migrating ${records.length} records and ${media.length} media files...`);
    
    // 保存到新数据库
    await saveToNewDatabase(records, media);
    
    console.log('✅ Data migration completed');
    
    // 删除旧数据库
    await deleteOldDatabase();
    
    return true;
  } catch (error) {
    console.error('❌ Data migration failed:', error);
    // 不抛出错误，让应用继续运行
    return false;
  }
}

/**
 * 自动执行迁移（在浏览器环境中）
 */
if (typeof window !== 'undefined') {
  // 延迟执行，确保页面加载完成
  setTimeout(() => {
    migrateData().then((migrated) => {
      if (migrated) {
        console.log('🎉 Data migration successful! Your old data has been restored.');
        // 可以选择显示一个通知给用户
      }
    });
  }, 1000);
}

