/**
 * Timeline 系统 - 统一类型定义
 * 
 * 设计原则：
 * 1. 所有 Timeline 内容都是 TimelineItem
 * 2. 使用 type 区分不同类型
 * 3. 为云同步预留字段
 * 4. 支持软删除和归档
 */

import { Location, MediaData } from '@/lib/types';
import { TiptapDocument, DiaryStyle, DiaryType, Citation } from '@/lib/ai/diary/types';

// ============================================
// 核心枚举
// ============================================

/**
 * Timeline 项类型
 */
export enum TimelineItemType {
  RECORD = 'record',                   // 生活记录
  DIARY = 'diary',                     // 日记
  CHAT = 'chat',                       // AI 对话 (未来)
  QUICK_NOTE = 'quick_note',           // 快速笔记 (未来)
  VOICE_MEMO = 'voice_memo',           // 语音备忘 (未来)
}

/**
 * 项状态
 */
export enum ItemStatus {
  ACTIVE = 'active',                   // 活跃
  ARCHIVED = 'archived',               // 已归档
  DELETED = 'deleted',                 // 已删除 (软删除)
}

/**
 * 同步状态 (云同步用)
 */
export enum SyncStatus {
  LOCAL_ONLY = 'local_only',           // 仅本地 (默认)
  PENDING = 'pending',                 // 等待同步
  SYNCING = 'syncing',                 // 同步中
  SYNCED = 'synced',                   // 已同步
  CONFLICT = 'conflict',               // 冲突
  ERROR = 'error',                     // 同步失败
}

// ============================================
// 内容类型 (类型安全)
// ============================================

/**
 * Record 内容
 */
export interface RecordContent {
  text: string;                        // 文本内容
  audioData?: string;                  // 音频 (Base64)
  audioDuration?: number;              // 音频时长 (秒)
  audioFormat?: string;                // 音频格式
  images?: MediaData[];                // 图片/视频
  location?: Location;                 // 位置
}

/**
 * Diary 内容
 */
export interface DiaryContent {
  document: TiptapDocument;            // Tiptap 文档
  citations?: Citation[];              // 引用
  images?: string[];                   // 图片URL
  style: DiaryStyle;                   // 日记风格
  diaryType: DiaryType;                // 日记类型 (auto/manual)
}

/**
 * Chat 内容 (未来)
 */
export interface ChatContent {
  messages: ChatMessage[];             // 对话消息
  model: string;                       // AI 模型
  totalTokens: number;                 // Token 数
}

/**
 * Chat 消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * 类型安全的内容联合类型
 */
export type TimelineItemContent<T extends TimelineItemType = TimelineItemType> = 
  T extends TimelineItemType.RECORD ? RecordContent :
  T extends TimelineItemType.DIARY ? DiaryContent :
  T extends TimelineItemType.CHAT ? ChatContent :
  RecordContent | DiaryContent | ChatContent; // fallback

// ============================================
// 元数据
// ============================================

/**
 * 元数据 (通用字段)
 */
export interface TimelineItemMetadata {
  // 通用信息
  title?: string;                      // 标题
  excerpt?: string;                    // 摘要 (用于列表显示)
  mood?: string;                       // 情绪
  isPinned?: boolean;                  // 是否置顶
  wordCount?: number;                  // 字数
  
  // 媒体标记
  hasAudio?: boolean;
  hasImages?: boolean;
  hasVideo?: boolean;
  
  // 位置
  location?: Location;
  
  // 类型特定字段 (可选)
  [key: string]: unknown;
}

// ============================================
// 关系
// ============================================

/**
 * 项之间的关系
 */
export interface ItemRelation {
  type: 'reference' | 'derived' | 'grouped' | 'linked';
  targetId: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// 核心数据模型
// ============================================

/**
 * Timeline 项的统一抽象
 * 
 * 这是整个 Timeline 系统的核心数据结构
 */
export interface TimelineItem<T extends TimelineItemType = TimelineItemType> {
  // ===== 核心字段 =====
  id: string;                          // 全局唯一ID: timeline_{timestamp}_{random}
  type: T;                             // 类型标识
  
  // ===== 时间戳 =====
  createdAt: Date;                     // 创建时间
  updatedAt: Date;                     // 更新时间
  timestamp: number;                   // Unix timestamp (用于排序)
  
  // ===== 内容 =====
  content: TimelineItemContent<T>;     // 类型安全的内容
  metadata: TimelineItemMetadata;      // 元数据
  
