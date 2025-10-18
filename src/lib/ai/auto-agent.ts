/**
 * Auto Agent 智能调度系统
 * 参考Cursor Agent设计，实现智能模型选择和任务路由
 */

import { CoreMessage } from "ai";
import { AI_MODELS, AIModelConfig, ModelCapability } from "./config";
import { getAvailableProviders } from "./providers";

// 任务类型识别
export enum TaskType {
  GENERAL_CHAT = "general_chat",           // 普通对话
  DEEP_REASONING = "deep_reasoning",       // 深度思考
  CODE_GENERATION = "code_generation",     // 代码生成
  IMAGE_GENERATION = "image_generation",   // 图片生成
  IMAGE_UNDERSTANDING = "image_understanding", // 图片理解
  WEB_SEARCH = "web_search",              // 联网搜索
  QUICK_RESPONSE = "quick_response",      // 快速响应
}

// 任务分析结果
export interface TaskAnalysis {
  type: TaskType;
  complexity: "low" | "medium" | "high";
  requiresVision: boolean;
  requiresSearch: boolean;
  requiresReasoning: boolean;
  suggestedModel: string;
  confidence: number;
  reasoning: string;
}

/**
 * 分析用户输入，识别任务类型
 */
export function analyzeTask(messages: CoreMessage[]): TaskAnalysis {
  const lastMessage = messages[messages.length - 1];
  const content = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : lastMessage.content.map(c => c.type === 'text' ? c.text : '').join(' ');

  // 关键词匹配模式
  const patterns = {
    imageGeneration: /生成.*图|画.*图|创作.*图|设计.*图|制作.*图片|draw|generate.*image|create.*image/i,
    imageUnderstanding: /这.*图|图.*什么|看.*图|分析.*图|识别.*图|what.*image|describe.*image/i,
    deepReasoning: /深入.*分析|详细.*解释|为什么|如何.*实现|复杂.*问题|思考|推理|prove|explain.*detail|why|how.*implement/i,
    codeGeneration: /写.*代码|实现.*功能|编程|函数|class|代码|code|function|implement|program/i,
    webSearch: /最新.*消息|搜索|查找|新闻|实时|current|search|find|news|latest/i,
    quickResponse: /快速|简单.*回答|是.*不是|对.*错|quick|simple|yes.*no/i,
  };

  // 检测是否包含图片
  const hasImage = Array.isArray(lastMessage.content) && 
    lastMessage.content.some(c => c.type === 'image');

  // 任务识别逻辑
  let taskType: TaskType = TaskType.GENERAL_CHAT;
  let complexity: "low" | "medium" | "high" = "medium";
  let confidence = 0.6;
  let reasoning = "标准对话任务";

  if (hasImage) {
    taskType = TaskType.IMAGE_UNDERSTANDING;
    complexity = "medium";
    confidence = 0.9;
    reasoning = "检测到图片输入，使用多模态模型理解图片内容";
  } else if (patterns.imageGeneration.test(content)) {
    taskType = TaskType.IMAGE_GENERATION;
    complexity = "high";
    confidence = 0.85;
    reasoning = "检测到图片生成需求，使用专业图片生成模型";
  } else if (patterns.deepReasoning.test(content)) {
    taskType = TaskType.DEEP_REASONING;
    complexity = "high";
    confidence = 0.8;
    reasoning = "检测到复杂推理需求，使用深度思考模型";
  } else if (patterns.codeGeneration.test(content)) {
    taskType = TaskType.CODE_GENERATION;
    complexity = "high";
    confidence = 0.85;
    reasoning = "检测到代码生成需求，使用代码能力强的模型";
  } else if (patterns.webSearch.test(content)) {
    taskType = TaskType.WEB_SEARCH;
    complexity = "medium";
    confidence = 0.8;
    reasoning = "检测到联网搜索需求，使用搜索增强模型";
  } else if (patterns.quickResponse.test(content)) {
    taskType = TaskType.QUICK_RESPONSE;
    complexity = "low";
    confidence = 0.75;
    reasoning = "检测到简单问答需求，使用快速响应模型";
  }

  // 根据任务类型选择最佳模型
  const suggestedModel = selectBestModel(taskType, complexity);

  return {
    type: taskType,
    complexity,
    requiresVision: hasImage || taskType === TaskType.IMAGE_GENERATION || taskType === TaskType.IMAGE_UNDERSTANDING,
    requiresSearch: taskType === TaskType.WEB_SEARCH,
    requiresReasoning: taskType === TaskType.DEEP_REASONING,
    suggestedModel,
    confidence,
    reasoning,
  };
}

/**
 * 根据任务类型选择最佳模型
 */
