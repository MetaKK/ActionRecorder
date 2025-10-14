/**
 * 存储管理器 - 核心协调者
 * 职责：
 * 1. 管理多个存储适配器
 * 2. 根据策略路由到合适的存储
 * 3. 处理存储迁移
 * 4. 未来支持云端同步
 */

import { IStorageAdapter } from './interfaces/IStorageAdapter';
import {
  StorageType,
  UserTier,
  StorageConfig,
  StorageStrategy,
  StorageInfo,
  Record,
  MediaData,
  MigrationProgressCallback,
} from './interfaces/types';

export class StorageManager {
  private adapters: Map<StorageType, IStorageAdapter>;
  private currentStrategy: StorageStrategy;
  private userTier: UserTier;
  private config: StorageConfig;
  
  constructor(config: StorageConfig) {
    this.adapters = new Map();
    this.config = config;
    this.userTier = config.userTier;
    this.currentStrategy = this.determineStrategy(config);
    
    console.log('🎯 StorageManager initialized', {
      userTier: this.userTier,
      strategy: this.currentStrategy,
    });
  }
  
  /**
   * 注册存储适配器
   */
  registerAdapter(type: StorageType, adapter: IStorageAdapter): void {
    this.adapters.set(type, adapter);
    console.log(`✅ Registered adapter: ${adapter.name} (${type})`);
  }
  
  /**
   * 获取适配器
   */
  getAdapter(type: StorageType): IStorageAdapter | undefined {
    return this.adapters.get(type);
  }
  