  // ===== 状态 =====
  status: ItemStatus;                  // 项状态
  
  // ===== 索引字段 (用于快速查询) =====
  dateKey: string;                     // YYYY-MM-DD (用于日期分组)
  tags: string[];                      // 标签
  searchText: string;                  // 全文搜索文本 (小写)
  
  // ===== 云同步字段 (预留) =====
  version: number;                     // 版本号 (乐观锁)
  syncStatus: SyncStatus;              // 同步状态
  syncedAt?: Date;                     // 最后同步时间
  cloudId?: string;                    // 云端ID
  deviceId: string;                    // 设备ID (多设备同步用)
  
  // ===== 关系 (可选) =====
  relations?: ItemRelation[];          // 与其他项的关系
}

// ============================================
// 查询相关类型
// ============================================

/**
 * 过滤条件
 */
export interface FilterOptions {
  type?: TimelineItemType;             // 按类型过滤
  dateRange?: {                        // 按日期范围过滤
    start: string;                     // YYYY-MM-DD
    end: string;                       // YYYY-MM-DD
  };
  tags?: string[];                     // 按标签过滤
  status?: ItemStatus;                 // 按状态过滤
  isPinned?: boolean;                  // 只显示置顶
}

/**
 * 排序选项
 */
export interface SortOptions {
  by: 'timestamp' | 'createdAt' | 'updatedAt' | 'wordCount';
  order: 'asc' | 'desc';
}

/**
 * 分页选项
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * 分页结果
 */
export interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * 查询选项
 */
export interface QueryOptions {
  type?: TimelineItemType;
  dateRange?: {
    start: string;
    end: string;
  };
  offset?: number;
  limit?: number;
}

/**
 * 获取项的选项
 */
export interface GetItemsOptions {
  filters?: FilterOptions;
  sort?: SortOptions;
  pagination?: PaginationOptions;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationResult;
}

/**
 * 按日期分组的结果
 */
export type GroupedItems = Map<string, TimelineItem[]>;

// ============================================
// 添加数据类型
// ============================================

/**
 * 添加 Record 的数据
 */
export interface AddRecordData {
  content: RecordContent;
  title?: string;
  excerpt?: string;
  mood?: string;
  tags?: string[];
  isPinned?: boolean;
  metadata?: Partial<TimelineItemMetadata>;
}

/**
 * 添加 Diary 的数据
 */
export interface AddDiaryData {
  content: DiaryContent;
  title?: string;
  excerpt?: string;
  mood?: string;
  tags?: string[];
  isPinned?: boolean;
  metadata?: Partial<TimelineItemMetadata>;
}

/**
 * 添加项的数据 (类型安全)
 */
export type AddItemData<T extends TimelineItemType> = 
  T extends TimelineItemType.RECORD ? AddRecordData :
  T extends TimelineItemType.DIARY ? AddDiaryData :
  {
    content: Record<string, unknown>;
    title?: string;
    excerpt?: string;
    mood?: string;
    tags?: string[];
    isPinned?: boolean;
    metadata?: Partial<TimelineItemMetadata>;
  };

// ============================================
// 批量操作类型
// ============================================

/**
 * 批量操作
 */
export type BatchOperation = 
  | { type: 'add'; itemType: TimelineItemType; data: AddItemData<TimelineItemType> }
  | { type: 'update'; id: string; updates: Partial<TimelineItem> }
  | { type: 'delete'; id: string };

/**
 * 批量操作结果
 */
export interface BatchResult {
  success: BatchOperation[];
  failed: Array<{ op: BatchOperation; error: Error }>;
}

// ============================================
// 类型守卫
// ============================================

/**
 * 检查是否为 Record 内容
 */
export function isRecordContent(content: unknown): content is RecordContent {
  return content !== null && typeof content === 'object' && 'text' in content;
}

/**
 * 检查是否为 Diary 内容
 */
export function isDiaryContent(content: unknown): content is DiaryContent {
  return content !== null && typeof content === 'object' && 'document' in content;
}

/**
 * 检查是否为 Record 项
 */
export function isRecordItem(item: TimelineItem): item is TimelineItem<TimelineItemType.RECORD> {
  return item.type === TimelineItemType.RECORD;
}

/**
 * 检查是否为 Diary 项
 */
export function isDiaryItem(item: TimelineItem): item is TimelineItem<TimelineItemType.DIARY> {
  return item.type === TimelineItemType.DIARY;
}

