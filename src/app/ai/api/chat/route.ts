import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-4o-mini" } = await request.json();
    const customApiKey = request.headers.get("X-API-Key");

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // 确定使用哪个API Key
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
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

    // 只支持OpenAI模型
    const result = await streamText({
      model: openai(model, { apiKey }),
      system: AI_SYSTEM_PROMPT,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Chat API Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request. Please check your API configuration." 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
