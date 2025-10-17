/**
 * AI 日记系统 - 类型定义
 */

import { Location } from '@/lib/types';

/**
 * 日记数据源类型
 */
export enum DiarySourceType {
  RECORDS = 'records',           // 生活记录
  CHATS = 'chats',               // AI 对话
  IMPORTED_FILES = 'files',      // 导入的文件
  MANUAL_NOTES = 'notes',        // 手动笔记
}

/**
 * 日记数据源
 */
export interface DiarySource {
  type: DiarySourceType;
  id: string;
  timestamp: Date;
  content: string;
  metadata?: {
    fileName?: string;
    fileType?: string;
    chatModel?: string;
    location?: Location;
    tags?: string[];
    hasAudio?: boolean;
    hasImages?: boolean;
  };
}

/**
 * Tiptap 文档节点
 */
export interface TiptapNode {
  type: string;
  attrs?: { [key: string]: unknown };
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

/**
 * Tiptap 文本标记
 */
export interface TiptapMark {
  type: string;
  attrs?: { [key: string]: unknown };
}

/**
 * Tiptap 文档格式
 */
export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

/**
 * 日记内容格式（使用 Tiptap JSON）
 */
export interface DiaryContent {
  format: 'tiptap-json';
  version: string;
  document: TiptapDocument;
  html?: string;      // 可选的 HTML 版本（用于导出）
  markdown?: string;  // 可选的 Markdown 版本（用于导出）
}

/**
 * 情绪点（用于情绪曲线）
 */
export interface MoodPoint {
  time: string;
  mood: string;
  intensity: number; // 0-10
}

/**
 * 活动信息
 */
export interface Activity {
  time: string;
  description: string;
  location?: string;
  duration?: number; // 分钟
  category?: 'work' | 'life' | 'social' | 'entertainment' | 'other';
}

/**
 * 日记分析结果
 */
export interface DiaryAnalysis {
  mood: string;                   // 整体情绪
  moodCurve: MoodPoint[];         // 情绪曲线
  activities: Activity[];         // 活动列表
  locations: string[];            // 地点
  highlights: string[];           // 今日亮点
  reflections: string[];          // 思考片段
  topics: string[];               // 讨论的主题
  peopleInteracted: string[];     // 互动的人
  timeDistribution: {             // 时间分布
    morning: number;   // 早晨记录数
    afternoon: number; // 下午记录数
    evening: number;   // 晚上记录数
    night: number;     // 夜晚记录数
  };
}

/**
 * 历史上下文
 */
export interface HistoricalContext {
  writingStyle: string;         // 写作风格
  interests: string[];          // 兴趣爱好
  emotionalTone: string;        // 情绪基调
  recentPatterns: string[];     // 最近的生活模式
  previousDiaries: DiaryPreview[]; // 最近几天的日记预览
}

/**
 * 日记预览
 */
export interface DiaryPreview {
  id: string;                    // 日记ID
  date: string;                  // 日期
  title?: string;                // 标题（可选）
  excerpt: string;               // 摘要
  mood: string;                  // 情绪
  wordCount: number;             // 字数
  generatedAt?: Date;            // 生成时间
}

/**
 * 日记生成上下文
 */
export interface DiaryContext {
  // 时间信息
  date: string;
  dayOfWeek: string;
  weather?: string;
  
  // 数据源
  sources: {
    records: DiarySource[];
    chats: DiarySource[];
    files: DiarySource[];
    notes: DiarySource[];
  };
  
  // 分析结果
  analysis: DiaryAnalysis;
  
  // 历史参考
  historicalContext: HistoricalContext;
}

/**
 * 日记样式模板
 */
export enum DiaryStyle {
  NARRATIVE = 'narrative',       // 叙事体（讲故事）
  REFLECTIVE = 'reflective',     // 反思型（重思考）
  BULLET = 'bullet',             // 要点式（简洁）
  POETIC = 'poetic',             // 文艺型（抒情）
  ANALYTICAL = 'analytical',     // 分析型（理性）
}

/**
 * 引用信息
 */
export interface Citation {
  id: string;
  sourceType: DiarySourceType;
  sourceId: string;
  excerpt: string;
  timestamp: Date;
}

/**
 * 日记编辑记录
 */
export interface DiaryEdit {
  timestamp: Date;
  type: 'manual' | 'regenerate';
  changes?: string;
}

/**
 * 日记元数据
 */
export interface DiaryMetadata {
  id: string;
  date: string;
  generatedAt: Date;
  style: DiaryStyle;
  wordCount: number;
  mood: string;
  tags: string[];
  sources: {
    recordsCount: number;
    chatsCount: number;
    filesCount: number;
  };
  editHistory?: DiaryEdit[];
  version: number;
}

/**
 * 完整的日记对象
 */
export interface Diary {
  metadata: DiaryMetadata;
  content: DiaryContent;
  citations: Citation[];
  images?: string[];
}

/**
 * 日记生成选项
 */
export interface DiaryGenerationOptions {
  style: DiaryStyle;
  includeImages: boolean;
  includeCitations: boolean;
  targetWordCount?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * 日记生成状态
 */
export enum DiaryGenerationStatus {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * 日记生成进度
 */
export interface DiaryGenerationProgress {
  status: DiaryGenerationStatus;
  progress: number; // 0-100
  message: string;
  currentStep?: string;
}

