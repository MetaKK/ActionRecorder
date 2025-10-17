/**
 * Diary 项渲染器
 * 
 * 渲染 Diary 类型的 TimelineItem
 * 复用现有的 DiaryCard 组件
 */

'use client';

import React from 'react';
import { DiaryCard } from '@/components/diary-card';
import { TimelineItemRendererProps } from './registry';
import { TimelineItemType } from '../types';
import { useRouter } from 'next/navigation';

/**
 * Diary 渲染器
 */
export function DiaryRenderer({ 
  item, 
  onUpdate, 
  onDelete 
}: TimelineItemRendererProps<TimelineItemType.DIARY>) {
  const router = useRouter();
  
  // 将 TimelineItem 转换为 DiaryPreview 格式
  const diaryPreview = {
    id: item.id,
    date: item.dateKey,
    createdAt: item.createdAt,
    title: item.metadata.title,
    mood: item.metadata.mood || '',
    excerpt: item.metadata.excerpt || '',
    wordCount: item.metadata.wordCount || 0,
    type: 'auto' as const,
    generatedAt: item.updatedAt,
    isPinned: item.metadata.isPinned || false,
  };
  
  const handleEdit = (id: string) => {
    router.push(`/ai/diary/${id}`);
  };
  
  const handleShare = (id: string) => {
    // TODO: 实现分享功能
  };
  
  const handleExport = (id: string) => {
    // TODO: 实现导出功能
  };
  
  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  };
  
  return (
    <DiaryCard
      diary={diaryPreview}
      onEdit={handleEdit}
      onShare={handleShare}
      onExport={handleExport}
      onDelete={handleDelete}
    />
  );
}

export default DiaryRenderer;

