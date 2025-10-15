import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-4o-mini" } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // 检查是否有OpenAI API密钥
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." 
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const result = await streamText({
      model: openai(model),
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
