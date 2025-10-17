/**
 * Tiptap 编辑器配置
 * 日记专用扩展和配置
 */

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TiptapDocument, TiptapNode } from './types';
import { 
  EnhancedImage, 
  Video, 
  Audio, 
  FileAttachment,
  // DragAndDropPlugin,
  // PasteImagePlugin,
  // UploadProgressPlugin
} from './tiptap-extensions';
// import { uploadToIndexedDB } from '@/lib/utils/media-upload';

/**
 * 日记编辑器扩展配置
 */
export const diaryExtensions = [
  // StarterKit 包含基础扩展
  StarterKit.configure({
    heading: {
      levels: [3, 4], // 只使用 H3 和 H4
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    blockquote: {
      HTMLAttributes: {
        class: 'diary-quote',
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: 'diary-divider',
      },
    },
    // 禁用不需要的扩展
    code: false,
    codeBlock: false,
  }),
  
  // 文本样式
  TextStyle,
  Color.configure({
    types: ['textStyle'],
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Underline, // StarterKit 不包含，需要单独添加
  
  // 排版优化
  Typography.configure({
    openDoubleQuote: '"',
    closeDoubleQuote: '"',
    openSingleQuote: '\u2018',
    closeSingleQuote: '\u2019',
  }),
  
  // 增强媒体支持
  EnhancedImage.configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: {
      class: 'diary-image',
    },
  }),
  Video.configure({
    HTMLAttributes: {
      class: 'diary-video',
      controls: true,
    },
  }),
  Audio.configure({
    HTMLAttributes: {
      class: 'diary-audio',
      controls: true,
    },
  }),
  FileAttachment,
  
  // 链接
  Link.configure({
    openOnClick: false,
    linkOnPaste: true,
    HTMLAttributes: {
      class: 'diary-link',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
  
  // 占位符
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return '日记标题...';
      }
      return 'AI 正在为你创作今日日记...';
    },
    showOnlyWhenEditable: false,
    showOnlyCurrent: false,
  }),
];

/**
 * 只读模式扩展配置（用于查看日记）
 */
