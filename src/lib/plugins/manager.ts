/**
 * 插件管理器
 * 负责插件的激活、导航、生命周期管理
 */

import { Plugin, PluginHookContext, PluginEventType, PluginType } from "./types";
import { pluginRegistry } from "./registry";
import { pluginLogger } from "./logger";

class PluginManager {
  /**
   * 激活插件
   */
  async activate(pluginId: string, context?: Partial<PluginHookContext>): Promise<boolean> {
    const plugin = pluginRegistry.get(pluginId);

    if (!plugin) {
      pluginLogger.error(`Plugin "${pluginId}" not found`, pluginId);
      return false;
    }

    if (!plugin.metadata.enabled) {
      pluginLogger.warn(`Plugin "${pluginId}" is disabled`, pluginId);
      return false;
    }

    const hookContext: PluginHookContext = {
      pluginId,
      timestamp: Date.now(),
      ...context,
    };

    try {
      // 执行 onBeforeActivate 钩子
      if (plugin.hooks?.onBeforeActivate) {
        const result = await plugin.hooks.onBeforeActivate(hookContext);
        if (result === false) {
          pluginLogger.info(`Plugin "${pluginId}" activation cancelled by hook`, pluginId);
          return false;
        }
      }

      pluginLogger.info(`Plugin "${pluginId}" activated`, pluginId);

      // 记录事件
      pluginLogger.trackEvent({
        type: PluginEventType.ACTIVATED,
        pluginId,
        timestamp: Date.now(),
        data: context?.data,
      });

      // 执行 onAfterActivate 钩子
      if (plugin.hooks?.onAfterActivate) {
        await plugin.hooks.onAfterActivate(hookContext);
      }

      return true;
    } catch (error) {
      pluginLogger.error(
        `Error activating plugin "${pluginId}": ${error}`,
        pluginId,
        { error }
      );

      // 执行错误处理钩子
      if (plugin.hooks?.onError && error instanceof Error) {
        await plugin.hooks.onError(error, hookContext);
      }

      return false;
    }
  }

  /**
   * 导航到插件
   */
  async navigate(
    pluginId: string,
    context?: Partial<PluginHookContext>
  ): Promise<{ success: boolean; url?: string }> {
    const plugin = pluginRegistry.get(pluginId);

    if (!plugin) {
      pluginLogger.error(`Plugin "${pluginId}" not found`, pluginId);
      return { success: false };
    }

    const hookContext: PluginHookContext = {
      pluginId,
      timestamp: Date.now(),
      ...context,
    };

    try {
      // 执行 onBeforeNavigate 钩子
      if (plugin.hooks?.onBeforeNavigate) {
        const result = await plugin.hooks.onBeforeNavigate(hookContext);
        if (result === false) {
          pluginLogger.info(`Plugin "${pluginId}" navigation cancelled by hook`, pluginId);
          return { success: false };
        }
      }

      // 构建导航 URL
      let url: string;
      
      if (plugin.config.type === PluginType.EXTERNAL && plugin.config.externalUrl) {
        // 外部链接通过 iframe 页面加载
        url = `/iframe?url=${encodeURIComponent(plugin.config.externalUrl)}&title=${encodeURIComponent(plugin.metadata.name)}`;
      } else if (plugin.config.route) {
        // 内部路由
        url = plugin.config.route;
      } else {
        pluginLogger.error(`Plugin "${pluginId}" has no valid route or URL`, pluginId);
        return { success: false };
      }

      pluginLogger.info(`Navigating to plugin "${pluginId}" at ${url}`, pluginId);

      // 记录事件
      pluginLogger.trackEvent({
        type: PluginEventType.NAVIGATED,
        pluginId,
        timestamp: Date.now(),
        data: { url, ...context?.data },
      });

      // 执行 onAfterNavigate 钩子
      if (plugin.hooks?.onAfterNavigate) {
        await plugin.hooks.onAfterNavigate(hookContext);
      }

      return { success: true, url };
    } catch (error) {
      pluginLogger.error(
        `Error navigating to plugin "${pluginId}": ${error}`,
        pluginId,
        { error }
      );

      // 执行错误处理钩子
      if (plugin.hooks?.onError && error instanceof Error) {
        await plugin.hooks.onError(error, hookContext);
      }

      return { success: false };
    }
  }

  /**
   * 标记插件完成
   */
  async complete(pluginId: string, context?: Partial<PluginHookContext>): Promise<void> {
    const plugin = pluginRegistry.get(pluginId);

    if (!plugin) {
      pluginLogger.error(`Plugin "${pluginId}" not found`, pluginId);
      return;
    }

    const hookContext: PluginHookContext = {
      pluginId,
      timestamp: Date.now(),
      ...context,
    };

    try {
      pluginLogger.info(`Plugin "${pluginId}" completed`, pluginId, context?.data);

      // 记录事件
      pluginLogger.trackEvent({
        type: PluginEventType.COMPLETED,
        pluginId,
        timestamp: Date.now(),
        data: context?.data,
      });

      // 执行 onComplete 钩子
      if (plugin.hooks?.onComplete) {
        await plugin.hooks.onComplete(hookContext);
      }
    } catch (error) {
      pluginLogger.error(
        `Error completing plugin "${pluginId}": ${error}`,
        pluginId,
        { error }
      );

      // 执行错误处理钩子
      if (plugin.hooks?.onError && error instanceof Error) {
        await plugin.hooks.onError(error, hookContext);
      }
    }
  }

  /**
   * 获取插件导航 URL
   */
  getPluginUrl(pluginId: string): string | null {
    const plugin = pluginRegistry.get(pluginId);

    if (!plugin) {
      return null;
    }

    if (plugin.config.type === PluginType.EXTERNAL && plugin.config.externalUrl) {
      return `/iframe?url=${encodeURIComponent(plugin.config.externalUrl)}&title=${encodeURIComponent(plugin.metadata.name)}`;
    }

    return plugin.config.route || null;
  }
}

/**
 * 导出单例实例
 */
export const pluginManager = new PluginManager();

