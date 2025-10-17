/**
 * Timeline 渲染器
 * 
 * 导出所有渲染器相关内容并注册默认渲染器
 */

'use client';

import { TimelineItemType } from '../types';
import { rendererRegistry } from './registry';
import RecordRenderer from './RecordRenderer';
import DiaryRenderer from './DiaryRenderer';

// 注册默认渲染器
rendererRegistry.register(TimelineItemType.RECORD, RecordRenderer);
rendererRegistry.register(TimelineItemType.DIARY, DiaryRenderer);

// 导出
export * from './registry';
export * from './TimelineItemRenderer';
export * from './RecordRenderer';
export * from './DiaryRenderer';

export { rendererRegistry };
export default rendererRegistry;

