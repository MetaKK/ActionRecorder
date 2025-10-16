/**
 * 插件注册表实现
 * 单例模式，全局唯一
 */

import { Plugin, PluginRegistry, PluginCategory } from "./types";

class PluginRegistryImpl implements PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private static instance: PluginRegistryImpl;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PluginRegistryImpl {
    if (!PluginRegistryImpl.instance) {
      PluginRegistryImpl.instance = new PluginRegistryImpl();
    }
    return PluginRegistryImpl.instance;
  }

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      console.warn(
        `Plugin with id "${plugin.metadata.id}" already exists. Overwriting...`
      );
    }
    this.plugins.set(plugin.metadata.id, plugin);
  }

  /**
   * 注销插件
   */
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  /**
   * 获取插件
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values()).sort(
      (a, b) => (b.metadata.weight || 0) - (a.metadata.weight || 0)
    );
  }

  /**
   * 获取已启用的插件
   */
  getEnabled(): Plugin[] {
    return this.getAll().filter((plugin) => plugin.metadata.enabled);
  }

  /**
   * 根据类别获取插件
   */
  getByCategory(category: PluginCategory): Plugin[] {
    return this.getEnabled().filter(
      (plugin) => plugin.metadata.category === category
    );
  }

  /**
   * 启用插件
   */
  enable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.metadata.enabled = true;
    }
  }

  /**
   * 禁用插件
   */
  disable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.metadata.enabled = false;
    }
  }

  /**
   * 清空所有插件（主要用于测试）
   */
  clear(): void {
    this.plugins.clear();
  }
}

/**
 * 导出单例实例
 */
export const pluginRegistry = PluginRegistryImpl.getInstance();

