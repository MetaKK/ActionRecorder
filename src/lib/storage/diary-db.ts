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
  id: string;                    // 主键：diary_timestamp
  date: string;                  // 日期：2025-10-17（索引）
  diary: Diary;                  // 完整日记对象
  createdAt: number;             // 创建时间戳（索引）
  updatedAt: number;             // 更新时间戳
  mood?: string;                 // 情绪标签（索引）
  wordCount: number;             // 字数（索引）
  tags?: string[];               // 自定义标签
  excerpt: string;               // 摘要（用于列表显示）
  isDeleted: boolean;            // 软删除标记
}

/**
 * 日记数据库类
 */
class DiaryDatabase extends Dexie {
  diaries!: Table<DiaryRecord, string>;

  constructor() {
    super('LifeRecorderDB');
    
    // 定义数据库版本和表结构
    this.version(1).stores({
      diaries: 'id, date, createdAt, mood, wordCount, isDeleted',
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
    const record: DiaryRecord = {
      id: diary.metadata.id,
      date: diary.metadata.date,
      diary: diary,
      createdAt: new Date(diary.metadata.generatedAt).getTime(),
      updatedAt: Date.now(),
      mood: diary.metadata.mood,
      wordCount: diary.metadata.wordCount,
      excerpt: extractExcerpt(diary),
      isDeleted: false,
    };

    await db.diaries.put(record);
    console.log('✅ Diary saved to IndexedDB:', record.id);
  } catch (error) {
    console.error('❌ Failed to save diary to IndexedDB:', error);
    // 降级到 localStorage
    fallbackToLocalStorage('save', diary);
    throw new Error('保存日记失败');
  }
}

/**
 * 获取日记
 */
export async function getDiary(date: string): Promise<Diary | null> {
  try {
    const record = await db.diaries
      .where('date')
      .equals(date)
      .and(item => !item.isDeleted)
      .first();

    return record ? record.diary : null;
  } catch (error) {
    console.error('❌ Failed to get diary from IndexedDB:', error);
    // 降级到 localStorage
    return fallbackToLocalStorage('get', date);
  }
}

/**
 * 获取今日日记
 */
export async function getTodayDiary(): Promise<Diary | null> {
  const today = formatDate(new Date());
  return getDiary(today);
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
      mood: record.mood || '',
      excerpt: record.excerpt,
      wordCount: record.wordCount,
      generatedAt: new Date(record.createdAt),
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

    return records.map(record => ({
      id: record.id,
      date: record.date,
      mood: record.mood || '',
      excerpt: record.excerpt,
      wordCount: record.wordCount,
      generatedAt: new Date(record.createdAt),
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
    const records = await db.diaries
      .filter(record => record.isDeleted !== true)
      .toArray();

    // 在内容中搜索关键词
    const filtered = records.filter(record => {
      const content = JSON.stringify(record.diary.content.document).toLowerCase();
      return content.includes(keyword.toLowerCase()) ||
             record.excerpt.toLowerCase().includes(keyword.toLowerCase());
    });

    return filtered.map(record => ({
      id: record.id,
      date: record.date,
      mood: record.mood || '',
      excerpt: record.excerpt,
      wordCount: record.wordCount,
      generatedAt: new Date(record.createdAt),
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

