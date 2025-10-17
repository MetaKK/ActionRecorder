/**
 * AI 日记生成器
 * 整合所有模块，生成日记
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { Record } from '@/lib/types';
import { DiarySource } from './types';
import {
  Diary,
  DiaryContext,
  DiaryStyle,
  DiaryGenerationOptions,
  DiaryGenerationProgress,
  DiaryGenerationStatus,
  DiaryMetadata,
  DiaryContent,
  Citation,
} from './types';
import {
  extractRecordSources,
  extractChatSources,
  filterTodaySources,
  groupSourcesByType,
  mergeSources,
} from './sources';
import {
  analyzeDailySources,
  analyzeHistoricalContext,
} from './analyzer';
import { generateDiaryPrompt } from './prompts';
import { generateMasterDiaryPrompt } from './prompts-master';
import { validateTiptapJSON, countWords } from './tiptap-config';
import { formatDate } from '@/lib/utils/date';
import { deepFixTiptapJSON, validateAndFixTiptapJSON } from './json-fixer';

/**
 * 生成日记（主函数）
 */
export async function generateDiary(
  records: Record[],
  options: DiaryGenerationOptions,
  onProgress?: (progress: DiaryGenerationProgress) => void
): Promise<Diary> {
  try {
    // 1. 收集数据源
    onProgress?.({
      status: DiaryGenerationStatus.ANALYZING,
      progress: 10,
      message: '正在收集数据源...',
      currentStep: '数据收集',
    });

    const recordSources = extractRecordSources(records);
    const chatSources = extractChatSources();
    const allSources = mergeSources(recordSources, chatSources);
    const todaySources = filterTodaySources(allSources);
    const groupedSources = groupSourcesByType(todaySources);

    // 2. 分析数据
    onProgress?.({
      status: DiaryGenerationStatus.ANALYZING,
      progress: 30,
      message: '正在分析今日数据...',
      currentStep: '数据分析',
    });

    const analysis = analyzeDailySources(groupedSources);
    const historicalContext = analyzeHistoricalContext(records);

    // 3. 构建上下文
    const context: DiaryContext = {
      date: formatDate(new Date()),
      dayOfWeek: getDayOfWeek(),
      weather: await getWeather(), // 可选的天气API
      sources: groupedSources,
      analysis,
      historicalContext,
    };

    // 4. 生成日记
    onProgress?.({
      status: DiaryGenerationStatus.GENERATING,
      progress: 50,
      message: 'AI 正在创作日记...',
      currentStep: '日记生成',
    });

    const diaryContent = await generateDiaryContent(context, options.style, onProgress);

    // 5. 构建完整的日记对象
    onProgress?.({
      status: DiaryGenerationStatus.GENERATING,
      progress: 90,
      message: '正在整理日记...',
      currentStep: '完成整理',
    });

    const metadata: DiaryMetadata = {
      id: `diary_${Date.now()}`,
      date: context.date,
      generatedAt: new Date(),
      style: options.style,
      wordCount: countWords(diaryContent.document),
      mood: analysis.mood,
      tags: analysis.topics.slice(0, 5),
      sources: {
        recordsCount: groupedSources.records.length,
        chatsCount: groupedSources.chats.length,
        filesCount: groupedSources.files.length,
      },
      version: 1,
    };

    const citations: Citation[] = options.includeCitations
      ? generateCitations(groupedSources)
      : [];

    const diary: Diary = {
      metadata,
      content: diaryContent,
      citations,
      images: options.includeImages ? extractImages(records) : [],
    };

    onProgress?.({
      status: DiaryGenerationStatus.COMPLETED,
      progress: 100,
      message: '日记生成完成！',
      currentStep: '完成',
    });

    return diary;
  } catch (error) {
    console.error('Failed to generate diary:', error);
    onProgress?.({
      status: DiaryGenerationStatus.ERROR,
      progress: 0,
      message: error instanceof Error ? error.message : '生成失败',
      currentStep: '错误',
    });
    throw error;
  }
}

/**
 * 生成日记内容（调用 AI）
 */
