/**
 * AI模型配置中心
 * 统一管理所有AI模型的配置和能力
 */

// 模型能力枚举
export enum ModelCapability {
  CHAT = "chat",                    // 对话
  REASONING = "reasoning",          // 深度思考
  SEARCH = "search",                // 联网搜索
  VISION = "vision",                // 视觉理解
  CODE = "code",                    // 代码生成
  FAST = "fast",                    // 快速响应
  MULTIMODAL = "multimodal",        // 多模态
  IMAGE_GENERATION = "image_generation", // 图片生成
}

// 模型提供商枚举
export enum ModelProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  PERPLEXITY = "perplexity",
  DEEPSEEK = "deepseek",
  GOOGLE = "google",
  DOUBAO = "doubao",
}

// 模型配置接口
export interface AIModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  displayName: string;
  description: string;
  capabilities: ModelCapability[];
  maxTokens?: number;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
  contextWindow?: number;
  isRecommended?: boolean;
  isNew?: boolean;
  requiresSpecialHandling?: boolean;
  category: "standard" | "reasoning" | "search" | "multimodal";
}

// 所有支持的模型配置
export const AI_MODELS: AIModelConfig[] = [
  // ===== Auto 智能模式 =====
  {
    id: "auto",
    name: "auto",
    provider: ModelProvider.OPENAI, // 使用OpenAI作为默认provider
    displayName: "Auto 智能模式",
    description: "AI Agent自动选择最适合的模型处理您的请求",
    capabilities: [ModelCapability.CHAT, ModelCapability.REASONING, ModelCapability.SEARCH, ModelCapability.VISION, ModelCapability.CODE, ModelCapability.MULTIMODAL],
    maxTokens: 65535,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.001, output: 0.002 },
    isRecommended: true,
    isNew: true,
    requiresSpecialHandling: true,
    category: "standard",
  },
  
  // ===== OpenAI 标准模型 =====
  {
    id: "gpt-4o",
    name: "gpt-4o",
    provider: ModelProvider.OPENAI,
    displayName: "GPT-4o",
    description: "最强大的GPT-4模型，支持多模态",
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION, ModelCapability.CODE, ModelCapability.MULTIMODAL],
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.0025, output: 0.01 },
    category: "multimodal",
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    provider: ModelProvider.OPENAI,
    displayName: "GPT-4o Mini",
    description: "快速且经济的GPT-4模型",
    capabilities: [ModelCapability.CHAT, ModelCapability.FAST, ModelCapability.CODE],
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    isRecommended: true,
    category: "standard",
  },
  {
    id: "gpt-4-turbo",
    name: "gpt-4-turbo",
    provider: ModelProvider.OPENAI,
    displayName: "GPT-4 Turbo",
    description: "GPT-4增强版，更快的响应速度",
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION, ModelCapability.CODE],
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    category: "standard",
  },
  {
    id: "gpt-3.5-turbo",
    name: "gpt-3.5-turbo",
    provider: ModelProvider.OPENAI,
    displayName: "GPT-3.5 Turbo",
    description: "经典对话模型，快速且经济",
    capabilities: [ModelCapability.CHAT, ModelCapability.FAST],
    maxTokens: 4096,
    contextWindow: 16385,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    category: "standard",
  },

  // ===== OpenAI 深度思考模型 =====
  {
    id: "o1-preview",
    name: "o1-preview",
    provider: ModelProvider.OPENAI,
    displayName: "o1 Preview",
    description: "深度推理模型，擅长复杂问题分析",
    capabilities: [ModelCapability.REASONING, ModelCapability.CODE],
    maxTokens: 32768,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.015, output: 0.06 },
    requiresSpecialHandling: true,
    isNew: true,
    category: "reasoning",
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    provider: ModelProvider.OPENAI,
    displayName: "o1 Mini",
    description: "快速推理模型，平衡速度和思考深度",
    capabilities: [ModelCapability.REASONING, ModelCapability.CODE, ModelCapability.FAST],
    maxTokens: 65536,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.003, output: 0.012 },
    requiresSpecialHandling: true,
    isNew: true,
    category: "reasoning",
  },

  // ===== Anthropic Claude 模型 =====
  {
    id: "claude-3-5-sonnet",
    name: "claude-3-5-sonnet-20241022",
    provider: ModelProvider.ANTHROPIC,
    displayName: "Claude 3.5 Sonnet",
    description: "Anthropic最强大的模型，擅长长文本分析",
    capabilities: [ModelCapability.CHAT, ModelCapability.CODE, ModelCapability.VISION],
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    category: "standard",
  },
  {
    id: "claude-3-5-haiku",
    name: "claude-3-5-haiku-20241022",
    provider: ModelProvider.ANTHROPIC,
    displayName: "Claude 3.5 Haiku",
    description: "快速且经济的Claude模型",
    capabilities: [ModelCapability.CHAT, ModelCapability.FAST],
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.0008, output: 0.004 },
    category: "standard",
  },

  // ===== Perplexity 联网搜索模型 =====
  {
    id: "sonar-pro",
    name: "sonar-pro",
    provider: ModelProvider.PERPLEXITY,
    displayName: "Sonar Pro",
    description: "联网搜索模型，实时获取最新信息",
    capabilities: [ModelCapability.CHAT, ModelCapability.SEARCH],
    maxTokens: 4096,
    contextWindow: 127072,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    isNew: true,
    category: "search",
  },
  {
    id: "sonar",
    name: "sonar",
    provider: ModelProvider.PERPLEXITY,
    displayName: "Sonar",
    description: "快速联网搜索，经济实用",
    capabilities: [ModelCapability.CHAT, ModelCapability.SEARCH, ModelCapability.FAST],
    maxTokens: 4096,
    contextWindow: 127072,
    costPer1kTokens: { input: 0.001, output: 0.001 },
    isNew: true,
    category: "search",
  },

  // ===== 豆包大模型 =====
  {
    id: "doubao-1.6",
    name: process.env.DOUBAO_SEED_1_6_ENDPOINT || "doubao-seed-1-6-251015",
    provider: ModelProvider.DOUBAO,
    displayName: "豆包大模型 1.6",
    description: "字节跳动豆包大模型，支持多模态对话和深度思考",
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION, ModelCapability.MULTIMODAL, ModelCapability.REASONING],
    maxTokens: 65535,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.0008, output: 0.002 },
    isNew: true,
    requiresSpecialHandling: true, // 支持深度思考参数
    category: "multimodal",
  },
  {
    id: "doubao-1.6-flash",
    name: process.env.DOUBAO_SEED_1_6_FLASH_ENDPOINT || "doubao-seed-1-6-flash-250828",
    provider: ModelProvider.DOUBAO,
    displayName: "豆包大模型 1.6 Flash",
    description: "快速版本，支持多模态对话，响应速度更快",
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION, ModelCapability.MULTIMODAL, ModelCapability.FAST],
    maxTokens: 65535,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.0006, output: 0.0015 },
    isNew: true,
    requiresSpecialHandling: true, // 需要特殊处理
    category: "multimodal",
  },
  {
    id: "doubao-dream",
    name: process.env.DOUBAO_DREAM_ENDPOINT || "doubao-seedream-4-0-250828",
    provider: ModelProvider.DOUBAO,
    displayName: "豆包 Dream",
    description: "强大的图片生成模型，支持2K/4K超高清图片生成",
    capabilities: [ModelCapability.IMAGE_GENERATION],
    maxTokens: 4096,
    contextWindow: 32000,
    costPer1kTokens: { input: 0.002, output: 0.002 },
    isNew: true,
    requiresSpecialHandling: true, // 使用图片生成API
    category: "multimodal",
  },
];

