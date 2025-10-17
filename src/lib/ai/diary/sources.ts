/**
 * 日记数据源管理器
 * 负责收集和整理各种数据源
 */

import { Record } from '@/lib/types';
import { DiarySource, DiarySourceType } from './types';

/**
 * 从生活记录提取数据源
 */
export function extractRecordSources(records: Record[]): DiarySource[] {
  return records.map(record => ({
    type: DiarySourceType.RECORDS,
    id: record.id,
    timestamp: record.createdAt,
    content: record.content,
    metadata: {
      location: record.location,
      hasAudio: record.hasAudio,
      hasImages: record.hasImages,
      tags: [], // 可以后续实现标签提取
    },
  }));
}

/**
 * 从 AI 聊天记录提取数据源
 * 注意：需要实现聊天记录的存储和检索
 */
export function extractChatSources(chatId?: string): DiarySource[] {
  try {
    if (!chatId) {
      // 获取今日所有聊天
      const allChats = getAllTodayChats();
      console.log(`Found ${allChats.length} chat sources`);
      return allChats;
    }
    
    // 获取特定聊天
    const chat = getChatById(chatId);
    return chat ? [chat] : [];
  } catch (error) {
    console.error('Failed to extract chat sources:', error);
    return [];
  }
}

/**
 * 调试函数：检查 localStorage 中的聊天数据
 */
export function debugChatData(): void {
  console.log('=== Debug Chat Data ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chat_')) {
      const data = localStorage.getItem(key);
      console.log(`Key: ${key}`);
      console.log(`Data type: ${typeof data}`);
      console.log(`Data length: ${data?.length || 0}`);
      console.log(`Data preview: ${data?.substring(0, 100)}...`);
      console.log(`Is JSON: ${data?.trim().startsWith('[') || data?.trim().startsWith('{')}`);
      console.log('---');
    }
  }
}

/**
 * 获取今日所有聊天记录
 */
function getAllTodayChats(): DiarySource[] {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sources: DiarySource[] = [];
    
    interface ChatMessage {
      role: string;
      content: string;
      timestamp: string | Date;
    }
    
    // 遍历 localStorage 中的聊天记录
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat_')) {
        const chatData = localStorage.getItem(key);
        if (chatData) {
          try {
            // 检查数据是否看起来像 JSON
            if (!chatData.trim().startsWith('[') && !chatData.trim().startsWith('{')) {
              console.warn(`Skipping non-JSON chat data for key: ${key}`);
              console.log('Data preview:', chatData.substring(0, 50) + '...');
              continue;
            }
            
            const messages = JSON.parse(chatData) as ChatMessage[];
            const chatId = key.replace('chat_', '');
            
            // 确保 messages 是数组
            if (!Array.isArray(messages)) {
              console.warn(`Chat data is not an array for key: ${key}`);
              continue;
            }
            
            // 过滤今日消息
            const todayMessages = messages.filter((msg) => {
              if (!msg || typeof msg !== 'object') return false;
              if (!msg.timestamp || !msg.content) return false;
              
              const msgDate = new Date(msg.timestamp);
              return msgDate >= today && !isNaN(msgDate.getTime());
            });
            
            // 将对话转换为数据源
            todayMessages.forEach((msg, index) => {
              if (msg.role === 'user' || msg.role === 'assistant') {
                sources.push({
                  type: DiarySourceType.CHATS,
                  id: `${chatId}_${index}`,
                  timestamp: new Date(msg.timestamp),
                  content: msg.content,
                  metadata: {
                    chatModel: localStorage.getItem(`chat_model_${chatId}`) || 'unknown',
                  },
                });
              }
            });
          } catch (e) {
            console.error(`Failed to parse chat data for key ${key}:`, e);
            console.log('Raw data:', chatData.substring(0, 100) + '...');
            // 不要抛出错误，继续处理其他数据
          }
        }
      }
    }
    
    return sources;
  } catch (error) {
    console.error('Failed to get today chats:', error);
    return [];
  }
}

/**
 * 获取特定聊天记录
 */
