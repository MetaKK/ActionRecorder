/**
 * 日记存储系统
 * 使用 localStorage 存储日记
 */

import { Diary, DiaryPreview } from './types';
import { formatDate } from '@/lib/utils/date';

const STORAGE_KEY_PREFIX = 'diary_';
const STORAGE_INDEX_KEY = 'diary_index';

/**
 * 保存日记
 */
export function saveDiary(diary: Diary): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${diary.metadata.date}`;
    localStorage.setItem(key, JSON.stringify(diary));
    
    // 更新索引
    updateDiaryIndex(diary);
  } catch (error) {
    console.error('Failed to save diary:', error);
    throw new Error('保存日记失败');
  }
}

/**
 * 获取日记
 */
export function getDiary(date: string): Diary | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${date}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    const diary = JSON.parse(data);
    
    // 转换日期类型
    diary.metadata.generatedAt = new Date(diary.metadata.generatedAt);
    if (diary.metadata.editHistory) {
      diary.metadata.editHistory = diary.metadata.editHistory.map((edit: { timestamp: Date | string }) => ({
        ...edit,
        timestamp: new Date(edit.timestamp),
      }));
    }
    if (diary.citations) {
      diary.citations = diary.citations.map((citation: { timestamp: Date | string }) => ({
        ...citation,
        timestamp: new Date(citation.timestamp),
      }));
    }
    
    return diary;
  } catch (error) {
    console.error('Failed to get diary:', error);
    return null;
  }
}

/**
 * 获取今日日记
 */
export function getTodayDiary(): Diary | null {
  const today = formatDate(new Date());
  return getDiary(today);
}

/**
 * 删除日记
 */
export function deleteDiary(date: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${date}`;
    localStorage.removeItem(key);
    
    // 从索引中移除
    removeFromIndex(date);
  } catch (error) {
    console.error('Failed to delete diary:', error);
    throw new Error('删除日记失败');
  }
}

/**
 * 获取所有日记列表
 */
export function getAllDiaries(): Diary[] {
  try {
    const diaries: Diary[] = [];
    const index = getDiaryIndex();
    
    index.forEach(date => {
      const diary = getDiary(date);
      if (diary) {
        diaries.push(diary);
      }
    });
    
    // 按日期倒序排列
    return diaries.sort((a, b) => {
      return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
    });
  } catch (error) {
    console.error('Failed to get all diaries:', error);
    return [];
  }
}

/**
 * 获取日记预览列表
 */
export function getDiaryPreviews(limit?: number): DiaryPreview[] {
  try {
    const diaries = getAllDiaries();
    const previews = diaries.map(diary => createDiaryPreview(diary));
    
    return limit ? previews.slice(0, limit) : previews;
  } catch (error) {
    console.error('Failed to get diary previews:', error);
    return [];
  }
}

/**
 * 创建日记预览
 */
function createDiaryPreview(diary: Diary): DiaryPreview {
  // 从内容中提取文本作为摘要
  const excerpt = extractExcerpt(diary.content.document);
  
  return {
    id: diary.metadata.id,
    date: diary.metadata.date,
    title: `${diary.metadata.date} 的日记`,
    excerpt,
    mood: diary.metadata.mood,
    wordCount: diary.metadata.wordCount,
  };
}

/**
 * 从 Tiptap JSON 提取文本摘要
 */
function extractExcerpt(document: unknown): string {
  let text = '';
  
  function traverse(node: unknown): void {
    if (node && typeof node === 'object' && 'type' in node) {
      if (node.type === 'text' && 'text' in node && typeof node.text === 'string') {
        text += node.text;
      } else if ('content' in node && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }
  }
  
  traverse(document);
  
  // 返回前150个字符
  return text.substring(0, 150) + (text.length > 150 ? '...' : '');
}

/**
 * 更新日记索引
 */
function updateDiaryIndex(diary: Diary): void {
  try {
    const index = getDiaryIndex();
    const date = diary.metadata.date;
    
    if (!index.includes(date)) {
      index.push(date);
      index.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Failed to update diary index:', error);
  }
}

/**
 * 从索引中移除
 */
function removeFromIndex(date: string): void {
  try {
    const index = getDiaryIndex();
    const newIndex = index.filter(d => d !== date);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(newIndex));
  } catch (error) {
    console.error('Failed to remove from index:', error);
  }
}

/**
 * 获取日记索引
 */
function getDiaryIndex(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_INDEX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get diary index:', error);
    return [];
  }
}

/**
 * 导出日记（JSON 格式）
 */
export function exportDiary(diary: Diary): string {
  return JSON.stringify(diary, null, 2);
}

/**
 * 导入日记
 */
export function importDiary(jsonString: string): Diary {
  try {
    const diary = JSON.parse(jsonString);
    
    // 验证格式
    if (!diary.metadata || !diary.content) {
      throw new Error('无效的日记格式');
    }
    
    // 转换日期
    diary.metadata.generatedAt = new Date(diary.metadata.generatedAt);
    
    return diary;
  } catch (error) {
    console.error('Failed to import diary:', error);
    throw new Error('导入日记失败');
  }
}

/**
 * 获取统计信息
 */
export function getDiaryStats() {
  const diaries = getAllDiaries();
  
  return {
    total: diaries.length,
    totalWords: diaries.reduce((sum, d) => sum + d.metadata.wordCount, 0),
    averageWords: diaries.length > 0 
      ? Math.round(diaries.reduce((sum, d) => sum + d.metadata.wordCount, 0) / diaries.length)
      : 0,
    moodDistribution: analyzeMoodDistribution(diaries),
    styleDistribution: analyzeStyleDistribution(diaries),
    recentDays: diaries.slice(0, 7).length,
  };
}

/**
 * 分析情绪分布
 */
function analyzeMoodDistribution(diaries: Diary[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  diaries.forEach(diary => {
    const mood = diary.metadata.mood;
    distribution[mood] = (distribution[mood] || 0) + 1;
  });
  
  return distribution;
}

/**
 * 分析风格分布
 */
function analyzeStyleDistribution(diaries: Diary[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  diaries.forEach(diary => {
    const style = diary.metadata.style;
    distribution[style] = (distribution[style] || 0) + 1;
  });
  
  return distribution;
}

/**
 * 清空所有日记（慎用）
 */
export function clearAllDiaries(): void {
  try {
    const index = getDiaryIndex();
    
    index.forEach(date => {
      const key = `${STORAGE_KEY_PREFIX}${date}`;
      localStorage.removeItem(key);
    });
    
    localStorage.removeItem(STORAGE_INDEX_KEY);
  } catch (error) {
    console.error('Failed to clear all diaries:', error);
    throw new Error('清空日记失败');
  }
}

