/**
 * 特殊模型处理器
 * 处理需要特殊逻辑的模型（如o1推理模型、搜索模型等）
 */

import { CoreMessage } from "ai";
import { getModelById } from "./config";

export interface ModelHandlerResult {
  messages: CoreMessage[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
  additionalParams?: Record<string, any>;
}

/**
 * o1系列模型处理器
 * o1模型不支持system message和temperature参数
 */
export function handleO1Model(
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  // o1模型需要将system prompt合并到第一条用户消息中
  const processedMessages = [...messages];
  
  if (systemPrompt && processedMessages.length > 0) {
    const firstMessage = processedMessages[0];
    if (firstMessage.role === "user") {
      processedMessages[0] = {
        ...firstMessage,
        content: `${systemPrompt}\n\n${firstMessage.content}`,
      };
    } else {
      // 如果第一条不是用户消息，在开头插入
      processedMessages.unshift({
        role: "user",
        content: systemPrompt,
      });
    }
  }

  return {
    messages: processedMessages,
    // o1模型不使用temperature
    temperature: undefined,
    additionalParams: {
      // o1特有参数可以在这里添加
      reasoning_effort: "high", // 可选: low, medium, high
    },
  };
}

/**
 * Perplexity搜索模型处理器
 * 为搜索模型添加特定参数
 */
export function handlePerplexityModel(
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  return {
    messages,
    system: systemPrompt,
    additionalParams: {
      // Perplexity特有参数
      search_domain_filter: [], // 可选的域名过滤
      return_citations: true,    // 返回引用
      return_images: false,      // 返回图片
      search_recency_filter: "month", // 搜索时间范围: day, week, month, year
    },
  };
}

/**
 * Claude模型处理器
 * 优化Claude的使用
 */
export function handleClaudeModel(
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  return {
    messages,
    system: systemPrompt,
    temperature: 1.0, // Claude推荐使用1.0
    additionalParams: {
      // Claude特有参数
      top_k: 40,
    },
  };
}

/**
 * 豆包大模型处理器
 */
export function handleDoubaoModel(
  messages: CoreMessage[],
  systemPrompt?: string,
  modelId?: string
): ModelHandlerResult {
  console.log('[Doubao Handler] 处理豆包模型:', {
    modelId,
    hasSystem: !!systemPrompt,
    messageCount: messages.length
  });

  const baseParams: ModelHandlerResult = {
    messages,
    system: systemPrompt,
    temperature: 0.7,
    maxTokens: 65535,
  };

  // 豆包 1.6 支持深度思考参数
  if (modelId === 'doubao-1.6') {
    baseParams.additionalParams = {
      reasoning_effort: "medium", // 可选: low, medium, high
    };
    console.log('[Doubao Handler] 应用深度思考参数:', baseParams.additionalParams);
  }

  // 豆包 Flash 不需要reasoning_effort参数
  if (modelId === 'doubao-1.6-flash') {
    // 优化快速响应
    baseParams.temperature = 0.6;
    baseParams.maxTokens = 32768; // Flash版本使用较小的token限制
    console.log('[Doubao Handler] 应用Flash优化参数:', {
      temperature: baseParams.temperature,
      maxTokens: baseParams.maxTokens
    });
  }

  // 豆包 Dream 图片生成模型
  if (modelId === 'doubao-dream') {
    // Dream模型使用不同的参数
    baseParams.temperature = 0.8;
    baseParams.maxTokens = 4096;
    baseParams.additionalParams = {
      size: "2K",
      sequential_image_generation: "disabled",
      stream: false,
      response_format: "url",
      watermark: true
    };
    console.log('[Doubao Handler] 应用Dream图片生成参数:', baseParams.additionalParams);
  }

  console.log('[Doubao Handler] 最终参数:', baseParams);
  return baseParams;
}

/**
 * Auto模式处理器
 */
export function handleAutoMode(
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  // Auto模式会在API路由中动态选择模型
  // 这里返回基础配置
  return {
    messages,
    system: systemPrompt,
    temperature: 0.7,
    maxTokens: 65535,
  };
}

/**
 * 标准模型处理器
 */
export function handleStandardModel(
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  return {
    messages,
    system: systemPrompt,
    temperature: 0.7,
  };
}

/**
 * 模型处理器路由
 * 根据模型ID选择合适的处理器
 */
export function processModelRequest(
  modelId: string,
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  const modelConfig = getModelById(modelId);
  
  if (!modelConfig) {
    throw new Error(`Model ${modelId} not found`);
  }

  // Auto智能模式 - 优先处理
  if (modelId === "auto") {
    return handleAutoMode(messages, systemPrompt);
  }

  // o1系列模型特殊处理
  if (modelConfig.requiresSpecialHandling && modelId.startsWith("o1")) {
    return handleO1Model(messages, systemPrompt);
  }

  // 豆包大模型 - 需要特殊处理
  if (modelConfig.provider === "doubao") {
    return handleDoubaoModel(messages, systemPrompt, modelId);
  }

  // Perplexity搜索模型
  if (modelConfig.provider === "perplexity") {
    return handlePerplexityModel(messages, systemPrompt);
  }

  // Claude模型
  if (modelConfig.provider === "anthropic") {
    return handleClaudeModel(messages, systemPrompt);
  }

  // 标准模型
  return handleStandardModel(messages, systemPrompt);
}

/**
 * 格式化搜索结果（用于Perplexity等搜索模型）
 */
export interface SearchCitation {
  url: string;
  title?: string;
  snippet?: string;
}

export function formatSearchResponse(
  content: string,
  citations?: SearchCitation[]
): string {
  if (!citations || citations.length === 0) {
    return content;
  }

  const citationSection = citations
    .map((citation, index) => {
      const title = citation.title || citation.url;
      return `[${index + 1}] ${title}\n   ${citation.url}`;
    })
    .join("\n\n");

  return `${content}\n\n### 参考来源：\n${citationSection}`;
}

