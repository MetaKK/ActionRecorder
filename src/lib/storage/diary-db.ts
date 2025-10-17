/**
 * 日记数据库 - IndexedDB 封装
 * 
 * 技术选型理由：
 * 1. 大容量：支持 50MB+ 甚至更多数据
 * 2. 异步操作：不阻塞 UI 渲染
 * 3. 复杂查询：支持索引和多维度查询
 * 4. 二进制支持：可存储图片等媒体文件
 * 5. 事务支持：数据一致性保证
 * 
 * 业内最佳实践：
 * - 使用 Dexie.js 库简化 IndexedDB 操作
 * - 版本控制和迁移策略
 * - 错误处理和降级方案
 */

import Dexie, { Table } from 'dexie';
import { Diary, DiaryPreview } from '@/lib/ai/diary/types';

/**
 * 日记数据库表结构
 */
export interface DiaryRecord {
  id: string;                    // 主键：diary_uuid
  date: string;                  // 日期：2025-10-17（索引）
  diary: Diary;                  // 完整日记对象
  createdAt: number;             // 创建时间戳（索引，用于排序）
  updatedAt: number;             // 更新时间戳
  mood?: string;                 // 情绪标签（索引）
  wordCount: number;             // 字数（索引）
  type: string;                  // 日记类型（索引）
  tags?: string[];               // 自定义标签
  excerpt: string;               // 摘要（用于列表显示）
  title?: string;                // 标题
  isDeleted: boolean;            // 软删除标记
  isPinned: boolean;             // 是否置顶（索引）
}

/**
 * 日记数据库类
 */
class DiaryDatabase extends Dexie {
  diaries!: Table<DiaryRecord, string>;

  constructor() {
    super('LifeRecorderDB');
    
    // 定义数据库版本和表结构
    // v1: 原始版本
    this.version(1).stores({
      diaries: 'id, date, createdAt, mood, wordCount, isDeleted',
    });
    
    // v2: 支持多篇日记、类型、置顶等功能
    this.version(2).stores({
      diaries: 'id, date, createdAt, mood, wordCount, type, isDeleted, isPinned, [date+createdAt]',
    }).upgrade(async (tx) => {
      // 升级现有记录，添加新字段
      const diaries = await tx.table('diaries').toArray();
      for (const record of diaries) {
        await tx.table('diaries').update(record.id, {
          type: 'auto',
          isPinned: false,
        });
      }
    });
  }
}

// 创建数据库实例
const db = new DiaryDatabase();

// 确保数据库正确初始化
db.open().catch(error => {
  console.error('❌ Failed to open database:', error);
});

/**
 * 保存日记
 */
