/**
 * 预设插件配置
 * 所有内置插件的定义
 */

import { Plugin, PluginType, PluginCategory, PluginHookContext } from "./types";
import { pluginLogger } from "./logger";

/**
 * 番茄钟插件
 */
export const focusPlugin: Plugin = {
  metadata: {
    id: "focus",
    name: "专注时钟",
    description: "使用番茄工作法提升专注力",
    version: "1.0.0",
    category: PluginCategory.PRODUCTIVITY,
    icon: "🍅",
    color: "from-red-500 to-orange-600",
    enabled: true,
    weight: 100, // 最高优先级
  },
  config: {
    type: PluginType.IMMERSIVE,
    route: "/focus",
  },
  hooks: {
    onBeforeActivate: async (context: PluginHookContext) => {
      pluginLogger.info("准备启动番茄钟", context.pluginId);
      return true;
    },
    onAfterNavigate: async (context: PluginHookContext) => {
      pluginLogger.info("番茄钟页面已加载", context.pluginId);
    },
    // onComplete 由番茄钟组件内部调用
  },
};

/**
 * AI 对话插件
 */
export const chatPlugin: Plugin = {
  metadata: {
    id: "chat",
    name: "AI对话",
    description: "与AI助手进行智能对话",
    version: "1.0.0",
    category: PluginCategory.AI,
    icon: "💬",
    color: "from-blue-500 to-purple-600",
    enabled: true,
    weight: 90,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/ai",
  },
};

/**
 * 生活分析插件
 */
export const analyzePlugin: Plugin = {
  metadata: {
    id: "analyze",
    name: "生活分析",
    description: "分析你的生活数据，提供洞察",
    version: "1.0.0",
    category: PluginCategory.AI,
    icon: "📊",
    color: "from-green-500 to-teal-600",
    enabled: true,
    weight: 80,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/ai/analyze",
  },
};

/**
 * 洞察建议插件
 */
export const insightPlugin: Plugin = {
  metadata: {
    id: "insight",
    name: "洞察建议",
    description: "获取个性化的生活建议",
    version: "1.0.0",
    category: PluginCategory.AI,
    icon: "💡",
    color: "from-yellow-500 to-orange-600",
    enabled: true,
    weight: 70,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/ai/insight",
  },
};

/**
 * 记忆回顾插件
 */
export const memoryPlugin: Plugin = {
  metadata: {
    id: "memory",
    name: "记忆回顾",
    description: "回顾和重温你的珍贵记忆",
    version: "1.0.0",
    category: PluginCategory.AI,
    icon: "💭",
    color: "from-pink-500 to-rose-600",
    enabled: true,
    weight: 60,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/ai/memory",
  },
};

/**
 * 窗口旅行插件
 */
export const windowPlugin: Plugin = {
  metadata: {
    id: "window",
    name: "放空一下",
    description: "透过窗口观看旅行风景，放松心情",
    version: "1.0.0",
    category: PluginCategory.ENTERTAINMENT,
    icon: "✈️",
    color: "from-sky-400 to-blue-600",
    enabled: true,
    weight: 55,
  },
  config: {
    type: PluginType.IMMERSIVE,
    route: "/window",
  },
  hooks: {
    onBeforeActivate: async (context: PluginHookContext) => {
      pluginLogger.info("准备启动窗口旅行", context.pluginId);
      return true;
    },
    onAfterNavigate: async (context: PluginHookContext) => {
      pluginLogger.info("窗口旅行页面已加载", context.pluginId);
    },
  },
};

/**
 * 维基百科插件
 */
export const wikipediaPlugin: Plugin = {
  metadata: {
    id: "wikipedia",
    name: "维基百科",
    description: "浏览维基百科，获取知识",
    version: "1.0.0",
    category: PluginCategory.LEARNING,
    icon: "📚",
    color: "from-slate-600 to-gray-700",
    enabled: true,
    weight: 40,
  },
  config: {
    type: PluginType.EXTERNAL,
    externalUrl: "https://zh.wikipedia.org",
  },
};

/**
 * Hacker News 插件
 */
export const hackerNewsPlugin: Plugin = {
  metadata: {
    id: "hackernews",
    name: "Hacker News",
    description: "浏览科技资讯和讨论",
    version: "1.0.0",
    category: PluginCategory.LEARNING,
    icon: "🔥",
    color: "from-orange-500 to-red-600",
    enabled: true,
    weight: 30,
  },
  config: {
    type: PluginType.EXTERNAL,
    externalUrl: "https://news.ycombinator.com",
  },
};

/**
 * AI日记插件
 */
export const diaryPlugin: Plugin = {
  metadata: {
    id: "diary",
    name: "今日日记",
    description: "AI 为你生成今天的生活日记",
    version: "1.0.0",
    category: PluginCategory.AI,
    icon: "📔",
    color: "from-amber-500 to-orange-600",
    enabled: true,
    weight: 85,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/ai/diary",
  },
};

/**
 * 英语场景练习插件
 */
export const scenePracticePlugin: Plugin = {
  metadata: {
    id: "scene-practice",
    name: "英语场景",
    description: "基于日常行为的英语场景对话练习",
    version: "1.0.0",
    category: PluginCategory.LEARNING,
    icon: "🎯",
    color: "from-blue-500 to-indigo-600",
    enabled: true,
    weight: 75,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/ai/scene-practice",
  },
};

/**
 * 所有预设插件列表
 */
export const presetPlugins: Plugin[] = [
  focusPlugin,
  chatPlugin,
  diaryPlugin,
  scenePracticePlugin,
  analyzePlugin,
  insightPlugin,
  memoryPlugin,
  windowPlugin,
  wikipediaPlugin,
  hackerNewsPlugin,
];

/**
 * 注册所有预设插件
 */
import { pluginRegistry } from "./registry";

export function registerPresetPlugins(): void {
  presetPlugins.forEach((plugin) => {
    pluginRegistry.register(plugin);
  });
  
  pluginLogger.info(`Registered ${presetPlugins.length} preset plugins`);
}

