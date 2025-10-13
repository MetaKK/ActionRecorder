/**
 * 核心数据类型定义
 */

// 地理位置信息（最精确数据）
export interface Location {
  // GPS 坐标（必需）
  latitude: number;           // 纬度
  longitude: number;          // 经度
  
  // 精度信息
  accuracy: number;           // 水平精度（米）
  altitude?: number | null;   // 海拔高度（米）
  altitudeAccuracy?: number | null;  // 海拔精度（米）
  
  // 运动信息
  heading?: number | null;    // 方向（度，0-360，正北为0）
  speed?: number | null;      // 速度（米/秒）
  
  // 时间戳
  timestamp: number;          // 位置获取时间戳
  
  // 逆地理编码地址
  address?: string;           // 完整地址
  city?: string;              // 城市
  district?: string;          // 区县
  street?: string;            // 街道
  country?: string;           // 国家
  province?: string;          // 省份
}

export interface Record {
  id: string;
  content: string;
  location?: Location;  // 地理位置（可选）
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordsStore {
  records: Record[];
  addRecord: (content: string, location?: Location) => void;
  updateRecord: (id: string, content: string) => void;
  deleteRecord: (id: string) => void;
  getRecordsByDateRange: (days?: number) => Record[];
  loadFromStorage: () => void;
}

export type ExportTimeRange = 'today' | '7days' | '30days' | 'all';

export interface ExportOptions {
  timeRange: ExportTimeRange;
}

