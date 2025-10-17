/**
 * Timeline 统一数据库
 * 
 * 使用 Dexie.js 封装 IndexedDB
 * 
 * 特点：
 * - 单一数据表 (items)
 * - 多索引支持快速查询
 * - 为云同步预留字段
 * - 支持全文搜索
 */

import Dexie, { Table } from 'dexie';
import {
  TimelineItem,
  TimelineItemType,
  ItemStatus,
  SyncStatus,
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from './types';

/**
 * Timeline 数据库类
 */
export class UnifiedTimelineDB extends Dexie {
  items!: Table<TimelineItem, string>;
  
  constructor() {
    super('UnifiedTimelineDB');
    
    // 定义数据库结构
    this.version(1).stores({
      items: `
        id,
        type,
        timestamp,
        dateKey,
        status,
        syncStatus,
        deviceId,
        [type+timestamp],
        [dateKey+timestamp],
        [status+timestamp],
        [syncStatus+updatedAt],
        searchText
      `.replace(/\s/g, ''),
    });
  }
  
  /**
   * 获取活跃项
   */
  async getActiveItems(options: QueryOptions = {}): Promise<TimelineItem[]> {
    try {
      let collection = this.items.where('status').equals(ItemStatus.ACTIVE);
      
      // 按类型过滤
      if (options.type) {
        collection = this.items
          .where('[type+timestamp]')
          .between(
            [options.type, Dexie.minKey],
            [options.type, Dexie.maxKey]
          );
      }
      
      // 按日期范围过滤
      if (options.dateRange) {
        const items = await this.items
          .where('dateKey')
          .between(
            options.dateRange.start,
            options.dateRange.end,
            true,
            true
          )
          .and(item => item.status === ItemStatus.ACTIVE)
          .toArray();
        
        // 按时间倒序排序
        items.sort((a, b) => b.timestamp - a.timestamp);
        
        // 应用分页
        if (options.offset !== undefined && options.limit !== undefined) {
          return items.slice(options.offset, options.offset + options.limit);
        }
        
        return items;
      }
      
      // 按时间倒序
      collection = collection.reverse();
      
      // 分页
      if (options.offset !== undefined && options.limit !== undefined) {
        collection = collection.offset(options.offset).limit(options.limit);
      }
      
      return await collection.toArray();
    } catch (error) {
      console.error('Failed to get active timeline items:', error);
      throw error;
    }
  }
  
  /**
   * 计数活跃项
   */
  async countActiveItems(options: QueryOptions = {}): Promise<number> {
    try {
      if (options.type) {
        return await this.items
          .where('[type+status]')
          .equals([options.type, ItemStatus.ACTIVE])
          .count();
      }
      
      if (options.dateRange) {
        return await this.items
          .where('dateKey')
          .between(
            options.dateRange.start,
            options.dateRange.end,
            true,
            true
          )
          .and(item => item.status === ItemStatus.ACTIVE)
          .count();
      }
      
      return await this.items
        .where('status')
        .equals(ItemStatus.ACTIVE)
        .count();
    } catch (error) {
      console.error('Failed to count active timeline items:', error);
      return 0;
    }
  }
  
  /**
   * 全文搜索
   */
  async search(query: string): Promise<TimelineItem[]> {
    try {
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) {
        return [];
      }
      
      // 使用 filter 进行全文搜索
      return await this.items
        .filter(item => 
          item.status === ItemStatus.ACTIVE &&
          item.searchText.includes(searchTerm)
        )
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to search timeline items:', error);
      return [];
    }
  }
  
  /**
   * 获取项 (单个)
   */
  async getItem(id: string): Promise<TimelineItem | undefined> {
    try {
      return await this.items.get(id);
    } catch (error) {
      console.error('Failed to get timeline item:', error);
      return undefined;
    }
  }
  
  /**
   * 添加项
   */
  async addItem(item: TimelineItem): Promise<void> {
    try {
      await this.items.add(item);
    } catch (error) {
      console.error('Failed to add timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 更新项
   */
  async updateItem(id: string, updates: Partial<TimelineItem>): Promise<void> {
    try {
      await this.items.update(id, updates);
    } catch (error) {
      console.error('Failed to update timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 保存或更新项 (upsert)
   */
  async putItem(item: TimelineItem): Promise<void> {
    try {
      await this.items.put(item);
    } catch (error) {
      console.error('Failed to save timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 删除项 (硬删除)
   */
  async deleteItem(id: string): Promise<void> {
    try {
      await this.items.delete(id);
    } catch (error) {
      console.error('Failed to delete timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 软删除项
   */
  async softDeleteItem(id: string): Promise<void> {
    try {
      await this.updateItem(id, {
        status: ItemStatus.DELETED,
        updatedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
      });
    } catch (error) {
      console.error('Failed to soft delete timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 批量获取
   */
  async bulkGet(ids: string[]): Promise<(TimelineItem | undefined)[]> {
    try {
      return await this.items.bulkGet(ids);
    } catch (error) {
      console.error('Failed to bulk get timeline items:', error);
      return [];
    }
  }
  
  /**
   * 批量添加
   */
  async bulkAdd(items: TimelineItem[]): Promise<void> {
    try {
      await this.items.bulkAdd(items);
    } catch (error) {
      console.error('Failed to bulk add timeline items:', error);
      throw error;
    }
  }
  
  /**
   * 批量更新
   */
  async bulkUpdate(updates: Array<{ id: string; changes: Partial<TimelineItem> }>): Promise<void> {
    try {
      await this.transaction('rw', this.items, async () => {
        for (const { id, changes } of updates) {
          await this.items.update(id, changes);
        }
      });
    } catch (error) {
      console.error('Failed to bulk update timeline items:', error);
      throw error;
    }
  }
  
  /**
   * 按日期范围获取
   */
  async getByDateRange(startKey: string, endKey: string): Promise<TimelineItem[]> {
    try {
      const items = await this.items
        .where('dateKey')
        .between(startKey, endKey, true, true)
        .and(item => item.status === ItemStatus.ACTIVE)
        .toArray();
      
      // 按时间倒序排序
      items.sort((a, b) => b.timestamp - a.timestamp);
      
      return items;
    } catch (error) {
      console.error('Failed to get timeline items by date range:', error);
      return [];
    }
  }
  
  // ===== 云同步相关 (预留) =====
  
  /**
   * 获取未同步的项
   */
  async getUnsyncedItems(): Promise<TimelineItem[]> {
    try {
      return await this.items
        .where('syncStatus')
        .equals(SyncStatus.PENDING)
        .toArray();
    } catch (error) {
      console.error('Failed to get unsynced timeline items:', error);
      return [];
    }
  }
  
  /**
   * 批量更新同步状态
   */
  async batchUpdateSyncStatus(
    ids: string[],
    syncStatus: SyncStatus,
    syncedAt?: Date
  ): Promise<void> {
    try {
      await this.transaction('rw', this.items, async () => {
        for (const id of ids) {
          const item = await this.items.get(id);
          if (item) {
            await this.items.update(id, {
              syncStatus,
              syncedAt,
              version: item.version + 1,
            });
          }
        }
      });
    } catch (error) {
      console.error('Failed to update sync status:', error);
      throw error;
    }
  }
  
  // ===== 维护操作 =====
  
  /**
   * 清空数据库 (谨慎使用)
   */
  async clearAll(): Promise<void> {
    try {
      await this.items.clear();
    } catch (error) {
      console.error('Failed to clear timeline database:', error);
      throw error;
    }
  }
  
  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<TimelineItemType, number>;
    byStatus: Record<ItemStatus, number>;
  }> {
    try {
      const items = await this.items.toArray();
      
      const stats = {
        total: items.length,
        byType: {} as Record<TimelineItemType, number>,
        byStatus: {} as Record<ItemStatus, number>,
      };
      
      // 初始化计数器
      Object.values(TimelineItemType).forEach(type => {
        stats.byType[type] = 0;
      });
      Object.values(ItemStatus).forEach(status => {
        stats.byStatus[status] = 0;
      });
      
      // 统计
      items.forEach(item => {
        stats.byType[item.type]++;
        stats.byStatus[item.status]++;
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get timeline stats:', error);
      return {
        total: 0,
        byType: {} as Record<TimelineItemType, number>,
        byStatus: {} as Record<ItemStatus, number>,
      };
    }
  }
}

// 创建数据库实例 (单例)
export const timelineDB = new UnifiedTimelineDB();

// 确保数据库正确初始化
timelineDB.open().catch(error => {
  console.error('Failed to open timeline database:', error);
});

// 导出数据库实例
export default timelineDB;

