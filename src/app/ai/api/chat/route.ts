import { streamText } from "ai";
import { getSystemPromptWithTime } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { processModelRequest } from "@/lib/ai/model-handlers";
import { getModelById } from "@/lib/ai/config";
import { handleAutoMode, getAutoModeSystemPrompt, analyzeTask } from "@/lib/ai/auto-agent";

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-4o-mini", userContext } = await request.json();
    const customApiKey = request.headers.get("X-API-Key");

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // Auto模式：智能选择模型
    let actualModel = model;
    let autoAnalysis = null;
    
    if (model === "auto") {
      const autoResult = handleAutoMode(messages);
      actualModel = autoResult.selectedModel;
      autoAnalysis = autoResult.analysis;
      
      console.log('[Auto Agent] 智能选择模型:', {
        selectedModel: actualModel,
        taskType: autoAnalysis.type,
        reasoning: autoAnalysis.reasoning,
      });
    }

    // 获取模型配置
    const modelConfig = getModelById(actualModel);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ 
          error: `Model ${actualModel} not found. Please select a valid model.` 
        }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 获取语言模型实例 - 优先使用环境变量，只有在环境变量不存在时才使用手动输入的key
    let languageModel;
    try {
      // 检查环境变量中是否有对应的API key
      const modelConfig = getModelById(actualModel);
      let useCustomApiKey = false;
      
      if (modelConfig?.provider === "doubao" && !process.env.DOUBAO_API_KEY && customApiKey) {
        useCustomApiKey = true;
      } else if (modelConfig?.provider === "openai" && !process.env.OPENAI_API_KEY && customApiKey) {
        useCustomApiKey = true;
      } else if (modelConfig?.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY && customApiKey) {
        useCustomApiKey = true;
      } else if (modelConfig?.provider === "perplexity" && !process.env.PERPLEXITY_API_KEY && customApiKey) {
        useCustomApiKey = true;
      }
      
      console.log('[API] API Key选择策略:', {
        model: actualModel,
        provider: modelConfig?.provider,
        hasEnvKey: !!process.env[`${modelConfig?.provider?.toUpperCase()}_API_KEY`],
        hasCustomKey: !!customApiKey,
        useCustomKey: useCustomApiKey
      });
      
      languageModel = getLanguageModel(actualModel, useCustomApiKey ? customApiKey || undefined : undefined);
    } catch (error) {
      console.error('[API] 模型实例创建失败:', error);
      
      // 根据模型类型提供具体的错误信息
      const modelConfig = getModelById(actualModel);
      let errorMessage = "API key not configured.";
      
      if (modelConfig?.provider === "doubao") {
        errorMessage = "DOUBAO_API_KEY not found. Please set DOUBAO_API_KEY environment variable or provide API key manually.";
      } else if (modelConfig?.provider === "openai") {
        errorMessage = "OPENAI_API_KEY not found. Please set OPENAI_API_KEY environment variable or provide API key manually.";
      } else if (modelConfig?.provider === "anthropic") {
        errorMessage = "ANTHROPIC_API_KEY not found. Please set ANTHROPIC_API_KEY environment variable or provide API key manually.";
      } else if (modelConfig?.provider === "perplexity") {
        errorMessage = "PERPLEXITY_API_KEY not found. Please set PERPLEXITY_API_KEY environment variable or provide API key manually.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: error instanceof Error ? error.message : "Unknown error"
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 处理特殊模型需求（如o1、Perplexity等）
    let systemPrompt = getSystemPromptWithTime();
    
    // Auto模式：使用任务特定的系统提示
    if (model === "auto" && autoAnalysis) {
      systemPrompt = getAutoModeSystemPrompt(autoAnalysis);
    } else if (modelConfig?.provider === "doubao") {
      // 豆包模型：也进行任务分析，使用智能系统提示
      const taskAnalysis = analyzeTask(messages);
      systemPrompt = getAutoModeSystemPrompt(taskAnalysis);
      
      console.log('[Doubao] 豆包模型任务分析:', {
        model: actualModel,
        taskType: taskAnalysis.type,
        reasoning: taskAnalysis.reasoning
      });
    }
    
    const fullSystemPrompt = userContext 
      ? `${systemPrompt}\n\n${userContext}`
      : systemPrompt;
    
    const processedRequest = processModelRequest(actualModel, messages, fullSystemPrompt);
    
    // 调试日志
    console.log('[API] 模型处理参数:', {
      modelId: actualModel,
      hasSystem: !!processedRequest.system,
      temperature: processedRequest.temperature,
      maxTokens: processedRequest.maxTokens,
      additionalParams: processedRequest.additionalParams,
    });

    // 构建streamText参数
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
