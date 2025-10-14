/**
 * 全局存储实例
 * 单例模式，确保整个应用使用同一个 StorageManager
 */

import { StorageManager } from './StorageManager';
import { createStorageManager } from './index';
import { UserTier } from './interfaces/types';

let storageManagerInstance: StorageManager | null = null;
let initPromise: Promise<StorageManager> | null = null;

/**
 * 获取全局存储管理器实例
 * 如果未初始化，会自动初始化
 */
export async function getStorageManager(): Promise<StorageManager> {
  if (storageManagerInstance) {
    return storageManagerInstance;
  }
  
  // 如果正在初始化，返回同一个 Promise
  if (initPromise) {
    return initPromise;
  }
  
  // 开始初始化
  initPromise = (async () => {
    console.log('🚀 Initializing global StorageManager...');
    
    try {
      // 创建存储管理器（默认免费用户）
      const manager = await createStorageManager(UserTier.Free);
      
      storageManagerInstance = manager;
      console.log('✅ Global StorageManager initialized');
      
      return manager;
    } catch (error) {
      console.error('❌ Failed to initialize StorageManager:', error);
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}

/**
 * 重置存储管理器（用于测试或切换用户）
 */
export function resetStorageManager(): void {
  storageManagerInstance = null;
  initPromise = null;
  console.log('🔄 StorageManager reset');
}

/**
 * 升级用户等级（用于会员功能）
 */
export async function upgradeUserTier(tier: UserTier): Promise<void> {
  const manager = await getStorageManager();
  manager.updateUserTier(tier);
  console.log(`⬆️ User tier upgraded to: ${tier}`);
}

