/**
 * Diary → TimelineItem 适配器
 * 
 * 将现有的 Diary 类型转换为统一的 TimelineItem
 */

import { Diary, DiaryPreview } from '@/lib/ai/diary/types';
import {
  TimelineItem,
  TimelineItemType,
  ItemStatus,
  SyncStatus,
  DiaryContent,
} from '../types';

/**
 * 将 Diary 转换为 TimelineItem
 */
export function diaryToTimelineItem(diary: Diary): TimelineItem<TimelineItemType.DIARY> {
  const content: DiaryContent = {
    document: diary.content.document,
    citations: diary.citations,
    images: diary.images,
    style: diary.metadata.style,
    diaryType: diary.metadata.type,
  };
  
  // 生成搜索文本
  const searchText = buildSearchText(diary);
  
  return {
    id: diary.metadata.id,
    type: TimelineItemType.DIARY,
    createdAt: diary.metadata.createdAt,
    updatedAt: diary.metadata.generatedAt,
    timestamp: diary.metadata.createdAt.getTime(),
    content,
    metadata: {
      title: diary.metadata.title,
      excerpt: extractExcerpt(diary),
      mood: diary.metadata.mood,
      isPinned: diary.metadata.isPinned || false,
      wordCount: diary.metadata.wordCount,
      hasImages: !!diary.images?.length,
    },
    status: diary.metadata.isArchived ? ItemStatus.ARCHIVED : ItemStatus.ACTIVE,
    dateKey: diary.metadata.date,
    tags: diary.metadata.tags || [],
    searchText,
    version: diary.metadata.version,
    syncStatus: SyncStatus.LOCAL_ONLY,
    deviceId: getDeviceId(),
  };
}

/**
 * 将 DiaryPreview 转换为 TimelineItem
 */
export function diaryPreviewToTimelineItem(preview: DiaryPreview): Partial<TimelineItem<TimelineItemType.DIARY>> {
  return {
    id: preview.id,
    type: TimelineItemType.DIARY,
    createdAt: preview.createdAt,
    updatedAt: preview.generatedAt || preview.createdAt,
    timestamp: preview.createdAt.getTime(),
    metadata: {
      title: preview.title,
      excerpt: preview.excerpt,
      mood: preview.mood,
      isPinned: preview.isPinned || false,
      wordCount: preview.wordCount,
    },
    status: ItemStatus.ACTIVE,
    dateKey: preview.date,
    tags: [],
    searchText: buildSearchTextFromPreview(preview),
    version: 1,
    syncStatus: SyncStatus.LOCAL_ONLY,
    deviceId: getDeviceId(),
  };
}

/**
 * 将 TimelineItem 转换回 Diary
 */
export function timelineItemToDiary(item: TimelineItem<TimelineItemType.DIARY>): Diary {
  const content = item.content as DiaryContent;
  
  return {
    metadata: {
      id: item.id,
      date: item.dateKey,
      createdAt: item.createdAt,
      generatedAt: item.updatedAt,
      style: content.style,
      type: content.diaryType,
      title: item.metadata.title,
      wordCount: item.metadata.wordCount || 0,
      mood: item.metadata.mood || '',
      tags: item.tags,
      sources: {
        recordsCount: 0,
        chatsCount: 0,
        filesCount: 0,
      },
      version: item.version,
      isArchived: item.status === ItemStatus.ARCHIVED,
      isPinned: item.metadata.isPinned || false,
    },
    content: {
      format: 'tiptap-json',
      version: '1.0',
      document: content.document,
    },
    citations: content.citations || [],
    images: content.images,
  };
}

/**
 * 批量转换 Diaries
 */
export function diariesToTimelineItems(diaries: Diary[]): TimelineItem<TimelineItemType.DIARY>[] {
  return diaries.map(diaryToTimelineItem);
}

/**
 * 批量转换 DiaryPreviews
 */
export function diaryPreviewsToTimelineItems(
  previews: DiaryPreview[]
): Partial<TimelineItem<TimelineItemType.DIARY>>[] {
  return previews.map(diaryPreviewToTimelineItem);
}

// ===== 辅助函数 =====

function buildSearchText(diary: Diary): string {
  const parts: string[] = [];
  
  if (diary.metadata.title) {
    parts.push(diary.metadata.title);
  }
  
  if (diary.metadata.tags) {
    parts.push(...diary.metadata.tags);
  }
  
  // 从 Tiptap 文档提取文本
  const text = extractTextFromTiptap(diary.content.document);
  if (text) {
    parts.push(text);
  }
  
  return parts.join(' ').toLowerCase();
}

function buildSearchTextFromPreview(preview: DiaryPreview): string {
  const parts: string[] = [];
  
  if (preview.title) {
    parts.push(preview.title);
  }
  
  if (preview.excerpt) {
    parts.push(preview.excerpt);
  }
  
  return parts.join(' ').toLowerCase();
}

function extractExcerpt(diary: Diary): string {
  const text = extractTextFromTiptap(diary.content.document);
  return text.slice(0, 100);
}

function extractTextFromTiptap(doc: any): string {
  const extractText = (node: any): string => {
    if (!node) return '';
    
    if (node.text) {
      return node.text;
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(' ');
    }
    
    return '';
  };
  
  return extractText(doc);
}

function getDeviceId(): string {
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