// 按类别分组模型
export const getModelsByCategory = () => {
  const grouped = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, AIModelConfig[]>);

  return grouped;
};

// 按提供商分组模型
export const getModelsByProvider = (provider: ModelProvider) => {
  return AI_MODELS.filter(model => model.provider === provider);
};

// 根据能力筛选模型
export const getModelsByCapability = (capability: ModelCapability) => {
  return AI_MODELS.filter(model => model.capabilities.includes(capability));
};

// 获取推荐模型
export const getRecommendedModels = () => {
  return AI_MODELS.filter(model => model.isRecommended);
};

// 获取新模型
export const getNewModels = () => {
  return AI_MODELS.filter(model => model.isNew);
};

// 根据ID获取模型配置
export const getModelById = (id: string): AIModelConfig | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

// 默认模型
export const DEFAULT_MODEL_ID = "gpt-4o-mini";

// 分类显示名称
export const CATEGORY_NAMES = {
  standard: "标准对话",
  reasoning: "深度思考",
  search: "联网搜索",
  multimodal: "多模态",
} as const;

// 能力显示名称
export const CAPABILITY_NAMES = {
  [ModelCapability.CHAT]: "对话",
  [ModelCapability.REASONING]: "深度推理",
  [ModelCapability.SEARCH]: "联网搜索",
  [ModelCapability.VISION]: "视觉理解",
  [ModelCapability.CODE]: "代码生成",
  [ModelCapability.FAST]: "快速响应",
  [ModelCapability.MULTIMODAL]: "多模态",
  [ModelCapability.IMAGE_GENERATION]: "图片生成",
} as const;

