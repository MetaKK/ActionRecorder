/**
 * 插件系统主入口
 * 导出所有公共 API
 */

// 类型定义
export * from "./types";

// 注册表
export { pluginRegistry } from "./registry";

// 日志系统
export { pluginLogger, createTimelineRecord } from "./logger";
export type { LogEntry, TimelineRecordParams } from "./logger";
export { LogLevel } from "./logger";

// 插件管理器
export { pluginManager } from "./manager";

// 预设插件
export { presetPlugins, registerPresetPlugins } from "./presets";

// React Hooks
export { usePlugins, usePlugin, usePluginNavigation } from "./hooks";

// 工具函数
export {
  completePluginWithRecord,
  formatDuration,
  getPluginDisplayInfo,
} from "./utils";
export type { PluginCompletionData } from "./utils";

