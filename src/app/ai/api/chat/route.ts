/*
 * @Author: MetaKK metakk@example.com
 * @Date: 2025-10-19 16:59:16
 * @LastEditors: MetaKK metakk@example.com
 * @LastEditTime: 2025-10-19 17:51:03
 * @FilePath: \ActionRecorder\src\app\ai\api\chat\route.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 重构后的AI聊天API路由
 * 使用统一的AI服务架构
 */

import { AIService } from "@/lib/ai/services/ai-service";
import { getSystemPromptWithTime } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-4o-mini", userContext } = await request.json();
    const customApiKey = request.headers.get("X-API-Key");

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // 生成系统提示词
    const systemPrompt = getSystemPromptWithTime();

    // 使用统一的AI服务处理请求
    return await AIService.processRequest({
      messages,
      model,
      systemPrompt,
      userContext,
      // 这里可以添加更多参数
    }, customApiKey || undefined);

  } catch (error) {
    console.error("AI Chat API Error:", error);
    
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
