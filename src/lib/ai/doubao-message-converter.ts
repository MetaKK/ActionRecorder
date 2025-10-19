/**
 * 豆包消息格式转换器
 * 将豆包的响应格式转换为OpenAI兼容格式
 */

export interface DoubaoStreamChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    delta?: {
      content?: string;
      role?: string;
    };
    content?: string;
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
}

/**
 * 将豆包响应格式转换为OpenAI兼容格式
 */
export function convertDoubaoToOpenAI(
  doubaoChunk: DoubaoStreamChunk,
  modelName: string
): OpenAIStreamChunk {
  const choice = doubaoChunk.choices?.[0];
  
  return {
    id: doubaoChunk.id || `chatcmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    object: 'chat.completion.chunk',
    created: doubaoChunk.created || Math.floor(Date.now() / 1000),
    model: modelName,
    choices: [{
      index: 0,
      delta: {
        content: choice?.delta?.content || choice?.content || '',
        role: choice?.delta?.role
      },
      finish_reason: choice?.finish_reason || null
    }]
  };
}

/**
 * 解析豆包SSE数据行
 */
export function parseDoubaoSSELine(line: string): DoubaoStreamChunk | null {
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  const data = line.slice(6).trim();
  
  if (data === '[DONE]') {
    return { id: 'done' } as DoubaoStreamChunk;
  }
  
  try {
    return JSON.parse(data) as DoubaoStreamChunk;
  } catch (error) {
    console.warn('[Doubao Converter] 解析SSE数据失败:', error, '原始数据:', data);
    return null;
  }
}

/**
 * 创建豆包到OpenAI的流转换器
 */
export function createDoubaoToOpenAITransformer(modelName: string) {
  return new TransformStream({
    start(controller) {
      console.log('[Doubao Converter] 开始转换豆包响应格式为OpenAI兼容格式');
    },
    
    transform(chunk, controller) {
      try {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const doubaoChunk = parseDoubaoSSELine(line);
          
          if (doubaoChunk) {
            if (doubaoChunk.id === 'done') {
              // 发送结束标记
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              continue;
            }
            
            // 转换格式
            const openaiChunk = convertDoubaoToOpenAI(doubaoChunk, modelName);
            
            // 发送OpenAI格式的SSE数据
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`)
            );
          } else {
            // 非SSE格式的数据，直接传递
            controller.enqueue(chunk);
          }
        }
      } catch (error) {
        console.error('[Doubao Converter] 转换流数据时出错:', error);
        // 出错时直接传递原始数据
        controller.enqueue(chunk);
      }
    },
    
    flush(controller) {
      console.log('[Doubao Converter] 完成豆包响应格式转换');
    }
  });
}

/**
 * 处理豆包消息格式的特殊情况
 */
export function preprocessDoubaoMessages(messages: any[]): any[] {
  return messages.map(message => {
    // 处理豆包特有的消息格式
    if (message.content && typeof message.content === 'object') {
      // 如果是多模态消息，确保格式正确
      if (Array.isArray(message.content)) {
        return {
          ...message,
          content: message.content.map((item: any) => {
            if (item.type === 'image_url' && typeof item.image_url === 'string') {
              return {
                type: 'image_url',
                image_url: {
                  url: item.image_url
                }
              };
            }
            return item;
          })
        };
      }
    }
    
    return message;
  });
}

/**
 * 验证豆包响应格式
 */
export function validateDoubaoResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  // 检查是否有choices数组
  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    return false;
  }
  
  // 检查choice结构
  const choice = response.choices[0];
  if (!choice || typeof choice !== 'object') {
    return false;
  }
  
  return true;
}
