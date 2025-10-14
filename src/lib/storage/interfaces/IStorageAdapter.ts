/**
 * 存储适配器抽象接口
 * 所有存储实现必须遵循此接口
 */

import { Record, MediaData, StorageCapabilities, StorageInfo } from './types';

export interface IStorageAdapter {
  /**
   * 适配器名称（用于日志和调试）
   */
  readonly name: string;
  
  /**
   * 存储能力描述
   */
  readonly capabilities: StorageCapabilities;
  
  /**
   * 初始化存储
   * @throws {Error} 如果初始化失败
   */
  initialize(): Promise<void>;
  
  /**
   * 保存单条记录
   * @param record - 要保存的记录
   * @throws {Error} 如果保存失败
   */
  saveRecord(record: Record): Promise<void>;
  
  /**
   * 批量保存记录
   * @param records - 要保存的记录数组
   * @throws {Error} 如果保存失败
   */
  saveRecords(records: Record[]): Promise<void>;
  
  /**
   * 获取单条记录
   * @param id - 记录ID
   * @returns 记录或null（如果不存在）
   */
  getRecord(id: string): Promise<Record | null>;
  
  /**
   * 获取所有记录
   * @returns 所有记录的数组
   */
  getAllRecords(): Promise<Record[]>;
  
  /**
   * 更新记录
   * @param id - 记录ID
   * @param updates - 要更新的字段
   * @throws {Error} 如果记录不存在或更新失败
   */
  updateRecord(id: string, updates: Partial<Record>): Promise<void>;
  
  /**
   * 删除记录
   * @param id - 记录ID
   * @throws {Error} 如果删除失败
   */
  deleteRecord(id: string): Promise<void>;
  
  /**
   * 保存媒体文件
   * @param media - 媒体数据
   * @returns 媒体文件的访问标识（ID、URL等）
   * @throws {Error} 如果保存失败
   */
  saveMedia(media: MediaData): Promise<string>;
  
  /**
   * 获取媒体文件
   * @param id - 媒体ID
   * @returns 媒体数据或null（如果不存在）
   */
  getMedia(id: string): Promise<MediaData | null>;
  
  /**
   * 删除媒体文件
   * @param id - 媒体ID
   * @throws {Error} 如果删除失败
   */
  deleteMedia(id: string): Promise<void>;
  
  /**
   * 获取存储使用情况
   * @returns 存储信息
   */
  getStorageInfo(): Promise<StorageInfo>;
  
  /**
   * 清空所有数据
   * @throws {Error} 如果清空失败
   */
  clear(): Promise<void>;
  
  /**
   * 健康检查
   * @returns 存储是否正常
   */
  healthCheck(): Promise<boolean>;
}

