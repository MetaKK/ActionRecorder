/**
 * 插件系统 React Hooks
 * 提供在 React 组件中使用插件系统的钩子函数
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plugin, PluginCategory, PluginHookContext } from "./types";
import { pluginRegistry } from "./registry";
import { pluginManager } from "./manager";
import { pluginLogger } from "./logger";

/**
 * 使用所有插件
 */
export function usePlugins(category?: PluginCategory) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    const loadPlugins = () => {
      if (category) {
        setPlugins(pluginRegistry.getByCategory(category));
      } else {
        setPlugins(pluginRegistry.getEnabled());
      }
    };

    loadPlugins();
  }, [category]);

  return plugins;
}

/**
 * 使用单个插件
 */
export function usePlugin(pluginId: string) {
  const [plugin, setPlugin] = useState<Plugin | undefined>();

  useEffect(() => {
    const loadPlugin = () => {
      setPlugin(pluginRegistry.get(pluginId));
    };

    loadPlugin();
  }, [pluginId]);

  return plugin;
}

/**
 * 使用插件导航
 */
export function usePluginNavigation() {
  const router = useRouter();

  /**
   * 导航到插件
   */
  const navigateToPlugin = useCallback(
    async (pluginId: string, context?: Partial<PluginHookContext>) => {
      try {
        // 激活插件
        const activated = await pluginManager.activate(pluginId, context);
        if (!activated) {
          pluginLogger.warn(`Failed to activate plugin "${pluginId}"`, pluginId);
          return false;
        }

        // 导航
        const result = await pluginManager.navigate(pluginId, context);
        if (result.success && result.url) {
          router.push(result.url);
          return true;
        }

        return false;
      } catch (error) {
        pluginLogger.error(`Error navigating to plugin "${pluginId}": ${error}`, pluginId);
        return false;
      }
    },
    [router]
  );

  /**
   * 获取插件 URL（不导航）
   */
  const getPluginUrl = useCallback((pluginId: string) => {
    return pluginManager.getPluginUrl(pluginId);
  }, []);

  /**
   * 标记插件完成
   */
  const completePlugin = useCallback(
    async (pluginId: string, context?: Partial<PluginHookContext>) => {
      await pluginManager.complete(pluginId, context);
    },
    []
  );

  return {
    navigateToPlugin,
    getPluginUrl,
    completePlugin,
  };
}