function selectBestModel(taskType: TaskType, complexity: "low" | "medium" | "high"): string {
  const modelScores: Record<string, number> = {};
  
  // 获取可用的provider（有API Key的）
  const availableProviders = getAvailableProviders();

  AI_MODELS.forEach(model => {
    if (model.id === 'auto') return; // 跳过auto模式本身
    
    // 只评估有API Key的模型
    if (!availableProviders.includes(model.provider)) {
      return;
    }
    
    // Dream模型需要特殊的图片生成API，暂时不自动选择
    if (model.id === 'doubao-dream') {
      return;
    }

    let score = 0;

    switch (taskType) {
      case TaskType.IMAGE_GENERATION:
        if (model.id === 'doubao-dream') score = 100;
        else if (model.capabilities.includes(ModelCapability.VISION)) score = 50;
        break;

      case TaskType.IMAGE_UNDERSTANDING:
        if (model.id === 'doubao-1.6') score = 95;
        else if (model.id === 'gpt-4o') score = 90;
        else if (model.capabilities.includes(ModelCapability.VISION)) score = 70;
        break;

      case TaskType.DEEP_REASONING:
        if (model.id === 'o1-preview') score = 100;
        else if (model.id === 'o1-mini') score = 95;
        else if (model.id === 'doubao-1.6') score = 90; // 豆包1.6支持深度思考
        else if (model.capabilities.includes(ModelCapability.REASONING)) score = 70;
        break;

      case TaskType.CODE_GENERATION:
        if (model.id === 'gpt-4o') score = 95;
        else if (model.id === 'claude-3-5-sonnet') score = 100;
        else if (model.capabilities.includes(ModelCapability.CODE)) score = 70;
        break;

      case TaskType.WEB_SEARCH:
        if (model.id === 'sonar-pro') score = 100;
        else if (model.id === 'sonar') score = 90;
        else if (model.capabilities.includes(ModelCapability.SEARCH)) score = 80;
        break;

      case TaskType.QUICK_RESPONSE:
        if (model.id === 'doubao-1.6-flash') score = 95;
        else if (model.id === 'gpt-4o-mini') score = 100;
        else if (model.id === 'claude-3-5-haiku') score = 90;
        else if (model.capabilities.includes(ModelCapability.FAST)) score = 80;
        break;

      case TaskType.GENERAL_CHAT:
        if (model.id === 'gpt-4o-mini') score = 90;
        else if (model.id === 'gpt-4o') score = 85;
        else if (model.id === 'doubao-1.6-flash') score = 80;
        else if (model.capabilities.includes(ModelCapability.CHAT)) score = 60;
        break;
    }

    // 复杂度调整
    if (complexity === 'high' && model.contextWindow && model.contextWindow > 100000) {
      score += 10;
    }

    // 成本优化
    if (model.costPer1kTokens && model.costPer1kTokens.input < 0.001) {
      score += 5;
    }

    modelScores[model.id] = score;
  });

  // 选择得分最高的模型
  let bestModel = 'gpt-4o-mini'; // 默认模型
  let bestScore = 0;

  Object.entries(modelScores).forEach(([modelId, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestModel = modelId;
    }
  });

  return bestModel;
}

/**
 * Auto模式处理器
 * 分析消息并选择最优模型
 */
export function handleAutoMode(messages: CoreMessage[]): {
  selectedModel: string;
  analysis: TaskAnalysis;
} {
  const analysis = analyzeTask(messages);
  
  console.log('[Auto Agent] 任务分析:', {
    type: analysis.type,
    complexity: analysis.complexity,
    selectedModel: analysis.suggestedModel,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
  });

  return {
    selectedModel: analysis.suggestedModel,
    analysis,
  };
}

/**
 * 生成Auto模式的系统提示
 */
export function getAutoModeSystemPrompt(analysis: TaskAnalysis): string {
  const basePrompt = "你是一个智能AI助手，能够理解并处理各种类型的任务。";
  
  const taskSpecificPrompts: Record<TaskType, string> = {
    [TaskType.GENERAL_CHAT]: "请以友好、自然的方式回答用户问题。",
    [TaskType.DEEP_REASONING]: "请进行深入分析和推理，提供详细的解释和逻辑推导过程。",
    [TaskType.CODE_GENERATION]: "请生成高质量、可运行的代码，并提供必要的注释和说明。",
    [TaskType.IMAGE_GENERATION]: "请根据用户描述生成符合要求的图片。",
    [TaskType.IMAGE_UNDERSTANDING]: "请仔细分析图片内容，提供详细的描述和理解。",
    [TaskType.WEB_SEARCH]: "请提供最新、准确的信息，并注明信息来源。",
    [TaskType.QUICK_RESPONSE]: "请简洁、准确地回答用户问题。",
  };

  return `${basePrompt}\n\n${taskSpecificPrompts[analysis.type]}\n\n当前任务: ${analysis.reasoning}`;
}
