/**
 * 日记生成 Prompt 工程系统
 * 基于 Notion AI 的最佳实践
 */

import { DiaryContext, DiarySource } from './types';

/**
 * 格式化数据源（优化版）
 */
function formatSourcesOptimized(sources: DiarySource[], maxCount: number = 8): string {
  if (sources.length === 0) return '无';
  
  const limitedSources = sources.slice(0, maxCount);
  
  return limitedSources.map((source) => {
    const time = source.timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return `[${time}] ${source.content.substring(0, 200)}${source.content.length > 200 ? '...' : ''}`;
  }).join('\n');
}

/**
 * 格式化聊天数据源（优化版）
 */
function formatChatSourcesOptimized(sources: DiarySource[], maxCount: number = 3): string {
  if (sources.length === 0) return '无';
  
  const limitedSources = sources.slice(0, maxCount);
  
  return limitedSources.map(source => {
    return `主题对话：\n${source.content.substring(0, 300)}${source.content.length > 300 ? '...' : ''}`;
  }).join('\n\n');
}

/**
 * 生成极简高效的日记创作 Prompt（业内最佳实践）
 */
export function generateDiaryPrompt(
  context: DiaryContext
): string {
  return `将以下生活片段转化为一篇温暖、真实、生动的日记（500-800字）。

日期：${context.date} ${context.dayOfWeek}
情绪：${context.analysis.mood}

生活片段：
${formatSourcesOptimized(context.sources.records, 8)}
${context.sources.chats.length > 0 ? '\n对话摘要：\n' + formatChatSourcesOptimized(context.sources.chats, 3) : ''}

输出格式：Tiptap JSON

正确的格式示例：
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 3},
      "content": [{"type": "text", "text": "⏰ 早晨·7:30"}]
    },
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "清晨的阳光透过窗帘洒进来，"},
        {"type": "text", "marks": [{"type": "textStyle", "attrs": {"color": "#f59e0b"}}], "text": "温暖"},
        {"type": "text", "text": "而柔和。"}
      ]
    },
    {
      "type": "horizontalRule"
    },
    {
      "type": "blockquote",
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "今天最重要的领悟：慢下来，才能看清生活的细节。"}]
        }
      ]
    }
  ]
}

关键点：
- 颜色标记用 marks 数组，不是单独的节点
- 温暖:#f59e0b 喜悦:#10b981 平静:#3b82f6 浪漫:#ec4899
- 用 heading(level:3) 标记时间节点
- 用 horizontalRule 分隔时段
- 用 blockquote 突出反思

直接输出 JSON：`;
}