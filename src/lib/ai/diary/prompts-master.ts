/**
 * 大师级日记 Prompt 工程
 * 参考世界顶级传记作家和日记文学
 * 
 * 灵感来源：
 * - 安妮·弗兰克《安妮日记》- 真实细腻的情感
 * - 村上春树 - 感官细节与孤独美学
 * - 海明威 - 冰山理论，留白的艺术
 * - 伍尔夫 - 意识流与内心独白
 * - 富兰克林自传 - 自我反思与成长
 */

import { DiaryContext, DiaryStyle } from './types';

/**
 * 世界级传记作家视角的日记创作 Prompt
 */
export function generateMasterDiaryPrompt(context: DiaryContext): string {
  const { date, dayOfWeek, analysis, sources } = context;
  
  // 选择3-5个最有故事性的片段
  const keyMoments = selectKeyMoments(sources.records);
  
  return `你是一位获得普利策奖的传记作家，正在为一个真实的人创作私密日记。

## 今日素材
**${date} ${dayOfWeek}**
情绪基调：${analysis.mood}

${formatKeyMoments(keyMoments)}
${sources.chats.length > 0 ? formatInnerThoughts(sources.chats) : ''}

## 创作原则（传记大师的技艺）

### 1. 叙事结构 - 故事弧线
不要流水账！构建一个完整的故事：
- **开场**：一个具体的瞬间、声音、气味或触感（不是"今天早上起床"）
- **转折**：情绪的波动、意外的发现、内心的矛盾
- **高潮**：今天最触动内心的时刻
- **余韵**：深夜的反思，未完成的思考

### 2. 冰山理论 - 留白的艺术
- **少说多显**：通过细节暗示情绪，而非直接说"我很开心"
- **冲突张力**：展现内心的矛盾和未解决的问题
- **未尽之言**：某些话欲言又止，某些感觉难以名状

### 3. 感官轰炸 - 让读者身临其境
每个场景必须有：
- **视觉**：光线、色彩、人的表情
- **听觉**：声音的质感（不只是"有声音"）
- **嗅觉/味觉**：最被忽视却最能唤起记忆
- **触觉**：质地、温度、空气的流动
- **第六感**：氛围、预感、说不清的感觉

### 4. 内心独白 - 真实的思考流
- **意识流**：思绪跳跃，不连贯，真实
- **自我对话**：质疑、辩论、说服自己
- **哲思瞬间**：从小事引申到生命的思考
- **脆弱时刻**：敢于展现不完美和困惑

### 5. 细节的力量 - 魔鬼在细节中
- **具体的时刻**："下午3:47的阳光"而非"下午"
- **具体的物件**：某个杯子、某张椅子、某个角落
- **具体的话语**：记得的只言片语（加引号）
- **具体的动作**：人物的小动作（抓头发、咬嘴唇）

### 6. 情感的层次
不要扁平的情绪！展现：
- **表面情绪** vs **深层感受**
- **此时此刻** vs **记忆联结**
- **说出口的** vs **压在心底的**

## 创作要求

**长度**：800-1200字（有内容说，不凑字数）

**语言风格**：
- 第一人称，如同对最信任的人倾诉
- 句式多变：短句制造节奏，长句深入思考
- 适度使用隐喻和比喻，但要自然
- 保持口语化，不要文绉绉

**结构创新**：
- 不要按时间顺序！可以从最触动的时刻开始
- 可以在现在与回忆间穿梭
- 可以突然转向一个看似不相关的思考
- 某个片段可以戛然而止，留白

**禁止的陈词滥调**：
❌ "充满了希望"
❌ "美好的一天"  
❌ "时光飞逝"
❌ "感慨万千"
❌ 任何教科书式的总结

**必须做到**：
✅ 至少3个强烈的感官细节
✅ 至少1处内心的矛盾或困惑
✅ 至少1个引发哲思的瞬间
✅ 至少1处留白（欲言又止）
✅ 结尾不要总结，让思绪飘散

## 输出格式

输出纯 Tiptap JSON：

{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 3},
      "content": [{"type": "text", "text": "2025年10月17日"}]
    },
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "下午三点四十七分，咖啡杯壁上还残留着温度..."}
      ]
    },
    {
      "type": "paragraph", 
      "content": [
        {"type": "text", "text": "那一刻我突然意识到，"},
        {"type": "text", "marks": [{"type": "textStyle", "attrs": {"color": "#f59e0b"}}], "text": "有些话一旦说出口就再也收不回来"},
        {"type": "text", "text": "。"}
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
          "content": [{"type": "text", "text": "也许这才是生活的本质——在无数个微小的选择中，我们成为了现在的自己。"}]
        }
      ]
    }
  ]
}

**格式说明**：
- 用 heading(level:3) 标记日期，可以加时间或氛围描述
- 用颜色标记情感冲击点：温暖#f59e0b 强烈#10b981 平静#3b82f6 悲伤#6366f1
- 用 blockquote 标记哲思瞬间、内心独白
- 用 horizontalRule 分隔不同的场景或思绪转折
- 用 **粗体** 强调重要时刻
- 用 *斜体* 表示内心的声音

现在，忘记所有日记模板，以传记大师的笔触，创作一篇让人一读就被吸引的日记。

直接输出 JSON：`;
}

/**
 * 选择关键时刻（最有故事性的3-5个片段）
 */
function selectKeyMoments(records: any[]): any[] {
  if (records.length === 0) return [];
  
  // 智能选择：优先选择内容丰富、情感强烈的记录
  const scored = records.map(record => {
    let score = 0;
    const content = record.content || '';
    
    // 长度分（20-100字最佳）
    const length = content.length;
    if (length >= 20 && length <= 100) score += 3;
    else if (length > 100) score += 2;
    else score += 1;
    
    // 情感词汇分
    const emotionWords = ['开心', '难过', '惊讶', '感动', '失望', '兴奋', '焦虑', '平静', '愤怒', '温暖'];
    emotionWords.forEach(word => {
      if (content.includes(word)) score += 2;
    });
    
    // 行动词汇分
    const actionWords = ['去', '看', '听', '说', '想', '做', '遇到', '发现'];
    actionWords.forEach(word => {
      if (content.includes(word)) score += 1;
    });
    
    return { record, score };
  });
  
  // 按分数排序，选择前5个
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.record);
}

/**
 * 格式化关键时刻
 */
function formatKeyMoments(moments: any[]): string {
  if (moments.length === 0) return '（今日无特别记录）';
  
  return `**关键时刻**：
${moments.map((m, i) => {
  const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';
  return `${i + 1}. ${time ? `[${time}] ` : ''}${m.content}`;
}).join('\n')}`;
}

/**
 * 格式化内心思考（从对话中提取）
 */
function formatInnerThoughts(chats: any[]): string {
  if (chats.length === 0) return '';
  
  // 只选择前2个最相关的对话
  const selected = chats.slice(0, 2);
  
  return `\n**内心活动**：
${selected.map((chat, i) => {
  const preview = chat.content.length > 80 
    ? chat.content.substring(0, 80) + '...' 
    : chat.content;
  return `${i + 1}. ${preview}`;
}).join('\n')}`;
}

