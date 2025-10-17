/**
 * Timeline 状态管理
 * 
 * 使用 Zustand + Immer
 * 
 * 特点：
 * - 规范化状态 (entities + ids)
 * - 乐观更新
 * - Memoized Selectors
 * - 自动持久化
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import timelineService from './service';
import {
  TimelineItem,
  TimelineItemType,
  ItemStatus,
  // FilterOptions,
  // PaginationOptions,
  AddItemData,
  GroupedItems,
} from './types';

// ============================================
// State 接口定义
// ============================================

interface TimelineState {
  // ===== State =====
  entities: Record<string, TimelineItem>;  // 规范化的实体存储
  ids: string[];                           // 排序后的ID列表
  loading: boolean;                        // 加载状态
  error: Error | null;                     // 错误状态
  
  // ===== 过滤和分页 =====
  filters: {
    type: TimelineItemType | null;
    dateRange: { start: string; end: string } | null;
    tags: string[];
    searchQuery: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  
  // ===== Actions =====
  
  /**
   * 加载项
   */
  loadItems: (options?: LoadOptions) => Promise<void>;
  
  /**
   * 加载更多
   */
  loadMore: () => Promise<void>;
  
  /**
   * 添加项
   */
  addItem: <T extends TimelineItemType>(
    type: T,
    data: AddItemData<T>
  ) => Promise<TimelineItem<T>>;
  
  /**
   * 更新项
   */
  updateItem: (
    id: string,
    updates: Partial<TimelineItem>
  ) => Promise<TimelineItem>;
  
  /**
   * 删除项
   */
  deleteItem: (id: string) => Promise<void>;
  
  /**
   * 设置过滤器
   */
  setFilters: (filters: Partial<TimelineState['filters']>) => void;
  
  /**
   * 搜索项
   */
  searchItems: (query: string) => Promise<void>;
  
  /**
   * 重置状态
   */
  reset: () => void;
  
  /**
   * 刷新数据
   */
  refresh: () => Promise<void>;
}

interface LoadOptions {
  skipCache?: boolean;
  resetPagination?: boolean;
}

// ============================================
// Store 创建
// ============================================