export async function saveDiary(diary: Diary): Promise<void> {
  try {
    // 数据验证
    if (!diary || !diary.metadata) {
      throw new Error('日记数据无效');
    }
    
    if (!diary.metadata.id || !diary.metadata.date) {
      throw new Error('日记缺少必要字段');
    }

    const record: DiaryRecord = {
      id: diary.metadata.id,
      date: diary.metadata.date,
      diary: diary,
      createdAt: new Date(diary.metadata.createdAt || diary.metadata.generatedAt).getTime(),
      updatedAt: Date.now(),
      mood: diary.metadata.mood,
      wordCount: diary.metadata.wordCount || 0,
      type: diary.metadata.type || 'auto',
      title: diary.metadata.title,
      excerpt: extractExcerpt(diary),
      isDeleted: false,
      isPinned: diary.metadata.isPinned || false,
    };

    // 使用事务确保数据一致性
    await db.transaction('rw', db.diaries, async () => {
      await db.diaries.put(record);
    });
    
    console.log('✅ Diary saved to IndexedDB:', record.id);
  } catch (error) {
    console.error('❌ Failed to save diary to IndexedDB:', error);
    // 降级到 localStorage
    try {
      fallbackToLocalStorage('save', diary);
    } catch (fallbackError) {
      console.error('❌ Fallback也失败:', fallbackError);
    }
    throw new Error(`保存日记失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取日记
 */
export async function getDiary(date: string): Promise<Diary | null> {
  try {
    // 参数验证
    if (!date || typeof date !== 'string') {
      throw new Error('日期参数无效');
    }

    const record = await db.diaries
      .where('date')
      .equals(date)
      .and(item => !item.isDeleted)
      .first();

    return record ? record.diary : null;
  } catch (error) {
    console.error(`❌ Failed to get diary for ${date}:`, error);
    // 降级到 localStorage
    try {
      return fallbackToLocalStorage('get', date);
    } catch (fallbackError) {
      console.error('❌ Fallback也失败:', fallbackError);
      return null;
    }
  }
}

/**
 * 根据 ID 获取日记
 */
export async function getDiaryById(id: string): Promise<Diary | null> {
  try {
    // 参数验证
    if (!id || typeof id !== 'string') {
      throw new Error('ID 参数无效');
    }

    const record = await db.diaries
      .where('id')
      .equals(id)
      .and(item => !item.isDeleted)
      .first();

    return record ? record.diary : null;
  } catch (error) {
    console.error(`❌ Failed to get diary by ID ${id}:`, error);
    return null;
  }
}

/**
 * 获取今日日记（返回最新的一篇）
 */
export async function getTodayDiary(): Promise<Diary | null> {
  const today = formatDate(new Date());
  return getDiary(today);
}

/**
 * 获取指定日期的所有日记
 */
export async function getDiariesByDate(date: string): Promise<Diary[]> {
  try {
    const records = await db.diaries
      .where('date')
      .equals(date)
      .and(item => !item.isDeleted)
      .sortBy('createdAt'); // 按创建时间排序

    return records.map(record => record.diary).reverse(); // 最新的在前
  } catch (error) {
    console.error('❌ Failed to get diaries by date from IndexedDB:', error);
    return [];
  }
}

/**
 * 获取今日所有日记
 */
export async function getTodayDiaries(): Promise<Diary[]> {
  const today = formatDate(new Date());
  return getDiariesByDate(today);
}

/**
 * 获取日记列表（分页）
 */
export async function getDiaryList(
  options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    mood?: string;
  } = {}
): Promise<DiaryPreview[]> {
  try {
    const { limit = 20, offset = 0, startDate, endDate, mood } = options;

    // 使用更安全的查询方式
    let query = db.diaries.filter(record => record.isDeleted !== true);

    // 日期范围过滤
    if (startDate && endDate) {
      query = query.filter(item => item.date >= startDate && item.date <= endDate);
    }

    // 情绪过滤
    if (mood) {
      query = query.filter(item => item.mood === mood);
    }

    const records = await query
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();

    return records.map(record => ({
      id: record.id,
      date: record.date,
      createdAt: new Date(record.createdAt),
      title: record.title,
      mood: record.mood || '',
      excerpt: record.excerpt,
      wordCount: record.wordCount,
      type: (record.type || 'auto') as any,
      generatedAt: new Date(record.createdAt),
      isPinned: record.isPinned,
    }));
  } catch (error) {
    console.error('❌ Failed to get diary list from IndexedDB:', error);
    return [];
  }
}

/**
 * 获取所有日记（用于时间线）
 */
export async function getAllDiaries(): Promise<DiaryPreview[]> {
  try {
    // 使用更安全的查询方式，避免无效键值问题
    const records = await db.diaries
      .filter(record => record.isDeleted !== true) // 使用 filter 而不是 where
      .reverse()
      .toArray();

    // 按置顶和创建时间排序
    records.sort((a, b) => {
      // 置顶的日记排在前面
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 相同置顶状态，按创建时间倒序
      return b.createdAt - a.createdAt;
    });

    return records.map(record => ({
      id: record.id,
      date: record.date,
      createdAt: new Date(record.createdAt),
      title: record.title,
      mood: record.mood || '',
      excerpt: record.excerpt,
      wordCount: record.wordCount,
      type: (record.type || 'auto') as any,
      generatedAt: new Date(record.createdAt),
      isPinned: record.isPinned,
    }));
  } catch (error) {
    console.error('❌ Failed to get all diaries from IndexedDB:', error);
    // 如果查询失败，尝试清理数据库并重新初始化
    try {
      await clearAndReinitializeDB();
      return [];
    } catch (reinitError) {
      console.error('❌ Failed to reinitialize database:', reinitError);
      return [];
    }
  }
}

/**
 * 删除日记（软删除）
 */
export async function deleteDiary(id: string): Promise<void> {
  try {
    await db.diaries.update(id, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
    console.log('✅ Diary soft-deleted:', id);
  } catch (error) {
    console.error('❌ Failed to delete diary from IndexedDB:', error);
    throw new Error('删除日记失败');
  }
}

/**
 * 永久删除日记
 */
export async function permanentlyDeleteDiary(id: string): Promise<void> {
  try {
    await db.diaries.delete(id);
    console.log('✅ Diary permanently deleted:', id);
  } catch (error) {
    console.error('❌ Failed to permanently delete diary:', error);
    throw new Error('永久删除日记失败');
  }
}

/**
 * 搜索日记
 */
export async function searchDiaries(keyword: string): Promise<DiaryPreview[]> {
  try {
    // 参数验证
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return [];
    }

    const searchTerm = keyword.trim().toLowerCase();
    
    const records = await db.diaries
      .filter(record => record.isDeleted !== true)
      .toArray();

    // 在内容中搜索关键词（优化性能）
    const filtered = records.filter(record => {
      try {
        // 先检查摘要（更快）
        if (record.excerpt && record.excerpt.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // 再检查标题
        if (record.title && record.title.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // 最后检查完整内容（较慢）
        const content = JSON.stringify(record.diary.content.document).toLowerCase();
        return content.includes(searchTerm);
      } catch (err) {
        console.error('搜索记录时出错:', record.id, err);
        return false;
      }
    });

    return filtered.map(record => ({
      id: record.id,
      date: record.date,
      createdAt: new Date(record.createdAt),
      title: record.title,
      mood: record.mood || '',
      excerpt: record.excerpt,
      wordCount: record.wordCount,
      type: (record.type || 'auto') as any,
      generatedAt: new Date(record.createdAt),
      isPinned: record.isPinned,
    }));
  } catch (error) {
    console.error('❌ Failed to search diaries:', error);
    return [];
  }
}

/**
 * 统计信息
 */
export async function getDiaryStats(): Promise<{
  total: number;
  thisMonth: number;
  thisYear: number;
  averageWordCount: number;
  moodDistribution: Record<string, number>;
}> {
  try {
    const records = await db.diaries
      .filter(record => record.isDeleted !== true)
      .toArray();

    const now = new Date();
    const thisMonth = records.filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    });

    const thisYear = records.filter(r => {
      const date = new Date(r.date);
      return date.getFullYear() === now.getFullYear();
    });

    const totalWords = records.reduce((sum, r) => sum + r.wordCount, 0);
    
    const moodDistribution: Record<string, number> = {};
    records.forEach(r => {
      if (r.mood) {
        moodDistribution[r.mood] = (moodDistribution[r.mood] || 0) + 1;
      }
    });

    return {
      total: records.length,
      thisMonth: thisMonth.length,
      thisYear: thisYear.length,
      averageWordCount: records.length > 0 ? Math.round(totalWords / records.length) : 0,
      moodDistribution,
    };
  } catch (error) {
    console.error('❌ Failed to get diary stats:', error);
    return {
      total: 0,
      thisMonth: 0,
      thisYear: 0,
      averageWordCount: 0,
      moodDistribution: {},
    };
  }
}

/**
 * 数据迁移：从 localStorage 迁移到 IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    console.log('🔄 Starting migration from localStorage to IndexedDB...');

    const indexData = localStorage.getItem('diary_index');
    if (!indexData) {
      console.log('ℹ️ No diaries found in localStorage');
      return;
    }

    const dates: string[] = JSON.parse(indexData);
    let migratedCount = 0;

    for (const date of dates) {
      const key = `diary_${date}`;
      const data = localStorage.getItem(key);
      
      if (data) {
        try {
          const diary: Diary = JSON.parse(data);
          await saveDiary(diary);
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate diary for ${date}:`, error);
        }
      }
    }

    console.log(`✅ Migration completed: ${migratedCount} diaries migrated`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 提取摘要
 */
function extractExcerpt(diary: Diary): string {
  try {
    const doc = diary.content.document;
    if (!doc.content || !Array.isArray(doc.content)) {
      return '';
    }

    // 查找第一个有文本内容的段落
    for (const node of doc.content) {
      if (node.type === 'paragraph' && node.content) {
        const text = extractTextFromNode(node);
        if (text) {
          return text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }
      }
    }

    return '';
  } catch (error) {
    return '';
  }
}

/**
 * 从节点提取文本
 */
function extractTextFromNode(node: { text?: string; content?: unknown[] }): string {
  if (node.text) {
    return node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    return node.content.map((child) => extractTextFromNode(child as { text?: string; content?: unknown[] })).join('');
  }
  return '';
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 降级到 localStorage（兼容性）
 */
function fallbackToLocalStorage(action: 'save', data: Diary): void;
function fallbackToLocalStorage(action: 'get', data: string): Diary | null;
function fallbackToLocalStorage(action: 'save' | 'get', data: Diary | string): void | Diary | null {
  console.warn('⚠️ Falling back to localStorage');
  
  if (action === 'save') {
    const diary = data as Diary;
    const key = `diary_${diary.metadata.date}`;
    localStorage.setItem(key, JSON.stringify(diary));
    return;
  }
  
  if (action === 'get') {
    const date = data as string;
    const key = `diary_${date}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as Diary : null;
  }
}

/**
 * 清理并重新初始化数据库
 */
async function clearAndReinitializeDB(): Promise<void> {
  try {
    console.log('🔄 Clearing and reinitializing database...');
    
    // 删除数据库
    await db.delete();
    
    // 重新创建数据库实例
    const newDb = new DiaryDatabase();
    
    // 等待数据库准备就绪
    await newDb.open();
    
    console.log('✅ Database reinitialized successfully');
  } catch (error) {
    console.error('❌ Failed to reinitialize database:', error);
    throw error;
  }
}

/**
 * 检查 IndexedDB 是否可用
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 
           'indexedDB' in window && 
           window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * 清理数据库（用于调试）
 */
export async function clearDatabase(): Promise<void> {
  try {
    await db.delete();
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    throw error;
  }
}

/**
 * 调试函数：检查数据库状态
 */
export async function debugDatabase(): Promise<void> {
  try {
    console.log('🔍 Database debug info:');
    console.log('Database name:', db.name);
    console.log('Database version:', db.verno);
    
    const count = await db.diaries.count();
    console.log('Total records:', count);
    
    const sample = await db.diaries.limit(3).toArray();
    console.log('Sample records:', sample);
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  }
}

// 导出数据库实例（用于高级操作）
export { db };

