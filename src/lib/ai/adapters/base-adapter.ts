/**
 * AI模型适配器基类
 * 定义统一的AI模型接口，支持不同厂商的模型
 */

import { CoreMessage } from "ai";

// 通用请求参数
export interface AIRequest {
  messages: CoreMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  additionalParams?: Record<string, any>;
}

// 通用响应格式
export interface AIResponse {
  content: string;
  role: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 流式响应处理器
export interface StreamHandler {
  onContent: (content: string) => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

// AI适配器基类
export abstract class BaseAIAdapter {
  protected modelId: string;
  protected apiKey: string;

  constructor(modelId: string, apiKey: string) {
    this.modelId = modelId;
    this.apiKey = apiKey;
  }

  // 抽象方法：子类必须实现
  abstract processRequest(request: AIRequest): Promise<Response>;
  abstract processStream(request: AIRequest, handler: StreamHandler): Promise<void>;

  // 通用方法：消息预处理
  protected preprocessMessages(messages: CoreMessage[]): CoreMessage[] {
    return messages.map(msg => {
      // 确保content是字符串格式
      const processedContent = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);
      
      return {
        ...msg,
        content: processedContent
      } as CoreMessage;
    });
  }

  // 通用方法：错误处理
  protected handleError(error: unknown, context: string): Error {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${this.constructor.name}] ${context}:`, error);
    return new Error(`${context}: ${message}`);
  }

  // 通用方法：创建SSE响应
  protected createSSEResponse(stream: ReadableStream): Response {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // 通用方法：转换流数据为SSE格式
  protected createSSETransformer(
    onContent: (content: string) => void,
    onFinish: () => void
  ): TransformStream<Uint8Array, Uint8Array> {
    const encoder = new TextEncoder();
    
    return new TransformStream({
      start(controller) {
        console.log(`[${this.constructor.name}] 开始流式处理`);
      },
      
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // 处理不同的流格式
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onFinish();
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  onContent(parsed.content);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: parsed.content })}\n\n`));
                }
              } catch (error) {
                console.warn(`[${this.constructor.name}] 解析SSE数据失败:`, error);
              }
            }
          } else if (line.includes(':')) {
            // AI SDK格式: "0:content"
            const [index, content] = line.split(':', 2);
            if (content === '[DONE]') {
              onFinish();
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } else {
              onContent(content);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        }
      },
      
      flush(controller) {
        console.log(`[${this.constructor.name}] 流式处理完成`);
      }
    });
  }
}
