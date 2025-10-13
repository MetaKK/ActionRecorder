/**
 * 核心数据类型定义
 */

export interface Record {
  id: string;
  content: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordsStore {
  records: Record[];
  addRecord: (content: string) => void;
  updateRecord: (id: string, content: string) => void;
  deleteRecord: (id: string) => void;
  getRecordsByDateRange: (days?: number) => Record[];
  loadFromStorage: () => void;
}

export type ExportTimeRange = 'today' | '7days' | '30days' | 'all';

export interface ExportOptions {
  timeRange: ExportTimeRange;
}