export const useTimelineStore = create<TimelineState>()(
  immer((set, get) => ({
    // ===== 初始状态 =====
    entities: {},
    ids: [],
    loading: false,
    error: null,
    filters: {
      type: null,
      dateRange: null,
      tags: [],
      searchQuery: '',
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    },
    
    // ===== Actions =====
    
    /**
     * 加载项
     */
    loadItems: async (options = {}) => {
      const { resetPagination = false } = options;
      
      // 如果正在加载，忽略
      if (get().loading) {
        return;
      }
      
      set(state => {
        state.loading = true;
        state.error = null;
        
        if (resetPagination) {
          state.pagination.page = 1;
          state.entities = {};
          state.ids = [];
        }
      });
      
      try {
        const { filters, pagination } = get();
        
        const result = await timelineService.getItems({
          filters: {
            type: filters.type || undefined,
            dateRange: filters.dateRange || undefined,
            tags: filters.tags.length > 0 ? filters.tags : undefined,
          },
          pagination,
        });
        
        set(state => {
          // 规范化数据
          result.items.forEach(item => {
            state.entities[item.id] = item;
          });
          
          // 如果是重置，替换IDs；否则追加
          if (resetPagination) {
            state.ids = result.items.map(item => item.id);
          } else {
            // 去重追加
            const newIds = result.items
              .map(item => item.id)
              .filter(id => !state.ids.includes(id));
            state.ids.push(...newIds);
          }
          
          state.pagination = result.pagination;
          state.loading = false;
        });
      } catch (error) {
        console.error('Failed to load timeline items:', error);
        set(state => {
          state.loading = false;
          state.error = error as Error;
        });
      }
    },
    
    /**
     * 加载更多
     */
    loadMore: async () => {
      const { pagination, loading } = get();
      
      if (loading || !pagination.hasMore) {
        return;
      }
      
      set(state => {
        state.pagination.page += 1;
      });
      
      await get().loadItems();
    },
    
    /**
     * 添加项 (乐观更新)
     */
    addItem: async <T extends TimelineItemType>(
      type: T,
      data: AddItemData<T>
    ) => {
      // 生成临时 ID
      const tempId = `temp_${Date.now()}`;
      const now = new Date();
      
      const tempItem: TimelineItem<T> = {
        id: tempId,
        type,
        createdAt: now,
        updatedAt: now,
        timestamp: now.getTime(),
        content: data.content as Record<string, unknown>,
        metadata: {
          title: data.title,
          excerpt: data.excerpt || '',
          mood: data.mood,
          isPinned: data.isPinned || false,
          ...data.metadata,
        },
        status: ItemStatus.ACTIVE,
        dateKey: now.toISOString().split('T')[0],
        tags: data.tags || [],
        searchText: '',
        version: 1,
        syncStatus: 'local_only' as const,
        deviceId: '',
      };
      
      // 乐观更新：立即添加到状态
      set(state => {
        state.entities[tempId] = tempItem;
        state.ids.unshift(tempId); // 添加到最前面
        state.pagination.total += 1;
      });
      
      try {
        // 实际保存到数据库
        const savedItem = await timelineService.addItem(type, data);
        
        // 替换临时项
        set(state => {
          delete state.entities[tempId];
          state.entities[savedItem.id] = savedItem;
          state.ids = state.ids.map(id => (id === tempId ? savedItem.id : id));
        });
        
        return savedItem;
      } catch (error) {
        console.error('Failed to add timeline item:', error);
        
        // 回滚：移除临时项
        set(state => {
          delete state.entities[tempId];
          state.ids = state.ids.filter(id => id !== tempId);
          state.pagination.total -= 1;
          state.error = error as Error;
        });
        
        throw error;
      }
    },
    
    /**
     * 更新项 (乐观更新)
     */
    updateItem: async (id, updates) => {
      const original = get().entities[id];
      
      if (!original) {
        throw new Error(`Item not found: ${id}`);
      }
      
      // 乐观更新：立即更新状态
      set(state => {
        if (state.entities[id]) {
          state.entities[id] = {
            ...state.entities[id],
            ...updates,
            updatedAt: new Date(),
          };
        }
      });
      
      try {
        // 实际保存到数据库
        const updated = await timelineService.updateItem(id, updates);
        
        // 使用服务器返回的数据
        set(state => {
          state.entities[id] = updated;
        });
        
        return updated;
      } catch (error) {
        console.error('Failed to update timeline item:', error);
        
        // 回滚：恢复原始数据
        set(state => {
          state.entities[id] = original;
          state.error = error as Error;
        });
        
        throw error;
      }
    },
    
    /**
     * 删除项 (乐观更新)
     */
    deleteItem: async (id) => {
      const original = get().entities[id];
      
      if (!original) {
        throw new Error(`Item not found: ${id}`);
      }
      
      // 乐观更新：立即从状态移除
      set(state => {
        delete state.entities[id];
        state.ids = state.ids.filter(itemId => itemId !== id);
        state.pagination.total -= 1;
      });
      
      try {
        // 实际删除（软删除）
        await timelineService.deleteItem(id);
      } catch (error) {
        console.error('Failed to delete timeline item:', error);
        
        // 回滚：恢复项
        set(state => {
          state.entities[id] = original;
          state.ids.push(id);
          // 重新排序
          state.ids.sort(
            (a, b) => state.entities[b].timestamp - state.entities[a].timestamp
          );
          state.pagination.total += 1;
          state.error = error as Error;
        });
        
        throw error;
      }
    },
    
    /**
     * 设置过滤器
     */
    setFilters: (filters) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.page = 1; // 重置页码
      });
      
      // 重新加载数据
      get().loadItems({ resetPagination: true });
    },
    
    /**
     * 搜索项
     */
    searchItems: async (query) => {
      set(state => {
        state.filters.searchQuery = query;
        state.loading = true;
        state.error = null;
      });
      
      try {
        if (!query || query.trim().length === 0) {
          // 如果查询为空，重新加载所有项
          await get().loadItems({ resetPagination: true });
          return;
        }
        
        const items = await timelineService.searchItems(query);
        
        set(state => {
          // 清空现有数据
          state.entities = {};
          state.ids = [];
          
          // 添加搜索结果
          items.forEach(item => {
            state.entities[item.id] = item;
            state.ids.push(item.id);
          });
          
          state.pagination = {
            page: 1,
            pageSize: items.length,
            total: items.length,
            hasMore: false,
          };
          
          state.loading = false;
        });
      } catch (error) {
        console.error('Failed to search timeline items:', error);
        set(state => {
          state.loading = false;
          state.error = error as Error;
        });
      }
    },
    
    /**
     * 刷新数据
     */
    refresh: async () => {
      await get().loadItems({ resetPagination: true });
    },
    
    /**
     * 重置状态
     */
    reset: () => {
      set({
        entities: {},
        ids: [],
        loading: false,
        error: null,
        filters: {
          type: null,
          dateRange: null,
          tags: [],
          searchQuery: '',
        },
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      });
    },
  }))
);

// ============================================
// Selectors (Memoized)
// ============================================

/**
 * 选择可见项
 */
export const selectVisibleItems = (state: TimelineState): TimelineItem[] => {
  return state.ids.map(id => state.entities[id]).filter(Boolean);
};

/**
 * 按日期分组 (Memoized)
 */
export const selectGroupedByDate = (state: TimelineState): GroupedItems => {
  const items = selectVisibleItems(state);
  
  // 如果没有任何项，返回空 Map
  if (items.length === 0) {
    return new Map();
  }
  
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
  
  // 排序日期（最新在前）
  const sorted = Array.from(grouped.entries()).sort(
    ([dateA], [dateB]) => dateB.localeCompare(dateA)
  );
  
  return new Map(sorted);
};

/**
 * 按类型筛选
 */
export const selectItemsByType = (
  state: TimelineState,
  type: TimelineItemType
): TimelineItem[] => {
  return selectVisibleItems(state).filter(item => item.type === type);
};

/**
 * 获取单个项
 */
export const selectItemById = (
  state: TimelineState,
  id: string
): TimelineItem | undefined => {
  return state.entities[id];
};

// ============================================
// 导出
// ============================================

export default useTimelineStore;

