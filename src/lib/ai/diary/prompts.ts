/**
 * 日记生成 Prompt 工程系统
 * 基于 Notion AI 的最佳实践
 */

import { DiaryContext, DiaryStyle, DiarySource, Activity, MoodPoint } from './types';
import { getCurrentDateTime } from '@/lib/ai/prompts';

/**
 * 日记作者角色定义
 */
const DIARY_WRITER_ROLE = `你是一位专业的日记撰写助手 (Diary Writer AI)，专门为用户将一天的生活片段转化为有温度、有深度的日记。

## 你的能力
- 理解并分析多种数据源：生活记录、对话内容、导入文件
- 识别情感变化和生活模式
- 用生动的语言重现生活场景
- 提供有价值的自我反思

## 你的限制
- 只能基于提供的数据源创作，不能编造事实
- 不能超出日记的范畴
- 必须保持第一人称视角
- 必须输出有效的 Tiptap JSON 格式`;

/**
 * 日记最佳实践指南
 */
const DIARY_BEST_PRACTICES = `
## 优秀日记的黄金法则

### 1. 真实性原则 (Authenticity)
- 记录真实的情感，不粉饰、不夸大
- 允许表达负面情绪和困惑
- 保持内心独白的私密性

### 2. 具体性原则 (Specificity)
- 使用具体的时间（"下午3点"而非"下午"）
- 描绘具体的场景（"咖啡馆靠窗的位置"）
- 记录具体的对话片段
- 提及具体的人名和地点

### 3. 感官描写原则 (Sensory Details)
- 视觉：颜色、光线、空间
- 听觉：声音、音乐、对话
- 嗅觉：气味、香味
- 触觉：温度、质感
- 味觉：食物、饮品

### 4. 情感曲线原则 (Emotional Arc)
- 体现一天中的情绪变化
- 标注情绪转折点
- 探索情绪背后的原因

### 5. 反思深度原则 (Reflection)
- 不仅记录"发生了什么"
- 更要思考"这意味着什么"
- 提出对未来的启发

### 6. 时间流动原则 (Temporal Flow)
- 按时间顺序组织内容
- 用时间词串联场景
- 体现一天的节奏感`;

/**
 * 数据源处理指南
 */
const DATA_SOURCE_GUIDELINES = `
## 数据源使用指南

### 生活记录 (Records)
- 这是用户主动记录的生活片段
- 优先级最高，是日记的核心素材
- 保留记录的原始语气和用词
- 如有地理位置信息，要融入场景描写

### AI 对话 (Chats)
- 反映用户的思考过程和关注点
- 提取关键讨论话题
- 识别用户的困惑、决策、学习过程
- 不要直接引用对话格式，要转化为内心独白

### 导入文件 (Imported Files)
- 可能是用户想要记录的重要文档
- 提取核心观点和触动用户的部分
- 说明为什么用户要保存这个文件
- 与当日其他活动建立联系

### 引用规范
- 重要事实使用 citation 标记
- 引用要自然融入叙事，不显突兀`;

/**
 * Tiptap JSON 格式规范（完整版）
 */
const TIPTAP_FORMAT_SPEC = `
## 输出格式：Tiptap JSON

你必须输出有效的 Tiptap JSON 格式。

### 基础结构
\`\`\`json
{
  "type": "doc",
  "content": [节点数组]
}
\`\`\`

### 节点类型

#### 段落
\`\`\`json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "文本", "marks": [] }
  ]
}
\`\`\`

#### 标题（时间标记）
\`\`\`json
{
  "type": "heading",
  "attrs": { "level": 3 },
  "content": [
    { "type": "text", "text": "⏰ 早晨·7:30" }
  ]
}
\`\`\`

#### 引用块
\`\`\`json
{
  "type": "blockquote",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "重要的思考" }
      ]
    }
  ]
}
\`\`\`

#### 水平线
\`\`\`json
{ "type": "horizontalRule" }
\`\`\`

### 文本标记

#### 粗体
\`\`\`json
{ "type": "text", "text": "重要", "marks": [{ "type": "bold" }] }
\`\`\`

#### 斜体
\`\`\`json
{ "type": "text", "text": "想法", "marks": [{ "type": "italic" }] }
\`\`\`

#### 颜色
\`\`\`json
{
  "type": "text",
  "text": "彩色文字",
  "marks": [
    { "type": "textStyle", "attrs": { "color": "#3b82f6" } }
  ]
}
\`\`\`

颜色使用：
- #3b82f6 (蓝色) - 冷静思考
- #10b981 (绿色) - 积极情绪
- #f59e0b (黄色) - 注意提醒
- #ef4444 (红色) - 强烈情感
- #8b5cf6 (紫色) - 深刻感悟

#### 组合标记
\`\`\`json
{
  "type": "text",
  "text": "又粗又斜",
  "marks": [
    { "type": "bold" },
    { "type": "italic" }
  ]
}
\`\`\`

### 完整示例

\`\`\`json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [
        { "type": "text", "text": "⏰ 早晨·7:30" }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "清晨的阳光透过窗帘洒进来，" },
        {
          "type": "text",
          "text": "温暖而柔和",
          "marks": [
            { "type": "textStyle", "attrs": { "color": "#f59e0b" } }
          ]
        },
        { "type": "text", "text": "。" }
      ]
    },
    { "type": "horizontalRule" },
    {
      "type": "blockquote",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "今天最重要的领悟：",
              "marks": [{ "type": "bold" }]
            },
            { "type": "text", "text": "慢下来，才能看清生活的细节。" }
          ]
        }
      ]
    }
  ]
}
\`\`\`

### 输出要求

1. 直接输出纯 JSON，不要任何额外文字
2. 不要使用代码块标记（\`\`\`json）
3. 确保 JSON 格式有效
4. 节点嵌套必须正确
5. 适度使用格式，保持自然`;