async function generateDiaryContent(
  context: DiaryContext,
  style: DiaryStyle,
  onProgress?: (progress: DiaryGenerationProgress) => void
): Promise<DiaryContent> {
  // 获取 API Key
  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置中配置');
  }

  // 使用大师级 Prompt（世界级传记作家风格）
  const prompt = generateMasterDiaryPrompt(context);
  
  console.log('🎨 Using Master Diary Prompt');
  console.log('Prompt length:', prompt.length, 'characters');

  // 调用 AI
  const openai = createOpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.openai.com/v1',
  });

  let fullResponse = '';
  let progress = 50;

  try {
    const result = await streamText({
      model: openai('gpt-4o'), // GPT-4o 最适合创意写作和叙事
      messages: [
        {
          role: 'system',
          content: '你是一位获得普利策奖的传记作家，擅长创作真实、生动、有冲击力的日记。你的文字能够捕捉生活中最细微的情感波动和最深刻的人性洞察。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9, // 提高创造性，允许更多意想不到的表达
    });

    // 处理流式响应
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      progress = Math.min(85, progress + 1);
      onProgress?.({
        status: DiaryGenerationStatus.GENERATING,
        progress,
        message: 'AI 正在创作中...',
        currentStep: '生成内容',
      });
    }

    // 解析 JSON
    let diaryJSON;
    try {
      // 尝试提取 JSON（可能被包裹在其他文本中）
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      let jsonString = jsonMatch ? jsonMatch[0] : fullResponse;
      
      // 修复常见的 JSON 语法错误
      jsonString = fixJSONSyntax(jsonString);
      
      diaryJSON = JSON.parse(jsonString);
      
      // 修复 Tiptap JSON 格式错误（如 textStyle 作为节点而不是 mark）
      diaryJSON = deepFixTiptapJSON(diaryJSON);
      
      console.log('Fixed Tiptap JSON:', JSON.stringify(diaryJSON, null, 2));
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Response:', fullResponse);
      throw new Error('AI 返回的格式无效，请重试');
    }

    // 验证格式
    if (!validateTiptapJSON(diaryJSON)) {
      throw new Error('生成的日记格式无效');
    }

    return {
      format: 'tiptap-json',
      version: '1.0',
      document: diaryJSON,
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

/**
 * 修复 JSON 语法错误
 */
function fixJSONSyntax(jsonString: string): string {
  let fixed = jsonString;
  
  try {
    // 先尝试直接解析，如果成功就不需要修复
    JSON.parse(fixed);
    return fixed;
  } catch (e) {
    // 如果解析失败，尝试修复常见错误
    console.log('Attempting to fix JSON syntax...');
    console.log('Original error:', e);
    
    // 1. 修复未加引号的属性名（更精确的匹配）
    // 匹配类似 "text: " 或 "type: " 这样的错误
    fixed = fixed.replace(/(\s+)(\w+)(\s*):(\s*)/g, '$1"$2"$3:$4');
    
    // 2. 修复单引号为双引号
    fixed = fixed.replace(/'/g, '"');
    
    // 3. 修复尾随逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 4. 修复可能的其他常见错误
    // 修复类似 { text: "value" } 这样的错误
    fixed = fixed.replace(/(\s+)(\w+)(\s*):(\s*)([^"][^,}]*)/g, '$1"$2"$3:$4"$5"');
    
    // 5. 再次尝试解析
    try {
      JSON.parse(fixed);
      console.log('JSON syntax fixed successfully');
      return fixed;
    } catch (e2) {
      console.log('Still failed after fixing, original JSON:', jsonString.substring(0, 200) + '...');
      console.log('Fixed JSON:', fixed.substring(0, 200) + '...');
      throw e2;
    }
  }
}

/**
 * 获取 API Key
 */
function getAPIKey(): string | null {
  // 优先从 sessionStorage 获取（用户设置的）
  if (typeof window !== 'undefined') {
    const sessionKey = sessionStorage.getItem('api_key');
    if (sessionKey) return sessionKey;
    
    // 尝试从 localStorage 获取
    const localKey = localStorage.getItem('api_key');
    if (localKey) return localKey;
    
    // 尝试从环境变量获取
    const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (envKey) return envKey;
  }
  
  // 服务端环境变量
  return process.env.OPENAI_API_KEY || null;
}

/**
 * 获取星期几
 */
function getDayOfWeek(): string {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[new Date().getDay()];
}

/**
 * 获取天气（示例）
 */
async function getWeather(): Promise<string | undefined> {
  // 实际应用中可以调用天气 API
  // 这里返回 undefined，表示不使用天气信息
  return undefined;
}

/**
 * 生成引用列表
 */
function generateCitations(sources: {
  records: DiarySource[];
  chats: DiarySource[];
  files: DiarySource[];
  notes: DiarySource[];
}): Citation[] {
  const citations: Citation[] = [];

  sources.records.forEach(source => {
    citations.push({
      id: source.id,
      sourceType: source.type,
      sourceId: source.id,
      excerpt: source.content.substring(0, 100),
      timestamp: source.timestamp,
    });
  });

  return citations;
}

/**
 * 提取图片
 */
function extractImages(records: Record[]): string[] {
  const images: string[] = [];

  records.forEach(record => {
    if (record.images && record.images.length > 0) {
      record.images.forEach(img => {
        images.push(img.data);
      });
    }
  });

  return images;
}

/**
 * 重新生成日记（基于现有日记）
 */
export async function regenerateDiary(
  existingDiary: Diary,
  records: Record[],
  newStyle?: DiaryStyle,
  onProgress?: (progress: DiaryGenerationProgress) => void
): Promise<Diary> {
  const options: DiaryGenerationOptions = {
    style: newStyle || existingDiary.metadata.style,
    includeImages: existingDiary.images ? existingDiary.images.length > 0 : false,
    includeCitations: existingDiary.citations.length > 0,
  };

  const newDiary = await generateDiary(records, options, onProgress);

  // 保留编辑历史
  newDiary.metadata.editHistory = [
    ...(existingDiary.metadata.editHistory || []),
    {
      timestamp: new Date(),
      type: 'regenerate',
      changes: `风格从 ${existingDiary.metadata.style} 改为 ${newStyle}`,
    },
  ];

  newDiary.metadata.version = (existingDiary.metadata.version || 1) + 1;

  return newDiary;
}

