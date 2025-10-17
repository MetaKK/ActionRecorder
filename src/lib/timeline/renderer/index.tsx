/**
 * Timeline 渲染器
 * 
 * 导出所有渲染器相关内容并注册默认渲染器
 */

'use client';

import { TimelineItemType } from '../types';
import { rendererRegistry } from './registry';
import { RecordRenderer } from './RecordRenderer';
import { DiaryRenderer } from './DiaryRenderer';

// 更新渲染器注册
rendererRegistry[TimelineItemType.RECORD] = RecordRenderer;
rendererRegistry[TimelineItemType.DIARY] = DiaryRenderer;

// 导出
export * from './registry';
export * from './TimelineItemRenderer';
export * from './RecordRenderer';
export * from './DiaryRenderer';

export { rendererRegistry };
export default rendererRegistry;

