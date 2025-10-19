/**
 * 通用SSE解析器
 * 支持多种AI模型的响应格式
 */

export interface SSEMessage {
  content: string;
  role?: string;
  finish_reason?: string | null;
}

export interface ParsedSSEData {
  content?: string;
  role?: string;
  finish_reason?: string | null;
  isDone?: boolean;
}

/**
 * 智能解析SSE数据，支持多种格式
 */
export function parseSSEData(line: string): ParsedSSEData | null {
  // AI SDK格式: "0:content" 或 "10:[DONE]"
  if (line.includes(':') && !line.startsWith('data: ')) {
    const [index, content] = line.split(':', 2);
    if (content === '[DONE]') {
      return { isDone: true };
    }
    return { content: content };
  }
  
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  const data = line.slice(6).trim();
  
  // 处理结束标记
  if (data === '[DONE]') {
    return { isDone: true };
  }
  
  try {
    const parsed = JSON.parse(data);
    
    // OpenAI格式: { choices: [{ delta: { content: "..." } }] }
    if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices[0]) {
      const choice = parsed.choices[0];
      return {
        content: choice.delta?.content || choice.content || '',
        role: choice.delta?.role || choice.role,
        finish_reason: choice.finish_reason
      };
    }
    
    // 直接内容格式: { content: "..." }
    if (parsed.content) {
      return {
        content: parsed.content,
        role: parsed.role,
        finish_reason: parsed.finish_reason
      };
    }
    
    // 简单文本格式: "text content"
    if (typeof parsed === 'string') {
      return {
        content: parsed
      };
    }
    
    // 其他格式，尝试提取可能的文本内容
    if (parsed.text) {
      return {
        content: parsed.text,
        role: parsed.role,
        finish_reason: parsed.finish_reason
      };
    }
    
    if (parsed.message) {
      return {
        content: parsed.message,
        role: parsed.role,
        finish_reason: parsed.finish_reason
      };
    }
    
    // 如果无法解析，返回null
    return null;
    
  } catch (error) {
    console.warn('[SSE Parser] 解析SSE数据失败:', error, '原始数据:', data);
    return null;
  }
}

/**
 * 处理SSE流数据
 */
export function processSSEStream(
  chunk: Uint8Array,
  onContent: (content: string) => void,
  onFinish?: () => void
): void {
  const text = new TextDecoder().decode(chunk);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    const parsed = parseSSEData(line);
    
    if (parsed) {
      if (parsed.isDone) {
        onFinish?.();
        continue;
      }
      
      if (parsed.content) {
        onContent(parsed.content);
      }
    }
  }
}

/**
 * 创建通用的SSE流处理器
 */
export function createSSEStreamProcessor(
  onContent: (content: string) => void,
  onFinish?: () => void
) {
  return (chunk: Uint8Array) => {
    processSSEStream(chunk, onContent, onFinish);
  };
}

/**
 * 检查是否为豆包模型
 */
export function isDoubaoModel(modelId: string): boolean {
  return modelId.startsWith('doubao-');
}

/**
 * 检查是否为OpenAI模型
 */
export function isOpenAIModel(modelId: string): boolean {
  return modelId.startsWith('gpt-') || modelId.startsWith('o1-');
}

/**
 * 检查是否为Anthropic模型
 */
export function isAnthropicModel(modelId: string): boolean {
  return modelId.startsWith('claude-');
}

/**
 * 检查是否为Perplexity模型
 */
export function isPerplexityModel(modelId: string): boolean {
  return modelId.startsWith('sonar');
}
