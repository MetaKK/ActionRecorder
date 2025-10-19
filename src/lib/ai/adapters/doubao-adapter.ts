/**
 * 豆包模型适配器
 * 直接调用豆包API，避免AI SDK内部路由问题
 */

import { BaseAIAdapter, AIRequest, StreamHandler } from "./base-adapter";
import { preprocessDoubaoMessages, createDoubaoToOpenAITransformer } from "../doubao-message-converter";
import { getModelById } from "../config";

export class DoubaoAdapter extends BaseAIAdapter {
  private readonly baseURL = "https://ark.cn-beijing.volces.com/api/v3";
  private readonly actualModelName: string;

  constructor(modelId: string, apiKey: string) {
    super(modelId, apiKey);
    
    // 获取实际的模型名称
    const modelConfig = getModelById(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    this.actualModelName = modelConfig.name;
  }

  async processRequest(request: AIRequest): Promise<Response> {
    try {
      const url = `${this.baseURL}/chat/completions`;
      
      // 预处理豆包消息格式
      const preprocessedMessages = preprocessDoubaoMessages(request.messages);
      
      const requestBody = {
        model: this.actualModelName,
        messages: preprocessedMessages,
        max_completion_tokens: request.maxTokens || 65535,
        temperature: request.temperature || 0.7,
        stream: true,
        ...request.additionalParams
      };

      console.log('[Doubao] 发送请求到豆包API:', {
        url,
        model: requestBody.model,
        messageCount: requestBody.messages.length,
        hasStream: requestBody.stream
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`豆包API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // 创建转换器，将豆包响应格式转换为OpenAI兼容格式
      const transformStream = createDoubaoToOpenAITransformer(this.actualModelName);

      return this.createSSEResponse(
        response.body?.pipeThrough(transformStream) || new ReadableStream()
      );
    } catch (error) {
      throw this.handleError(error, '豆包请求处理失败');
    }
  }

  async processStream(request: AIRequest, handler: StreamHandler): Promise<void> {
    try {
      const url = `${this.baseURL}/chat/completions`;
      
      const preprocessedMessages = preprocessDoubaoMessages(request.messages);
      
      const requestBody = {
        model: this.actualModelName,
        messages: preprocessedMessages,
        max_completion_tokens: request.maxTokens || 65535,
        temperature: request.temperature || 0.7,
        stream: true,
        ...request.additionalParams
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`豆包API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              handler.onFinish();
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  handler.onContent(parsed.choices[0].delta.content);
                }
              } catch (error) {
                console.warn('[Doubao] 解析响应数据失败:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      handler.onError(this.handleError(error, '豆包流式处理失败'));
    }
  }
}
