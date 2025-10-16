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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // o1系列模型特殊处理
  if (modelConfig.requiresSpecialHandling && modelId.startsWith("o1")) {
    return handleO1Model(messages, systemPrompt);
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

