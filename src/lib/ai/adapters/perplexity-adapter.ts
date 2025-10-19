/**
 * Perplexity模型适配器
 * 使用AI SDK处理Perplexity模型
 */

import { streamText } from "ai";
import { BaseAIAdapter, AIRequest, StreamHandler } from "./base-adapter";
import { getLanguageModel } from "../providers";

export class PerplexityAdapter extends BaseAIAdapter {
  async processRequest(request: AIRequest): Promise<Response> {
    try {
      const languageModel = getLanguageModel(this.modelId, this.apiKey);
      
      const result = await streamText({
        model: languageModel,
        messages: request.messages,
        system: request.systemPrompt,
        temperature: request.temperature || 0.7,
        ...request.additionalParams
      });

      // 将AI SDK的流转换为SSE格式
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              const sseData = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return this.createSSEResponse(stream);
    } catch (error) {
      throw this.handleError(error, 'Perplexity请求处理失败');
    }
  }

  async processStream(request: AIRequest, handler: StreamHandler): Promise<void> {
    try {
      const languageModel = getLanguageModel(this.modelId, this.apiKey);
      
      const result = await streamText({
        model: languageModel,
        messages: request.messages,
        system: request.systemPrompt,
        temperature: request.temperature || 0.7,
        ...request.additionalParams
      });

      for await (const chunk of result.textStream) {
        handler.onContent(chunk);
      }
      handler.onFinish();
    } catch (error) {
      handler.onError(this.handleError(error, 'Perplexity流式处理失败'));
    }
  }
}
