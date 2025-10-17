/**
 * Tiptap JSON 格式修复工具
 * 修复 AI 生成的错误格式
 */

import { TiptapDocument, TiptapNode } from './types';

/**
 * 修复错误的 Tiptap JSON 格式
 * 主要修复：textStyle 作为节点而不是 mark 的问题
 */
export function fixTiptapJSON(doc: TiptapDocument): TiptapDocument {
  if (!doc || !doc.content) {
    return doc;
  }

  return {
    ...doc,
    content: doc.content.map(node => fixNode(node)),
  };
}

/**
 * 递归修复节点
 */
function fixNode(node: TiptapNode): TiptapNode {
  // 如果是 textStyle 节点（错误格式），转换为正确的 text + marks 格式
  if (node.type === 'textStyle' && node.attrs?.color && node.content) {
    // 提取颜色
    const color = node.attrs.color;
    
    // 提取文本内容
    const textContent = node.content
      .map(child => {
        if (child.type === 'text') {
          return child.text || '';
        }
        return '';
      })
      .join('');

    // 返回正确格式的 text 节点
    return {
      type: 'text',
      text: textContent,
      marks: [
        {
          type: 'textStyle',
          attrs: { color },
        },
      ],
    };
  }

  // 如果节点有 content，递归处理
  if (node.content && Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map(child => fixNode(child)),
    };
  }

  return node;
}

/**
 * 验证并修复 Tiptap JSON
 */
export function validateAndFixTiptapJSON(json: unknown): TiptapDocument | null {
  try {
    // 基本类型检查
    if (!json || typeof json !== 'object') {
      return null;
    }

    const doc = json as TiptapDocument;

    // 检查必需字段
    if (doc.type !== 'doc' || !Array.isArray(doc.content)) {
      return null;
    }

    // 修复并返回
    return fixTiptapJSON(doc);
  } catch (error) {
    console.error('Failed to validate and fix Tiptap JSON:', error);
    return null;
  }
}

/**
 * 深度修复：处理所有可能的错误格式
 */
export function deepFixTiptapJSON(doc: TiptapDocument): TiptapDocument {
  if (!doc || !doc.content) {
    console.warn('Invalid document structure:', doc);
    return doc;
  }

  console.log('Fixing Tiptap JSON, original node count:', doc.content.length);
  
  const fixedContent = doc.content.map((node, index) => {
    const fixed = deepFixNode(node);
    if (node.type === 'textStyle' || (node.content && node.content.some((c: TiptapNode) => c.type === 'textStyle'))) {
      console.log(`Fixed node ${index}:`, { original: node.type, fixed: fixed.type });
    }
    return fixed;
  });

  return {
    ...doc,
    content: fixedContent,
  };
}

/**
 * 深度修复节点
 */
function deepFixNode(node: TiptapNode): TiptapNode {
  // 修复 textStyle 作为节点的问题
  if (node.type === 'textStyle') {
    const color = node.attrs?.color;
    const textContent = extractTextFromNode(node);
    
    if (textContent && color) {
      return {
        type: 'text',
        text: textContent,
        marks: [{ type: 'textStyle', attrs: { color } }],
      };
    }
  }

  // 修复 paragraph 中的 textStyle 节点
  if (node.type === 'paragraph' && node.content) {
    const fixedContent: TiptapNode[] = [];
    
    for (const child of node.content) {
      if (child.type === 'textStyle') {
        // 转换为正确格式
        const color = child.attrs?.color;
        const textContent = extractTextFromNode(child);
        
        if (textContent && color) {
          fixedContent.push({
            type: 'text',
            text: textContent,
            marks: [{ type: 'textStyle', attrs: { color } }],
          });
        }
      } else {
        fixedContent.push(deepFixNode(child));
      }
    }
    
    return {
      ...node,
      content: fixedContent,
    };
  }

  // 递归处理其他有 content 的节点
  if (node.content && Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map(child => deepFixNode(child)),
    };
  }

  return node;
}

/**
 * 从节点中提取纯文本
 */
function extractTextFromNode(node: TiptapNode): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(child => extractTextFromNode(child)).join('');
  }

  return '';
}

