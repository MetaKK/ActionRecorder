"use client";

import { StorageFactory, type CloudStorageAdapter } from "./cloud-storage";

/**
 * 存储配置管理
 * 支持运行时切换存储模式
 */
export interface StorageConfig {
  type: "local" | "cloud" | "hybrid";
  cloudApiUrl?: string;
  syncInterval?: number; // 同步间隔(毫秒)
  maxRetries?: number;   // 最大重试次数
  enableOfflineMode?: boolean; // 离线模式
}

/**
 * 存储配置管理器
 */
export class StorageConfigManager {
  private config: StorageConfig;
  private adapter: CloudStorageAdapter;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(initialConfig: StorageConfig) {
    this.config = initialConfig;
    this.adapter = StorageFactory.createAdapter(this.config);
    this.startSyncTimer();
  }

  /**
   * 更新存储配置
   */
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 重新创建适配器
    this.adapter = StorageFactory.createAdapter(this.config);
    
    // 重启同步定时器
    this.stopSyncTimer();
    this.startSyncTimer();
  }

  /**
   * 获取当前配置
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * 获取存储适配器
   */
  getAdapter(): CloudStorageAdapter {
    return this.adapter;
  }

  /**
   * 启动同步定时器
   */
  private startSyncTimer(): void {
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.syncTimer = setInterval(async () => {
        try {
          await this.adapter.syncToCloud();
        } catch (error) {
          console.error("Auto sync failed:", error);
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * 停止同步定时器
   */
  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 手动同步
   */
  async sync(): Promise<boolean> {
    try {
      return await this.adapter.syncToCloud();
    } catch (error) {
      console.error("Manual sync failed:", error);
      return false;
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopSyncTimer();
  }
}

/**
 * 默认配置
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  type: "local", // 默认本地存储
  syncInterval: 0, // 不自动同步
  maxRetries: 3,
  enableOfflineMode: true,
};

/**
 * 云存储配置
 */
export const CLOUD_STORAGE_CONFIG: StorageConfig = {
  type: "cloud",
  cloudApiUrl: "/api/cloud",
  syncInterval: 30000, // 30秒同步一次
  maxRetries: 3,
  enableOfflineMode: false,
};

/**
 * 混合存储配置
 */
export const HYBRID_STORAGE_CONFIG: StorageConfig = {
  type: "hybrid",
  cloudApiUrl: "/api/cloud",
  syncInterval: 60000, // 1分钟同步一次
  maxRetries: 3,
  enableOfflineMode: true,
};

/**
 * 全局存储配置实例
 */
let globalStorageConfig: StorageConfigManager | null = null;

/**
 * 初始化存储配置
 */
export function initStorageConfig(config: StorageConfig = DEFAULT_STORAGE_CONFIG): StorageConfigManager {
  if (globalStorageConfig) {
    globalStorageConfig.destroy();
  }
  
  globalStorageConfig = new StorageConfigManager(config);
  return globalStorageConfig;
}

/**
 * 获取全局存储配置
 */
export function getStorageConfig(): StorageConfigManager | null {
  return globalStorageConfig;
}

/**
 * 获取存储适配器
 */
export function getStorageAdapter(): CloudStorageAdapter | null {
  return globalStorageConfig?.getAdapter() || null;
}

/**
 * 根据环境自动选择存储配置
 */
export function getAutoStorageConfig(): StorageConfig {
  // 检查是否在云端环境
  const isCloudEnvironment = process.env.NODE_ENV === "production" && 
    typeof window !== "undefined" && 
    window.location.hostname !== "localhost";

  // 检查是否有云端API
  const hasCloudAPI = typeof window !== "undefined" && 
    window.location.pathname.includes("/api/");

  if (isCloudEnvironment && hasCloudAPI) {
    return CLOUD_STORAGE_CONFIG;
  } else if (hasCloudAPI) {
    return HYBRID_STORAGE_CONFIG;
  } else {
    return DEFAULT_STORAGE_CONFIG;
  }
}
