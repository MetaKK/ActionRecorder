/**
 * Timeline 项动态渲染器
 * 
 * 根据项类型动态选择渲染器
 */

'use client';

import React from 'react';
import { TimelineItem } from '../types';
import { rendererRegistry, DefaultRenderer, TimelineItemRendererProps } from './registry';

interface Props {
  item: TimelineItem;
  onUpdate?: (item: TimelineItem) => void;
  onDelete?: (id: string) => void;
}

/**
 * 动态渲染器组件
 */
export function TimelineItemRenderer({ item, onUpdate, onDelete }: Props) {
  // 获取对应类型的渲染器
  const Renderer = (rendererRegistry as unknown as Record<string, React.ComponentType<TimelineItemRendererProps>>)[item.type];
  
  if (!Renderer) {
    return <DefaultRenderer item={item} onUpdate={onUpdate} onDelete={onDelete} />;
  }
  
  return <Renderer item={item} onUpdate={onUpdate} onDelete={onDelete} />;
}

export default TimelineItemRenderer;

