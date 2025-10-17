/**
 * Timeline 服务
 * 
 * 职责：
 * 1. 统一的数据访问接口
 * 2. 业务逻辑封装
 * 3. 缓存管理
 * 4. 事件发布
 */

import { EventEmitter } from 'events';
import { LRUCache } from 'lru-cache';
import timelineDB from './db';
import {
  TimelineItem,
  TimelineItemType,
  ItemStatus,
  SyncStatus,
  GetItemsOptions,
  PaginatedResult,
  AddItemData,
  GroupedItems,
  RecordContent,
  DiaryContent,
  TimelineItemMetadata,
  TiptapDocument,
} from './types';

/**
 * Timeline 服务类
 */
export class TimelineService extends EventEmitter {
  private cache: LRUCache<string, TimelineItem>;
  private deviceId: string;
  
  constructor() {
    super();
    
    // 初始化缓存 (最多缓存 500 项)
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5, // 5 分钟过期
    });
    
    // 获取或创建设备ID
    this.deviceId = this.getOrCreateDeviceId();
  }
  
  /**
   * 获取项 (支持过滤、排序、分页)
   */
  async getItems(options: GetItemsOptions = {}): Promise<PaginatedResult<TimelineItem>> {
    const {
      filters = {},
      sort = { by: 'timestamp', order: 'desc' },
      pagination = { page: 1, pageSize: 20 },
    } = options;
    
    try {
      // 计算偏移量
      const offset = (pagination.page - 1) * pagination.pageSize;
      
      // 查询数据库
      const items = await timelineDB.getActiveItems({
        type: filters.type,
        dateRange: filters.dateRange,
        offset,
        limit: pagination.pageSize,
      });
      
      // 计算总数
      const total = await timelineDB.countActiveItems({
        type: filters.type,
        dateRange: filters.dateRange,
      });
      
      // 更新缓存
          // 更新缓存
          items.forEach(item => {
            this.cache.set(item.id, item);
          });
          
          return {
        items,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total,
          totalPages: Math.ceil(total / pagination.pageSize),
            hasMore: offset + items.length < total,
          },
        };
      } catch (error) {
        console.error('Failed to get timeline items:', error);
        throw error;
    }
  }
  
  /**
   * 获取单个项
   */
  async getItem(id: string): Promise<TimelineItem | null> {
    // 先从缓存获取
    let item = this.cache.get(id);
    if (item) {
      return item;
    }
    
    // 从数据库获取
    item = await timelineDB.getItem(id);
    if (item && item.status !== ItemStatus.DELETED) {
      this.cache.set(id, item);
      return item;
    }
    
    return null;
  }
  
  /**
   * 添加项 (统一接口)
   */
  async addItem<T extends TimelineItemType>(
    type: T,
    data: AddItemData<T>
  ): Promise<TimelineItem<T>> {
    try {
      // 1. 验证数据
      this.validateItemData(type, data);
      
      // 2. 创建 TimelineItem
      const now = new Date();
      const item: TimelineItem<T> = {
        id: this.generateId(),
        type,
        createdAt: now,
        updatedAt: now,
        timestamp: now.getTime(),
        content: data.content as Record<string, unknown>,
        metadata: {
          title: data.title,
          excerpt: data.excerpt || this.generateExcerpt(data.content),
          mood: data.mood,
          isPinned: data.isPinned || false,
          ...this.extractMetadata(type, data),
        },
        status: ItemStatus.ACTIVE,
        dateKey: this.getDateKey(now),
        tags: data.tags || [],
        searchText: this.buildSearchText(type, data),
        version: 1,
        syncStatus: SyncStatus.LOCAL_ONLY,
        deviceId: this.deviceId,
      };
      
      // 3. 保存到数据库
      await timelineDB.addItem(item);
      
      // 4. 更新缓存
      this.cache.set(item.id, item);
      
      // 5. 触发事件
      this.emit('itemAdded', item);
      
      return item;
    } catch (error) {
      console.error('Failed to add timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 更新项
   */
  async updateItem(
    id: string,
    updates: Partial<TimelineItem>
  ): Promise<TimelineItem> {
    try {
      // 1. 获取现有项
      const existing = await this.getItem(id);
      if (!existing) {
        throw new Error(`Item not found: ${id}`);
      }
      
      // 2. 合并更新
      const updated: TimelineItem = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        version: existing.version + 1,
        // 如果内容变化，更新搜索文本
        searchText: updates.content
          ? this.buildSearchText(existing.type, { ...existing, content: updates.content })
          : existing.searchText,
        // 如果本地修改，标记为待同步
        syncStatus: SyncStatus.PENDING,
      };
      
      // 3. 保存
      await timelineDB.putItem(updated);
      
      // 4. 更新缓存
      this.cache.set(id, updated);
      
      // 5. 触发事件
      this.emit('itemUpdated', updated);
      
      return updated;
    } catch (error) {
      console.error('Failed to update timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 删除项 (软删除)
   */
  async deleteItem(id: string): Promise<void> {
    try {
      await timelineDB.softDeleteItem(id);
      
      // 从缓存移除
      this.cache.delete(id);
      
      this.emit('itemDeleted', id);
    } catch (error) {
      console.error('Failed to delete timeline item:', error);
      throw error;
    }
  }
  
  /**
   * 搜索项
   */
  async searchItems(query: string): Promise<TimelineItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
      try {
        return await timelineDB.search(query.trim());
      } catch (error) {
        console.error('Failed to search timeline items:', error);
        return [];
    }
  }
  
  /**
   * 按日期范围获取项
   */
  async getItemsByDateRange(start: Date, end: Date): Promise<GroupedItems> {
    try {
      const items = await timelineDB.getByDateRange(
        this.getDateKey(start),
        this.getDateKey(end)
      );
      
      return this.groupByDate(items);
    } catch (error) {
      console.error('Failed to get timeline items by date range:', error);
      return new Map();
    }
  }
  
  // ===== 私有方法 =====
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `timeline_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * 获取日期键 (YYYY-MM-DD)
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * 获取或创建设备ID
   */
  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
  
  /**
   * 验证数据
   */
  private validateItemData<T extends TimelineItemType>(
    type: T,
    data: AddItemData<T>
  ): void {
    if (!data.content) {
      throw new Error('Content is required');
    }
    
    // 类型特定验证
    switch (type) {
      case TimelineItemType.RECORD:
        const recordContent = data.content as RecordContent;
        if (!recordContent.text || recordContent.text.trim().length === 0) {
          throw new Error('Record text is required');
        }
        break;
        
      case TimelineItemType.DIARY:
        const diaryContent = data.content as DiaryContent;
        if (!diaryContent.document) {
          throw new Error('Diary document is required');
        }
        break;
    }
  }
  
  /**
   * 提取元数据
   */
  private extractMetadata<T extends TimelineItemType>(
    type: T,
    data: AddItemData<T>
  ): Partial<TimelineItemMetadata> {
    const metadata: Partial<TimelineItemMetadata> = {};
    
    switch (type) {
      case TimelineItemType.RECORD:
        const recordContent = data.content as RecordContent;
        metadata.hasAudio = !!recordContent.audioData;
        metadata.hasImages = !!recordContent.images?.length;
        metadata.hasVideo = recordContent.images?.some(img => img.type === 'video') || false;
        metadata.location = recordContent.location;
        break;
        
      case TimelineItemType.DIARY:
        const diaryContent = data.content as DiaryContent;
        metadata.wordCount = this.countWords(diaryContent.document);
        metadata.hasImages = !!diaryContent.images?.length;
        break;
    }
    
    return metadata;
  }
  
  /**
   * 生成摘要
   */
  private generateExcerpt(content: unknown): string {
    if (typeof content === 'string') {
      return content.slice(0, 100);
    }
    
    if (content && typeof content === 'object') {
      // Record 类型
      if ('text' in content && content.text) {
        return content.text.slice(0, 100);
      }
      
      // Diary 类型
      if ('document' in content && content.document) {
        return this.extractTextFromTiptap(content.document).slice(0, 100);
      }
    }
    
    return '';
  }
  
  /**
   * 构建搜索文本
   */
  private buildSearchText<T extends TimelineItemType>(
    type: T,
    data: AddItemData<T> | (TimelineItem & { content: Record<string, unknown> })
  ): string {
    const parts: string[] = [];
    
    // 添加标题、摘要、标签
    if ('title' in data && data.title) parts.push(data.title);
    if ('excerpt' in data && data.excerpt) parts.push(data.excerpt);
    if ('tags' in data && data.tags) parts.push(...data.tags);
    
    // 提取内容文本
    const content = data.content;
    
    if (type === TimelineItemType.RECORD) {
      const recordContent = content as RecordContent;
      if (recordContent.text) parts.push(recordContent.text);
    } else if (type === TimelineItemType.DIARY) {
      const diaryContent = content as DiaryContent;
      if (diaryContent.document) {
        parts.push(this.extractTextFromTiptap(diaryContent.document));
      }
    }
    
    return parts.join(' ').toLowerCase();
  }
  
  /**
   * 从 Tiptap 文档提取文本
   */
  private extractTextFromTiptap(doc: TiptapDocument): string {
    const extractText = (node: unknown): string => {
      if (!node) return '';
      
      if (typeof node === 'object' && node !== null) {
        const nodeObj = node as { text?: string; content?: unknown[] };
        
        if (nodeObj.text) {
          return nodeObj.text;
        }
        
        if (nodeObj.content && Array.isArray(nodeObj.content)) {
          return nodeObj.content.map(extractText).join(' ');
        }
      }
      
      return '';
    };
    
    return extractText(doc);
  }
  
  /**
   * 统计字数
   */
  private countWords(doc: TiptapDocument): number {
    const text = this.extractTextFromTiptap(doc);
    return text.split(/\s+/).filter(Boolean).length;
  }
  
  /**
   * 按日期分组
   */
  private groupByDate(items: TimelineItem[]): GroupedItems {
    const grouped = new Map<string, TimelineItem[]>();
    
    items.forEach(item => {
      const dateKey = item.dateKey;
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(item);
    });
    
    // 对每一天的项进行排序
    grouped.forEach(dayItems => {
      dayItems.sort((a, b) => {
        // 置顶项在前
        if (a.metadata.isPinned && !b.metadata.isPinned) return -1;
        if (!a.metadata.isPinned && b.metadata.isPinned) return 1;
        // 按时间倒序
        return b.timestamp - a.timestamp;
      });
    });
    
    return grouped;
  }
}

// 创建服务实例 (单例)
export const timelineService = new TimelineService();

// 导出服务实例
export default timelineService;

