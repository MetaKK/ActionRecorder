/**
 * 存储系统统一导出
 */

// 接口和类型
export * from './interfaces/IStorageAdapter';
export * from './interfaces/types';

// 适配器
export { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
export { IndexedDBAdapter } from './adapters/IndexedDBAdapter';

// 管理器
export { StorageManager } from './StorageManager';

// 工厂函数 - 创建默认配置的存储管理器
import { StorageManager } from './StorageManager';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
import { IndexedDBAdapter } from './adapters/IndexedDBAdapter';
import { StorageType, UserTier } from './interfaces/types';

/**
 * 创建并初始化存储管理器（默认配置）
 */
export async function createStorageManager(userTier: UserTier = UserTier.Free): Promise<StorageManager> {
  const manager = new StorageManager({
    userTier,
    enableCloud: false,  // 默认关闭云端
    enableSync: false,   // 默认关闭同步
    maxLocalSize: 100 * 1024 * 1024, // 100MB
  });
  
  // 注册本地适配器
  const localStorageAdapter = new LocalStorageAdapter();
  const indexedDBAdapter = new IndexedDBAdapter();
  
  manager.registerAdapter(StorageType.LocalStorage, localStorageAdapter);
  manager.registerAdapter(StorageType.IndexedDB, indexedDBAdapter);
  
  // 初始化所有适配器
  await manager.initializeAll();
  
  return manager;
}