  /**
   * 初始化所有适配器
   */
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.adapters.values()).map(adapter =>
      adapter.initialize().catch(error => {
        console.error(`❌ Failed to initialize ${adapter.name}:`, error);
        throw error;
      })
    );
    
    await Promise.all(initPromises);
    console.log('✅ All adapters initialized');
  }
  
  /**
   * 保存记录 - 自动选择存储方式
   */
  async saveRecord(record: Record): Promise<void> {
    const adapter = this.selectAdapterForRecord(record);
    
    console.log(`📝 Saving record with ${adapter.name}:`, record.id);
    
    await adapter.saveRecord(record);
    
    // 如果启用了云端同步（未来功能）
    if (this.config.enableSync && this.userTier !== UserTier.Free) {
      await this.syncToCloud(record);
    }
  }
  
  /**
   * 批量保存记录
   */
  async saveRecords(records: Record[]): Promise<void> {
    // 简化版本：使用主存储
    const adapter = this.getPrimaryAdapter();
    await adapter.saveRecords(records);
  }
  
  /**
   * 获取单条记录
   */
  async getRecord(id: string): Promise<Record | null> {
    // 尝试从所有适配器中获取
    for (const adapter of this.adapters.values()) {
      try {
        const record = await adapter.getRecord(id);
        if (record) {
          return record;
        }
      } catch (error) {
        // 继续尝试下一个适配器
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<Record[]> {
    const adapter = this.getPrimaryAdapter();
    return await adapter.getAllRecords();
  }
  
  /**
   * 更新记录
   */
  async updateRecord(id: string, updates: Partial<Record>): Promise<void> {
    const adapter = this.getPrimaryAdapter();
    await adapter.updateRecord(id, updates);
  }
  
  /**
   * 删除记录
   */
  async deleteRecord(id: string): Promise<void> {
    // 从所有适配器中删除
    for (const adapter of this.adapters.values()) {
      try {
        await adapter.deleteRecord(id);
      } catch (error) {
        // 可能在某些适配器中不存在，继续
        continue;
      }
    }
  }
  
  /**
   * 保存媒体 - 根据大小和类型选择存储
   */
  async saveMedia(media: MediaData): Promise<string> {
    const adapter = this.selectAdapterForMedia(media);
    
    console.log(`🖼️ Saving media with ${adapter.name}:`, {
      id: media.id,
      type: media.type,
      size: `${(media.size / 1024).toFixed(2)} KB`,
    });
    
    return await adapter.saveMedia(media);
  }
  
  /**
   * 获取媒体
   */
  async getMedia(id: string): Promise<MediaData | null> {
    // 尝试从所有适配器中获取
    for (const adapter of this.adapters.values()) {
      if (!adapter.capabilities.supportsBinary) {
        continue;
      }
      
      try {
        const media = await adapter.getMedia(id);
        if (media) {
          return media;
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * 删除媒体
   */
  async deleteMedia(id: string): Promise<void> {
    for (const adapter of this.adapters.values()) {
      if (!adapter.capabilities.supportsBinary) {
        continue;
      }
      
      try {
        await adapter.deleteMedia(id);
      } catch (error) {
        continue;
      }
    }
  }
  
  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<StorageInfo> {
    const adapter = this.getPrimaryAdapter();
    return await adapter.getStorageInfo();
  }
  
  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.clear();
    }
    console.log('✅ Cleared all data from all adapters');
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [type, adapter] of this.adapters.entries()) {
      results[type] = await adapter.healthCheck();
    }
    
    return results;
  }
  
  /**
   * 迁移数据到新的存储方式
   */
  async migrateStorage(
    from: StorageType,
    to: StorageType,
    progressCallback?: MigrationProgressCallback
  ): Promise<void> {
    const fromAdapter = this.adapters.get(from);
    const toAdapter = this.adapters.get(to);
    
    if (!fromAdapter || !toAdapter) {
      throw new Error('Source or destination adapter not found');
    }
    
    console.log(`🔄 Migrating data from ${fromAdapter.name} to ${toAdapter.name}`);
    
    // 1. 获取所有记录
    const records = await fromAdapter.getAllRecords();
    const total = records.length;
    
    if (total === 0) {
      console.log('⚠️ No records to migrate');
      return;
    }
    
    // 2. 逐条迁移
    for (let i = 0; i < total; i++) {
      const record = records[i];
      
      // 迁移记录
      await toAdapter.saveRecord(record);
      
      // 迁移媒体文件（如果有）
      if (record.images && record.images.length > 0) {
        for (const media of record.images) {
          try {
            // 从源适配器获取完整的媒体数据
            const fullMedia = await fromAdapter.getMedia(media.id);
            if (fullMedia) {
              await toAdapter.saveMedia(fullMedia);
            }
          } catch (error) {
            console.warn(`Failed to migrate media ${media.id}:`, error);
          }
        }
      }
      
      // 进度回调
      if (progressCallback) {
        const current = i + 1;
        const percentage = Math.round((current / total) * 100);
        progressCallback({
          current,
          total,
          percentage,
          message: `Migrating record ${current}/${total}`,
        });
      }
    }
    
    console.log(`✅ Migration complete: ${total} records migrated`);
    
    // 3. 验证迁移
    const migratedRecords = await toAdapter.getAllRecords();
    if (migratedRecords.length !== total) {
      throw new Error('Migration verification failed: record count mismatch');
    }
    
    // 4. 可选：清空源存储
    // await fromAdapter.clear();
  }
  
  /**
   * 更新用户等级
   */
  updateUserTier(tier: UserTier): void {
    this.userTier = tier;
    this.currentStrategy = this.determineStrategy({
      ...this.config,
      userTier: tier,
    });
    
    console.log('📊 User tier updated:', {
      tier,
      strategy: this.currentStrategy,
    });
  }
  
  /**
   * 选择记录的存储适配器
   */
  private selectAdapterForRecord(record: Record): IStorageAdapter {
    // 策略 1: 如果是会员且启用了云端
    if (this.userTier === UserTier.Premium && this.config.enableCloud) {
      const cloudAdapter = this.adapters.get(StorageType.Cloud);
      if (cloudAdapter) {
        return cloudAdapter;
      }
    }
    
    // 策略 2: 根据记录大小选择
    const estimatedSize = this.estimateRecordSize(record);
    
    // 小记录用 LocalStorage（如果没有媒体）
    if (estimatedSize < 100 * 1024 && (!record.images || record.images.length === 0)) {
      const localAdapter = this.adapters.get(StorageType.LocalStorage);
      if (localAdapter) {
        return localAdapter;
      }
    }
    
    // 大记录或有媒体的记录用 IndexedDB
    const idbAdapter = this.adapters.get(StorageType.IndexedDB);
    if (idbAdapter) {
      return idbAdapter;
    }
    
    // 降级到主存储
    return this.getPrimaryAdapter();
  }
  
  /**
   * 选择媒体的存储适配器
   */
  private selectAdapterForMedia(media: MediaData): IStorageAdapter {
    // 媒体文件优先级：
    // 1. 云端（如果是会员）
    if (this.userTier === UserTier.Premium && this.config.enableCloud) {
      const cloudAdapter = this.adapters.get(StorageType.Cloud);
      if (cloudAdapter) {
        return cloudAdapter;
      }
    }
    
    // 2. IndexedDB（本地大文件）
    const idbAdapter = this.adapters.get(StorageType.IndexedDB);
    if (idbAdapter && idbAdapter.capabilities.supportsBinary) {
      return idbAdapter;
    }
    
    throw new Error('No suitable adapter found for media storage');
  }
  
  /**
   * 获取主存储适配器
   */
  private getPrimaryAdapter(): IStorageAdapter {
    const adapter = this.adapters.get(this.currentStrategy.primary);
    if (!adapter) {
      throw new Error(`Primary adapter not found: ${this.currentStrategy.primary}`);
    }
    return adapter;
  }
  
  /**
   * 估算记录大小
   */
  private estimateRecordSize(record: Record): number {
    // 简单估算：JSON 序列化后的大小
    return JSON.stringify(record).length;
  }
  
  /**
   * 确定存储策略
   */
  private determineStrategy(config: StorageConfig): StorageStrategy {
    // 会员用户：优先云端
    if (config.userTier === UserTier.Premium && config.enableCloud) {
      return {
        primary: StorageType.Cloud,
        fallback: StorageType.IndexedDB,
        syncEnabled: config.enableSync,
        autoMigrate: true,
      };
    }
    
    // 免费用户：IndexedDB 优先
    return {
      primary: StorageType.IndexedDB,
      fallback: StorageType.LocalStorage,
      syncEnabled: false,
      autoMigrate: false,
    };
  }
  
  /**
   * 云端同步（未来功能）
   */
  private async syncToCloud(record: Record): Promise<void> {
    const cloudAdapter = this.adapters.get(StorageType.Cloud);
    if (!cloudAdapter) {
      return;
    }
    
    try {
      await cloudAdapter.saveRecord(record);
      console.log('☁️ Synced to cloud:', record.id);
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      // 不抛出错误，云端同步失败不影响本地存储
    }
  }
}