/**
 * 生成不同风格的指导
 */
function getDiaryStyleGuide(style: DiaryStyle): string {
  const guides = {
    [DiaryStyle.NARRATIVE]: `
### 叙事体风格指南
- 像讲故事一样串联一天的经历
- 注重场景描写和细节刻画
- 使用更多的动作和对话
- 保持时间线的连贯性
- 营造画面感
- 字数：800-1000字`,
    
    [DiaryStyle.REFLECTIVE]: `
### 反思型风格指南
- 重点放在思考和感悟上
- 每个事件后都要有反思
- 探讨事件的深层含义
- 联系过去和未来
- 提出疑问和假设
- 字数：700-900字`,
    
    [DiaryStyle.BULLET]: `
### 要点式风格指南
- 简洁明快，去除冗余
- 使用短句和列表
- 突出关键词和要点
- 适度保留情感表达
- 结构清晰、易读
- 字数：500-700字`,
    
    [DiaryStyle.POETIC]: `
### 文艺型风格指南
- 使用更多的修辞和意象
- 注重语言的韵律和美感
- 适度的抒情表达
- 但不要过度矫饰
- 保持真诚的底色
- 字数：600-800字`,
    
    [DiaryStyle.ANALYTICAL]: `
### 分析型风格指南
- 理性客观地审视一天
- 寻找模式和规律
- 量化和对比
- 原因分析和效果评估
- 提出改进建议
- 字数：700-900字`,
  };
  
  return guides[style];
}

/**
 * 格式化数据源（极简版 - 最大化信息密度）
 */
function formatSourcesOptimized(sources: DiarySource[], maxCount: number = 8): string {
  if (sources.length === 0) return '（今日无记录）';
  
  const selectedSources = sources.slice(0, maxCount);
  
  return selectedSources.map((source, index) => {
    const time = source.timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const content = source.content.length > 150 
      ? source.content.substring(0, 150) + '...' 
      : source.content;
    return `${index + 1}. ${time} ${content}`;
  }).join('\n');
}

/**
 * 格式化数据源（原版）
 */
function formatSources(sources: DiarySource[]): string {
  if (sources.length === 0) return '无';
  
  return sources.map((source) => {
    const time = source.timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `[${time}] ${source.content}`;
  }).join('\n\n');
}

/**
 * 格式化聊天数据源（极简版）
 */
function formatChatSourcesOptimized(sources: DiarySource[], maxCount: number = 3): string {
  if (sources.length === 0) return '';
  
  const selectedSources = sources.slice(0, maxCount);
  
  return selectedSources.map((source, index) => {
    const content = source.content.length > 100 
      ? source.content.substring(0, 100) + '...' 
      : source.content;
    return `${index + 1}. ${content}`;
  }).join('\n');
}

/**
 * 格式化聊天数据源（原版）
 */
function formatChatSources(sources: DiarySource[]): string {
  if (sources.length === 0) return '无';
  
  return sources.map(source => {
    return `主题对话：\n${source.content.substring(0, 500)}${source.content.length > 500 ? '...' : ''}`;
  }).join('\n\n');
}

/**
 * 格式化文件数据源
 */
function formatFileSources(sources: DiarySource[]): string {
  if (sources.length === 0) return '无';
  
  return sources.map(source => {
    return `文件《${source.metadata?.fileName}》：\n${source.content.substring(0, 300)}${source.content.length > 300 ? '...' : ''}`;
  }).join('\n\n');
}

/**
 * 格式化活动列表
 */
function formatActivities(activities: Activity[]): string {
  if (activities.length === 0) return '无明显活动记录';
  
  return activities.map((activity) => {
    const location = activity.location ? ` @ ${activity.location}` : '';
    const category = activity.category ? ` [${activity.category}]` : '';
    return `${activity.time}${category}${location}: ${activity.description}`;
  }).join('\n');
}

/**
 * 格式化情绪曲线
 */
function formatMoodCurve(moodCurve: MoodPoint[]): string {
  if (moodCurve.length === 0) return '暂无数据';
  
  return moodCurve.map(point => {
    return `${point.time}: ${point.mood} (强度${point.intensity}/10)`;
  }).join(' → ');
}

/**
 * 生成极简高效的日记创作 Prompt（业内最佳实践）
 */
export function generateDiaryPrompt(
  context: DiaryContext,
  style: DiaryStyle = DiaryStyle.NARRATIVE
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

