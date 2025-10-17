/**
 * Record → TimelineItem 适配器
 * 
 * 将现有的 Record 类型转换为统一的 TimelineItem
 */

import { Record } from '@/lib/types';
import {
  TimelineItem,
  TimelineItemType,
  ItemStatus,
  SyncStatus,
  RecordContent,
} from '../types';

/**
 * 将 Record 转换为 TimelineItem
 */
export function recordToTimelineItem(record: Record): TimelineItem<TimelineItemType.RECORD> {
  const content: RecordContent = {
    text: record.content,
    audioData: record.audioData,
    audioDuration: record.audioDuration,
    audioFormat: record.audioFormat,
    images: record.images,
    location: record.location,
  };
  
  // 生成搜索文本
  const searchText = buildSearchText(record);
  
  // 生成摘要
  const excerpt = generateExcerpt(record.content);
  
  return {
    id: record.id,
    type: TimelineItemType.RECORD,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    timestamp: record.timestamp,
    content,
    metadata: {
      excerpt,
      hasAudio: record.hasAudio || false,
      hasImages: record.hasImages || false,
      hasVideo: record.images?.some(img => img.type === 'video') || false,
      location: record.location,
      wordCount: countWords(record.content),
    },
    status: ItemStatus.ACTIVE,
    dateKey: getDateKey(record.createdAt),
    tags: [],
    searchText,
    version: 1,
    syncStatus: SyncStatus.LOCAL_ONLY,
    deviceId: getDeviceId(),
  };
}

/**
 * 将 TimelineItem 转换回 Record
 */
export function timelineItemToRecord(item: TimelineItem<TimelineItemType.RECORD>): Record {
  const content = item.content as RecordContent;
  
  return {
    id: item.id,
    content: content.text,
    location: content.location,
    audioData: content.audioData,
    audioDuration: content.audioDuration,
    audioFormat: content.audioFormat,
    hasAudio: !!content.audioData,
    images: content.images,
    hasImages: !!content.images?.length,
    timestamp: item.timestamp,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * 批量转换 Records
 */
export function recordsToTimelineItems(records: Record[]): TimelineItem<TimelineItemType.RECORD>[] {
  return records.map(recordToTimelineItem);
}

// ===== 辅助函数 =====

function buildSearchText(record: Record): string {
  const parts: string[] = [];
  
  if (record.content) {
    parts.push(record.content);
  }
  
  if (record.location?.city) {
    parts.push(record.location.city);
  }
  
  if (record.location?.district) {
    parts.push(record.location.district);
  }
  
  return parts.join(' ').toLowerCase();
}

function generateExcerpt(text: string): string {
  if (!text) return '';
  return text.slice(0, 100);
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
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

