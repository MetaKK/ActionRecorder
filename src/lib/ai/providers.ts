import { gateway } from "@ai-sdk/gateway";
import { customProvider } from "ai";

// AI提供商配置
export const aiProvider = customProvider({
  languageModels: {
    "gpt-4o": gateway.languageModel("openai/gpt-4o"),
    "gpt-4o-mini": gateway.languageModel("openai/gpt-4o-mini"),
    "claude-3-5-sonnet": gateway.languageModel("anthropic/claude-3-5-sonnet-20241022"),
    "claude-3-5-haiku": gateway.languageModel("anthropic/claude-3-5-haiku-20241022"),
  },
});

// 默认模型
export const DEFAULT_AI_MODEL = "gpt-4o-mini";

// 支持的模型列表
export const AI_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "最强大的GPT-4模型",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "快速且经济的GPT-4模型",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic最强大的模型",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    description: "快速且经济的Claude模型",
  },
] as const;
