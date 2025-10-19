/**
 * AI适配器工厂
 * 根据模型类型创建对应的适配器实例
 */

import { BaseAIAdapter } from "./base-adapter";
import { OpenAIAdapter } from "./openai-adapter";
import { DoubaoAdapter } from "./doubao-adapter";
import { AnthropicAdapter } from "./anthropic-adapter";
import { PerplexityAdapter } from "./perplexity-adapter";
import { getModelById } from "../config";

export class AdapterFactory {
  private static adapters = new Map<string, BaseAIAdapter>();

  /**
   * 创建或获取适配器实例
   * 使用单例模式避免重复创建
   */
  static getAdapter(modelId: string, apiKey: string): BaseAIAdapter {
    const cacheKey = `${modelId}-${apiKey}`;
    
    if (this.adapters.has(cacheKey)) {
      const adapter = this.adapters.get(cacheKey);
      if (adapter) {
        return adapter;
      }
    }

    const modelConfig = getModelById(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }

    let adapter: BaseAIAdapter;

    switch (modelConfig.provider) {
      case 'openai':
        adapter = new OpenAIAdapter(modelId, apiKey);
        break;
      case 'doubao':
        adapter = new DoubaoAdapter(modelId, apiKey);
        break;
      case 'anthropic':
        adapter = new AnthropicAdapter(modelId, apiKey);
        break;
      case 'perplexity':
        adapter = new PerplexityAdapter(modelId, apiKey);
        break;
      default:
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    this.adapters.set(cacheKey, adapter);
    return adapter;
  }

  /**
   * 清除适配器缓存
   * 用于测试或重新初始化
   */
  static clearCache(): void {
    this.adapters.clear();
  }

  /**
   * 获取支持的提供商列表
   */
  static getSupportedProviders(): string[] {
    return ['openai', 'doubao', 'anthropic', 'perplexity'];
  }

  /**
   * 检查提供商是否支持
   */
  static isProviderSupported(provider: string): boolean {
    return this.getSupportedProviders().includes(provider);
  }
}
