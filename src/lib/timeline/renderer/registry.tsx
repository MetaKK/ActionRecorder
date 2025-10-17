import React from 'react';
import { TimelineItem, TimelineItemType } from '../types';

export interface TimelineItemRendererProps {
  item: TimelineItem;
  onUpdate?: (item: TimelineItem) => void;
  onDelete?: (id: string) => void;
}

export interface RendererRegistry {
  [TimelineItemType.RECORD]: React.ComponentType<TimelineItemRendererProps>;
  [TimelineItemType.DIARY]: React.ComponentType<TimelineItemRendererProps>;
}

export const rendererRegistry: RendererRegistry = {
  [TimelineItemType.RECORD]: () => <div>Record Renderer</div>,
  [TimelineItemType.DIARY]: () => <div>Diary Renderer</div>,
};

export const DefaultRenderer: React.FC<TimelineItemRendererProps> = ({ item }) => {
  return <div>Default Renderer for {item.type}</div>;
};