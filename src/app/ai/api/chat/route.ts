import { streamText } from "ai";
import { getSystemPromptWithTime } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { processModelRequest } from "@/lib/ai/model-handlers";
import { getModelById } from "@/lib/ai/config";

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-4o-mini", userContext } = await request.json();
    const customApiKey = request.headers.get("X-API-Key");

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // 获取模型配置
    const modelConfig = getModelById(model);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ 
          error: `Model ${model} not found. Please select a valid model.` 
        }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 获取语言模型实例
    let languageModel;
    try {
      languageModel = getLanguageModel(model, customApiKey || undefined);
    } catch {
      return new Response(
        JSON.stringify({ 
          error: "API key not configured. Please set API key in settings or environment variable." 
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 处理特殊模型需求（如o1、Perplexity等）
    const systemPrompt = getSystemPromptWithTime();
    const fullSystemPrompt = userContext 
      ? `${systemPrompt}\n\n${userContext}`
      : systemPrompt;
    
    const processedRequest = processModelRequest(model, messages, fullSystemPrompt);

    // 构建streamText参数
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const streamParams: any = {
      model: languageModel,
      messages: processedRequest.messages,
    };

    // 只在支持的模型上添加system prompt
    if (processedRequest.system) {
      streamParams.system = processedRequest.system;
    }

    // 添加temperature（如果指定）
    if (processedRequest.temperature !== undefined) {
      streamParams.temperature = processedRequest.temperature;
    }

    // 添加maxTokens（如果指定）
    if (processedRequest.maxTokens) {
      streamParams.maxTokens = processedRequest.maxTokens;
    }

    // 添加其他参数
    if (processedRequest.additionalParams) {
      Object.assign(streamParams, processedRequest.additionalParams);
    }

    // 执行流式文本生成
    const result = await streamText(streamParams);

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Chat API Error:", error);
    
    // 提供更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request. Please check your API configuration.",
        details: errorMessage
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
