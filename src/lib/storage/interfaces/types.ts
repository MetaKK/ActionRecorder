/**
 * 存储系统 - 通用类型定义
 */

import { Record, MediaData } from '@/lib/types';

/**
 * 存储类型枚举
 */
export enum StorageType {
  LocalStorage = 'localStorage',
  IndexedDB = 'indexedDB',
  Cloud = 'cloud',
  Hybrid = 'hybrid',
}

/**
 * 用户等级
 */
export enum UserTier {
  Free = 'free',           // 免费用户
  Premium = 'premium',     // 会员用户
  Enterprise = 'enterprise', // 企业用户
}

/**
 * 存储能力描述
 */
export interface StorageCapabilities {
  maxRecordSize: number;        // 单条记录最大大小（字节）
  maxMediaSize: number;          // 单个媒体文件最大大小（字节）
  maxTotalSize: number;          // 总存储空间（字节）
  supportsBinary: boolean;       // 是否支持二进制数据
  supportsSync: boolean;         // 是否支持云端同步
  requiresAuth: boolean;         // 是否需要认证
  requiresNetwork: boolean;      // 是否需要网络
}

/**
 * 存储使用情况
 */
export interface StorageInfo {
  totalRecords: number;          // 总记录数
  totalSize: number;             // 总大小（字节）
  usedSize: number;              // 已使用大小（字节）
  availableSize: number;         // 可用大小（字节）
  mediaCount: number;            // 媒体文件数量
  lastSync?: Date;               // 最后同步时间（云端）
}

/**
 * 存储策略配置
 */
export interface StorageStrategy {
  primary: StorageType;          // 主存储
  fallback?: StorageType;        // 降级存储
  syncEnabled: boolean;          // 是否启用同步
  autoMigrate: boolean;          // 是否自动迁移
}

/**
 * 存储管理器配置
 */
export interface StorageConfig {
  userTier: UserTier;            // 用户等级
  enableCloud: boolean;          // 是否启用云端
  enableSync: boolean;           // 是否启用同步
  maxLocalSize: number;          // 本地最大存储（字节）
  syncInterval?: number;         // 同步间隔（毫秒）
}

/**
 * 媒体存储记录（IndexedDB 专用）
 */
export interface MediaRecord {
  id: string;
  type: 'image' | 'video';
  blob: Blob;                    // 二进制数据
  width: number;
  height: number;
  size: number;
  mimeType: string;
  duration?: number;             // 视频时长
  thumbnail?: string;            // 缩略图（Base64）
  recordId?: string;             // 关联的记录ID
  createdAt: Date;
}

/**
 * 迁移进度回调
 */
export type MigrationProgressCallback = (progress: {
  current: number;
  total: number;
  percentage: number;
  message: string;
}) => void;

/**
 * 同步状态
 */
export enum SyncStatus {
  Idle = 'idle',
  Syncing = 'syncing',
  Success = 'success',
  Error = 'error',
}

/**
 * 同步结果
 */
export interface SyncResult {
  status: SyncStatus;
  uploadedRecords: number;
  uploadedMedia: number;
  errors: Error[];
  timestamp: Date;
}

// Re-export types from main types for convenience
export type { Record, MediaData };

