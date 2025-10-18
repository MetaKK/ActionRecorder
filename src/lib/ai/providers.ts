/**
 * AI Provider 统一管理系统
 * 支持多个AI提供商和模型
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { LanguageModel } from "ai";
import { ModelProvider, getModelById } from "./config";

// Provider配置接口
export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  headers?: Record<string, string>;
}

// Provider实例缓存
const providerCache = new Map<string, any>();

/**
 * 创建OpenAI Provider
 */
function createOpenAIProvider(config?: ProviderConfig) {
  const cacheKey = `openai-${config?.apiKey || "default"}`;
  
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey);
  }

  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  
  // 检查API key是否存在
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found. Please set OPENAI_API_KEY environment variable or provide API key manually.');
  }

  console.log('[OpenAI Provider] 创建OpenAI provider:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
  });

  const provider = createOpenAI({
    apiKey: apiKey,
    baseURL: config?.baseURL,
    organization: config?.organization,
    headers: config?.headers,
  });

  providerCache.set(cacheKey, provider);
  return provider;
}

/**
 * 创建Anthropic Provider
 */
function createAnthropicProvider(config?: ProviderConfig) {
  const cacheKey = `anthropic-${config?.apiKey || "default"}`;
  
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey);
  }

  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
  
  // 检查API key是否存在
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found. Please set ANTHROPIC_API_KEY environment variable or provide API key manually.');
  }

  console.log('[Anthropic Provider] 创建Anthropic provider:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
  });

  const provider = createAnthropic({
    apiKey: apiKey,
    baseURL: config?.baseURL,
    headers: config?.headers,
  });

  providerCache.set(cacheKey, provider);
  return provider;
}

/**
 * 创建Perplexity Provider (使用OpenAI兼容API)
 */
function createPerplexityProvider(config?: ProviderConfig) {
  const cacheKey = `perplexity-${config?.apiKey || "default"}`;
  
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey);
  }

  const apiKey = config?.apiKey || process.env.PERPLEXITY_API_KEY;
  
  // 检查API key是否存在
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not found. Please set PERPLEXITY_API_KEY environment variable or provide API key manually.');
  }

  console.log('[Perplexity Provider] 创建Perplexity provider:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
  });

  const provider = createOpenAI({
    apiKey: apiKey,
    baseURL: config?.baseURL || "https://api.perplexity.ai",
    headers: config?.headers,
  });

  providerCache.set(cacheKey, provider);
  return provider;
}

/**
 * 创建豆包大模型 Provider
 */
function createDoubaoProvider(config?: ProviderConfig) {
  const cacheKey = `doubao-${config?.apiKey || "default"}`;
  
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey);
  }

  const apiKey = config?.apiKey || process.env.DOUBAO_API_KEY;
  
  // 检查API key是否存在
  if (!apiKey) {
    throw new Error('DOUBAO_API_KEY not found. Please set DOUBAO_API_KEY environment variable or provide API key manually.');
  }

  console.log('[Doubao Provider] 创建豆包provider:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
    baseURL: config?.baseURL || "https://ark.cn-beijing.volces.com/api/v3",
    envApiKey: !!process.env.DOUBAO_API_KEY,
    customApiKey: !!config?.apiKey
  });

  // 豆包大模型使用OpenAI兼容的API格式
  const provider = createOpenAI({
    apiKey: apiKey,
    baseURL: config?.baseURL || "https://ark.cn-beijing.volces.com/api/v3",
    headers: {
      ...config?.headers,
    },
  });

  providerCache.set(cacheKey, provider);
  return provider;
}

/**
 * 获取模型实例
 */
export function getLanguageModel(
  modelId: string,
  customApiKey?: string
): LanguageModel {
  const modelConfig = getModelById(modelId);
  
  if (!modelConfig) {
    throw new Error(`Model ${modelId} not found in configuration`);
  }

  const providerConfig: ProviderConfig = customApiKey 
    ? { apiKey: customApiKey }
    : {};

  // 调试日志
  console.log('[Provider] 获取模型实例:', {
    modelId,
    modelName: modelConfig.name,
    provider: modelConfig.provider,
    hasCustomApiKey: !!customApiKey,
    hasEnvApiKey: !!process.env.DOUBAO_API_KEY,
    endpoint: modelConfig.name
  });

  let provider;
  const modelName = modelConfig.name;

  switch (modelConfig.provider) {
    case ModelProvider.OPENAI:
      provider = createOpenAIProvider(providerConfig);
      break;

    case ModelProvider.ANTHROPIC:
      provider = createAnthropicProvider(providerConfig);
      break;

    case ModelProvider.PERPLEXITY:
      provider = createPerplexityProvider(providerConfig);
      break;

    case ModelProvider.DOUBAO:
      provider = createDoubaoProvider(providerConfig);
      break;

    default:
      throw new Error(`Provider ${modelConfig.provider} not supported`);
  }

  return provider(modelName);
}

/**
 * 检查API Key是否配置
 */
export function checkApiKeyAvailable(provider: ModelProvider): boolean {
  switch (provider) {
    case ModelProvider.OPENAI:
      return !!process.env.OPENAI_API_KEY;
    case ModelProvider.ANTHROPIC:
      return !!process.env.ANTHROPIC_API_KEY;
    case ModelProvider.PERPLEXITY:
      return !!process.env.PERPLEXITY_API_KEY;
    case ModelProvider.DOUBAO:
      return !!process.env.DOUBAO_API_KEY;
    default:
      return false;
  }
}

/**
 * 获取可用的Provider列表
 */
export function getAvailableProviders(): ModelProvider[] {
  const providers: ModelProvider[] = [];
  
  if (checkApiKeyAvailable(ModelProvider.OPENAI)) {
    providers.push(ModelProvider.OPENAI);
  }
  if (checkApiKeyAvailable(ModelProvider.ANTHROPIC)) {
    providers.push(ModelProvider.ANTHROPIC);
  }
  if (checkApiKeyAvailable(ModelProvider.PERPLEXITY)) {
    providers.push(ModelProvider.PERPLEXITY);
  }
  if (checkApiKeyAvailable(ModelProvider.DOUBAO)) {
    providers.push(ModelProvider.DOUBAO);
  }

  return providers;
}

/**
 * 清除Provider缓存
 */
export function clearProviderCache() {
  providerCache.clear();
}

