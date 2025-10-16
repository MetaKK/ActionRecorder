/**
 * 插件系统核心类型定义
 * 参考 Notion 插件架构设计
 */

import { ReactNode } from "react";

/**
 * 插件类型枚举
 */
export enum PluginType {
  /** 普通路由跳转 */
  ROUTE = "route",
  /** 沉浸式体验（全屏，带返回按钮） */
  IMMERSIVE = "immersive",
  /** 外部链接（iframe 嵌入） */
  EXTERNAL = "external",
}

/**
 * 插件类别
 */
export enum PluginCategory {
  /** 效率工具 */
  PRODUCTIVITY = "productivity",
  /** AI 功能 */
  AI = "ai",
  /** 娱乐休闲 */
  ENTERTAINMENT = "entertainment",
  /** 学习知识 */
  LEARNING = "learning",
  /** 自定义 */
  CUSTOM = "custom",
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /** 插件唯一标识 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件描述 */
  description?: string;
  /** 插件版本 */
  version: string;
  /** 插件作者 */
  author?: string;
  /** 插件类别 */
  category: PluginCategory;
  /** 插件图标（emoji 或图片 URL） */
  icon: string;
  /** 插件主题色（Tailwind 渐变类名） */
  color: string;
  /** 是否启用 */
  enabled: boolean;
  /** 插件权重（用于排序，数字越大越靠前） */
  weight?: number;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 插件类型 */
  type: PluginType;
  /** 路由地址（用于 ROUTE 和 IMMERSIVE 类型） */
  route?: string;
  /** 外部链接 URL（用于 EXTERNAL 类型） */
  externalUrl?: string;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 自定义数据 */
  customData?: Record<string, any>;
}

/**
 * 插件生命周期钩子上下文
 */
export interface PluginHookContext {
  /** 插件 ID */
  pluginId: string;
  /** 触发时间戳 */
  timestamp: number;
  /** 用户数据（可选） */
  user?: any;
  /** 自定义数据 */
  data?: Record<string, any>;
}

/**
 * 插件生命周期钩子
 */
export interface PluginHooks {
  /** 插件激活前 */
  onBeforeActivate?: (context: PluginHookContext) => Promise<boolean | void>;
  /** 插件激活后 */
  onAfterActivate?: (context: PluginHookContext) => Promise<void>;
  /** 插件导航前 */
  onBeforeNavigate?: (context: PluginHookContext) => Promise<boolean | void>;
  /** 插件导航后 */
  onAfterNavigate?: (context: PluginHookContext) => Promise<void>;
  /** 插件完成时（例如番茄钟完成、任务完成） */
  onComplete?: (context: PluginHookContext) => Promise<void>;
  /** 插件错误处理 */
  onError?: (error: Error, context: PluginHookContext) => Promise<void>;
}

/**
 * 插件定义（完整）
 */
export interface Plugin {
  /** 插件元数据 */
  metadata: PluginMetadata;
  /** 插件配置 */
  config: PluginConfig;
  /** 插件生命周期钩子 */
  hooks?: PluginHooks;
}

/**
 * 插件注册表接口
 */
export interface PluginRegistry {
  /** 注册插件 */
  register(plugin: Plugin): void;
  /** 注销插件 */
  unregister(pluginId: string): void;
  /** 获取插件 */
  get(pluginId: string): Plugin | undefined;
  /** 获取所有插件 */
  getAll(): Plugin[];
  /** 获取已启用的插件 */
  getEnabled(): Plugin[];
  /** 根据类别获取插件 */
  getByCategory(category: PluginCategory): Plugin[];
  /** 启用插件 */
  enable(pluginId: string): void;
  /** 禁用插件 */
  disable(pluginId: string): void;
}

/**
 * 插件事件类型
 */
export enum PluginEventType {
  ACTIVATED = "plugin:activated",
  NAVIGATED = "plugin:navigated",
  COMPLETED = "plugin:completed",
  ERROR = "plugin:error",
}

/**
 * 插件事件
 */
export interface PluginEvent {
  /** 事件类型 */
  type: PluginEventType;
  /** 插件 ID */
  pluginId: string;
  /** 事件时间戳 */
  timestamp: number;
  /** 事件数据 */
  data?: Record<string, any>;
}

