/**
 * 统一AI服务层
 * 提供简洁的AI模型调用接口
 */

import { CoreMessage } from "ai";
import { BaseAIAdapter, AIRequest } from "../adapters/base-adapter";
import { AdapterFactory } from "../adapters/adapter-factory";
import { getModelById } from "../config";
import { handleAutoMode } from "../auto-agent";

export interface AIServiceRequest {
  messages: CoreMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  userContext?: any;
  additionalParams?: Record<string, any>;
}

export interface AIServiceResponse {
  content: string;
  role: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIService {
  /**
   * 处理AI请求
   * 统一入口，自动选择适配器
   */
  static async processRequest(request: AIServiceRequest, customApiKey?: string): Promise<Response> {
    try {
      // Auto模式处理
      let actualModel = request.model;
      if (request.model === "auto") {
        const autoResult = handleAutoMode(request.messages);
        actualModel = autoResult.selectedModel;
        
        console.log('[AI Service] Auto模式选择模型:', {
          selectedModel: actualModel,
          taskType: autoResult.analysis.type,
          reasoning: autoResult.analysis.reasoning,
        });
      }

      // 获取模型配置
      const modelConfig = getModelById(actualModel);
      if (!modelConfig) {
        throw new Error(`Model ${actualModel} not found`);
      }

      // 获取API密钥
      const apiKey = this.getApiKey(modelConfig.provider, customApiKey);
      if (!apiKey) {
        throw new Error(`API key not found for provider: ${modelConfig.provider}`);
      }

      // 创建适配器
      const adapter = AdapterFactory.getAdapter(actualModel, apiKey);

      // 构建请求
      const aiRequest: AIRequest = {
        messages: request.messages,
        model: actualModel,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        systemPrompt: request.systemPrompt,
        additionalParams: request.additionalParams
      };

      // 处理请求
      return await adapter.processRequest(aiRequest);

    } catch (error) {
      console.error('[AI Service] 处理请求失败:', error);
      return new Response(
        JSON.stringify({ 
          error: "AI request failed", 
          details: error instanceof Error ? error.message : "Unknown error" 
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  /**
   * 处理流式AI请求
   */
  static async processStream(
    request: AIServiceRequest,
    onContent: (content: string) => void,
    onFinish: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Auto模式处理
      let actualModel = request.model;
      if (request.model === "auto") {
        const autoResult = handleAutoMode(request.messages);
        actualModel = autoResult.selectedModel;
      }

      // 获取模型配置和API密钥
      const modelConfig = getModelById(actualModel);
      if (!modelConfig) {
        throw new Error(`Model ${actualModel} not found`);
      }

      const apiKey = this.getApiKey(modelConfig.provider);
      if (!apiKey) {
        throw new Error(`API key not found for provider: ${modelConfig.provider}`);
      }

      // 创建适配器
      const adapter = AdapterFactory.getAdapter(actualModel, apiKey);

      // 构建请求
      const aiRequest: AIRequest = {
        messages: request.messages,
        model: actualModel,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        systemPrompt: request.systemPrompt,
        additionalParams: request.additionalParams
      };

      // 处理流式请求
      await adapter.processStream(aiRequest, {
        onContent,
        onFinish,
        onError
      });

    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * 获取API密钥
   * 优先使用环境变量，其次使用自定义密钥
   */
  private static getApiKey(provider: string, customApiKey?: string): string | null {
    const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (envKey) {
      return envKey;
    }

    // 使用自定义API密钥
    if (customApiKey) {
      return customApiKey;
    }

    return null;
  }

  /**
   * 检查模型是否可用
   */
  static isModelAvailable(modelId: string): boolean {
    try {
      const modelConfig = getModelById(modelId);
      if (!modelConfig) return false;

      const apiKey = this.getApiKey(modelConfig.provider);
      return !!apiKey;
    } catch {
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  static getAvailableModels(): string[] {
    // 这里可以根据API密钥可用性过滤模型
    // 暂时返回所有模型
    return ['gpt-4o', 'gpt-4o-mini', 'doubao-seed-1-6-251015', 'claude-3-5-sonnet-20241022', 'sonar-medium-online'];
  }
}
