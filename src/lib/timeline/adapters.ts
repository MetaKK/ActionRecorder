import { TimelineItem, TimelineItemType, ItemStatus, SyncStatus } from './types';
import { Record, Location, MediaData } from '@/lib/types';

/**
 * 将 TimelineItem 转换为 Record
 */
export function timelineItemToRecord(item: TimelineItem): Record {
  if (item.type !== TimelineItemType.RECORD) {
    throw new Error('Item is not a record');
  }
  
  // Extract content as string from RecordContent
  const content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
  
  return {
    id: item.id,
    content: content,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    timestamp: item.createdAt.getTime(),
    location: item.metadata?.location as Location | undefined,
    audioData: item.metadata?.audioData as string | undefined,
    audioDuration: item.metadata?.audioDuration as number | undefined,
    audioFormat: item.metadata?.audioFormat as string | undefined,
    hasAudio: item.metadata?.hasAudio as boolean | undefined,
    images: item.metadata?.images as MediaData[] | undefined,
    hasImages: item.metadata?.hasImages as boolean | undefined,
  };
}

/**
 * 将 Record 转换为 TimelineItem
 */
export function recordToTimelineItem(record: Record): TimelineItem {
  return {
    id: record.id,
    type: TimelineItemType.RECORD,
    content: {
      text: record.content,
      audioData: record.audioData,
      audioDuration: record.audioDuration,
      audioFormat: record.audioFormat,
      images: record.images,
      location: record.location,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    dateKey: record.createdAt.toISOString().split('T')[0],
    metadata: {
      title: undefined,
      mood: undefined,
      excerpt: undefined,
      wordCount: 0,
      isPinned: false,
    },
    status: ItemStatus.ACTIVE,
    syncStatus: SyncStatus.SYNCED,
    timestamp: record.createdAt.getTime(),
    tags: [],
    searchText: record.content,
    version: 1,
    deviceId: 'local',
  };
}