export const diaryViewerExtensions = [
  // ...customDiaryExtensions,
  StarterKit.configure({
    heading: {
      levels: [3, 4],
    },
    blockquote: {
      HTMLAttributes: {
        class: 'diary-quote',
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: 'diary-divider',
      },
    },
    code: false,
    codeBlock: false,
  }),
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  Underline,
  Typography,
  EnhancedImage.configure({
    inline: true,
    HTMLAttributes: {
      class: 'diary-image',
    },
  }),
  Link.configure({
    openOnClick: true,
    HTMLAttributes: {
      class: 'diary-link',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
];

/**
 * 编辑器 Props 配置
 */
export const diaryEditorProps = {
  attributes: {
    class: 'diary-editor-content prose prose-lg max-w-none focus:outline-none',
    spellcheck: 'false',
  },
};

/**
 * 辅助函数：插入时间标记
 */
export function insertTimeStamp(editor: Editor, time: string): void {
  editor
    .chain()
    .focus()
    .setHeading({ level: 3 })
    .insertContent(`⏰ ${time}`)
    .run();
}

/**
 * 辅助函数：插入情绪标签
 */
export function insertMoodTag(editor: Editor, mood: string, emoji: string): void {
  editor
    .chain()
    .focus()
    .insertContent(`${emoji} ${mood}`)
    .run();
}

/**
 * 辅助函数：应用颜色
 */
export function applyColor(editor: Editor, color: string): void {
  editor
    .chain()
    .focus()
    .setColor(color)
    .run();
}

/**
 * 辅助函数：插入引用块
 */
export function insertQuote(editor: Editor, text: string): void {
  editor
    .chain()
    .focus()
    .setBlockquote()
    .insertContent(text)
    .run();
}

/**
 * 辅助函数：插入分隔线
 */
export function insertDivider(editor: Editor): void {
  editor
    .chain()
    .focus()
    .setHorizontalRule()
    .run();
}

/**
 * 颜色预设
 */
export const DIARY_COLORS = {
  blue: '#3b82f6',      // 冷静思考
  green: '#10b981',     // 积极情绪
  yellow: '#f59e0b',    // 注意提醒
  red: '#ef4444',       // 强烈情感
  purple: '#8b5cf6',    // 深刻感悟
  gray: '#6b7280',      // 中性描述
};

/**
 * 情绪图标映射
 */
export const MOOD_EMOJIS = {
  happy: '😊',
  sad: '😢',
  excited: '🎉',
  calm: '😌',
  angry: '😠',
  confused: '😕',
  tired: '😴',
  anxious: '😰',
  grateful: '🙏',
  proud: '💪',
};

/**
 * 时间段标记
 */
export const TIME_PERIODS = [
  { label: '清晨', emoji: '🌅', time: '05:00-07:00' },
  { label: '早晨', emoji: '☀️', time: '07:00-09:00' },
  { label: '上午', emoji: '🌤️', time: '09:00-12:00' },
  { label: '中午', emoji: '🌞', time: '12:00-14:00' },
  { label: '下午', emoji: '🌤️', time: '14:00-17:00' },
  { label: '傍晚', emoji: '🌆', time: '17:00-19:00' },
  { label: '晚上', emoji: '🌙', time: '19:00-22:00' },
  { label: '深夜', emoji: '🌃', time: '22:00-05:00' },
];

/**
 * 将 Markdown 转换为 Tiptap JSON（简化版）
 */
export function markdownToTiptap(markdown: string): TiptapDocument {
  // 这是一个简化的转换器
  // 实际应用中可以使用更完善的转换库
  const lines = markdown.split('\n');
  const content: TiptapNode[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // 标题
    if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [
          { type: 'text', text: line.replace('### ', '') }
        ]
      });
    }
    // 分隔线
    else if (line === '---') {
      content.push({ type: 'horizontalRule' });
    }
    // 普通段落
    else {
      content.push({
        type: 'paragraph',
        content: [
          { type: 'text', text: line }
        ]
      });
    }
  }
  
  return {
    type: 'doc',
    content,
  };
}

/**
 * 将 Tiptap JSON 转换为 Markdown（简化版）
 */
export function tiptapToMarkdown(json: TiptapDocument | TiptapNode): string {
  if (!json || !('content' in json)) return '';
  
  const lines: string[] = [];
  
  for (const node of json.content || []) {
    if (node.type === 'heading') {
      const level = '#'.repeat((node.attrs?.level as number) || 3);
      const text = extractTextFromNode(node);
      lines.push(`${level} ${text}`);
    } else if (node.type === 'paragraph') {
      lines.push(extractTextFromNode(node));
    } else if (node.type === 'horizontalRule') {
      lines.push('---');
    } else if (node.type === 'blockquote') {
      const text = extractTextFromNode(node);
      lines.push(`> ${text}`);
    }
    
    lines.push(''); // 空行
  }
  
  return lines.join('\n');
}

/**
 * 从节点中提取纯文本
 */
function extractTextFromNode(node: TiptapNode): string {
  if (!node.content) return '';
  
  let text = '';
  for (const child of node.content) {
    if (child.type === 'text' && child.text) {
      text += child.text;
    } else if (child.content) {
      text += extractTextFromNode(child);
    }
  }
  
  return text;
}

/**
 * 计算字数
 */
export function countWords(json: TiptapDocument | TiptapNode): number {
  const text = extractTextFromNode(json);
  // 中文字符 + 英文单词
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

/**
 * 验证 Tiptap JSON 格式
 */
export function validateTiptapJSON(json: unknown): json is TiptapDocument {
  if (!json || typeof json !== 'object') return false;
  if (!('type' in json) || json.type !== 'doc') return false;
  if (!('content' in json) || !Array.isArray(json.content)) return false;
  return true;
}

