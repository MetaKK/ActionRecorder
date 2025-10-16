/**
 * 沉浸式插件配置系统
 * 支持内置组件和外部网页嵌入
 */

import { ReactNode } from "react";

export type ImmersivePluginType = 'component' | 'external' | 'iframe';

export interface ImmersivePluginConfig {
  /** 插件唯一标识 */
  id: string;
  
  /** 插件类型 */
  type: ImmersivePluginType;
  
  /** 插件显示名称 */
  label: string;
  
  /** 插件图标（emoji 或图标组件） */
  icon: string;
  
  /** 
   * 路由路径（type='component'时使用）
   * 或外部URL（type='external'/'iframe'时使用）
   */
  route: string;
  
  /** 是否显示返回按钮 */
  showBackButton?: boolean;
  
  /** 返回按钮位置 */
  backButtonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** 是否显示情绪小人 */
  showEmotionCharacter?: boolean;
  
  /** 是否完全沉浸（隐藏所有UI） */
  fullImmersive?: boolean;
  
  /** 
   * iframe 配置（仅当 type='iframe' 时使用）
   */
  iframeConfig?: {
    /** 是否允许全屏 */
    allowFullscreen?: boolean;
    /** 沙箱权限 */
    sandbox?: string;
    /** 额外的 iframe 属性 */
    [key: string]: unknown;
  };
  
  /**
   * 自定义返回路径
   */
  backRoute?: string;
}

/**
 * 内置沉浸式插件配置
 */
export const IMMERSIVE_PLUGINS: Record<string, ImmersivePluginConfig> = {
  relax: {
    id: 'relax',
    type: 'component',
    label: '休息一下',
    icon: '✈️',
    route: '/relax',
    showBackButton: true,
    backButtonPosition: 'top-left',
    showEmotionCharacter: true,
    fullImmersive: false,
    backRoute: '/',
  },
  
  // 示例：外部网页嵌入（通过 iframe）
  // meditation: {
  //   id: 'meditation',
  //   type: 'iframe',
  //   label: '冥想空间',
  //   icon: '🧘',
  //   route: 'https://example.com/meditation',
  //   showBackButton: true,
  //   backButtonPosition: 'top-right',
  //   showEmotionCharacter: false,
  //   fullImmersive: true,
  //   iframeConfig: {
  //     allowFullscreen: true,
  //     sandbox: 'allow-scripts allow-same-origin',
  //   },
  // },
};

/**
 * 获取插件配置
 */
export function getImmersivePlugin(id: string): ImmersivePluginConfig | undefined {
  return IMMERSIVE_PLUGINS[id];
}

/**
 * 注册新的沉浸式插件
 */
export function registerImmersivePlugin(config: ImmersivePluginConfig): void {
  IMMERSIVE_PLUGINS[config.id] = config;
}