function getChatById(chatId: string): DiarySource | null {
  try {
    const chatData = localStorage.getItem(`chat_${chatId}`);
    if (!chatData) return null;
    
    // 检查数据是否看起来像 JSON
    if (!chatData.trim().startsWith('[') && !chatData.trim().startsWith('{')) {
      console.warn(`Chat data is not JSON for chatId: ${chatId}`);
      return null;
    }
    
    interface ChatMessage {
      role: string;
      content: string;
      timestamp: string | Date;
    }
    
    const messages = JSON.parse(chatData) as ChatMessage[];
    
    // 确保 messages 是数组
    if (!Array.isArray(messages)) {
      console.warn(`Chat data is not an array for chatId: ${chatId}`);
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 合并今日的所有消息
    const todayMessages = messages
      .filter((msg) => {
        if (!msg || typeof msg !== 'object') return false;
        if (!msg.timestamp || !msg.content) return false;
        
        const msgDate = new Date(msg.timestamp);
        return msgDate >= today && !isNaN(msgDate.getTime());
      })
      .map((msg) => `${msg.role === 'user' ? '我' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    
    if (!todayMessages) return null;
    
    return {
      type: DiarySourceType.CHATS,
      id: chatId,
      timestamp: new Date(),
      content: todayMessages,
      metadata: {
        chatModel: localStorage.getItem(`chat_model_${chatId}`) || 'unknown',
      },
    };
  } catch (error) {
    console.error('Failed to get chat by id:', error);
    return null;
  }
}

/**
 * 从导入文件提取数据源
 */
export function extractFileSources(files: File[]): Promise<DiarySource[]> {
  return Promise.all(
    files.map(async (file) => {
      const content = await readFileContent(file);
      return {
        type: DiarySourceType.IMPORTED_FILES,
        id: `file_${Date.now()}_${file.name}`,
        timestamp: new Date(),
        content: content,
        metadata: {
          fileName: file.name,
          fileType: file.type,
        },
      };
    })
  );
}

/**
 * 读取文件内容
 */
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // 根据文件类型选择读取方式
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      // 对于其他类型，读取为 base64
      reader.readAsDataURL(file);
    }
  });
}

/**
 * 从手动笔记提取数据源
 */
export function extractNoteSources(notes: string[]): DiarySource[] {
  return notes.map((note, index) => ({
    type: DiarySourceType.MANUAL_NOTES,
    id: `note_${Date.now()}_${index}`,
    timestamp: new Date(),
    content: note,
    metadata: {},
  }));
}

/**
 * 按时间排序数据源
 */
export function sortSourcesByTime(sources: DiarySource[]): DiarySource[] {
  return [...sources].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * 过滤今日数据源
 */
export function filterTodaySources(sources: DiarySource[]): DiarySource[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return sources.filter(source => {
    const sourceDate = new Date(source.timestamp);
    return sourceDate >= today && sourceDate < tomorrow;
  });
}

/**
 * 按类型分组数据源
 */
export function groupSourcesByType(sources: DiarySource[]): {
  records: DiarySource[];
  chats: DiarySource[];
  files: DiarySource[];
  notes: DiarySource[];
} {
  return {
    records: sources.filter(s => s.type === DiarySourceType.RECORDS),
    chats: sources.filter(s => s.type === DiarySourceType.CHATS),
    files: sources.filter(s => s.type === DiarySourceType.IMPORTED_FILES),
    notes: sources.filter(s => s.type === DiarySourceType.MANUAL_NOTES),
  };
}

/**
 * 获取数据源统计信息
 */
export function getSourcesStats(sources: DiarySource[]) {
  const grouped = groupSourcesByType(sources);
  
  return {
    total: sources.length,
    records: grouped.records.length,
    chats: grouped.chats.length,
    files: grouped.files.length,
    notes: grouped.notes.length,
    totalWords: sources.reduce((sum, source) => sum + source.content.length, 0),
    hasLocation: sources.some(s => s.metadata?.location),
    hasAudio: sources.some(s => s.metadata?.hasAudio),
    hasImages: sources.some(s => s.metadata?.hasImages),
  };
}

/**
 * 合并多个数据源
 */
export function mergeSources(...sourcesArrays: DiarySource[][]): DiarySource[] {
  const allSources = sourcesArrays.flat();
  return sortSourcesByTime(allSources);
}

