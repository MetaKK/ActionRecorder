/**
 * Record 项渲染器
 * 
 * 渲染 Record 类型的 TimelineItem
 * 复用现有的 TimelineItem 组件
 */

'use client';

import React from 'react';
import { TimelineItem as TimelineItemComponent } from '@/components/timeline-item';
import { TimelineItemRendererProps } from './registry';
import { timelineItemToRecord } from '../adapters';

/**
 * Record 渲染器
 */
export function RecordRenderer({ 
  item
  // onUpdate, 
  // onDelete 
}: TimelineItemRendererProps) {
  // 将 TimelineItem 转换回 Record
  const record = timelineItemToRecord(item);
  
  return <TimelineItemComponent record={record} />;
}

export default RecordRenderer;

