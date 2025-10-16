/**
 * 插件系统工具函数
 * 提供常用的辅助功能
 */

import { pluginManager } from "./manager";
import { pluginLogger, createTimelineRecord, TimelineRecordParams } from "./logger";
import { pluginRegistry } from "./registry";

/**
 * 插件完成数据
 */
export interface PluginCompletionData {
  pluginId: string;
  duration?: number; // 持续时间（秒）
  content?: string; // 自定义内容
  customData?: Record<string, any>; // 自定义数据
}

/**
 * 标记插件完成并记录到时间线
 * 这是一个通用函数，所有插件都可以使用
 */
export async function completePluginWithRecord(
  data: PluginCompletionData,
  addRecordFn: (content: string) => void
): Promise<void> {
  const { pluginId, duration, content, customData } = data;

  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    pluginLogger.error(`Plugin "${pluginId}" not found`, pluginId);
    return;
  }

  try {
    // 格式化时长
    let durationText: string | undefined;
    if (duration) {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      if (mins > 0) {
        durationText = secs > 0 ? `${mins} 分钟 ${secs} 秒` : `${mins} 分钟`;
      } else {
        durationText = `${secs} 秒`;
      }
    }

    // 构建时间线记录内容
    const recordParams: TimelineRecordParams = {
      pluginId,
      pluginName: plugin.metadata.name,
      icon: plugin.metadata.icon,
      content: content || `完成 ${plugin.metadata.name}`,
      duration: durationText,
      customData,
    };

    const recordContent = createTimelineRecord(recordParams);

    // 记录到时间线
    addRecordFn(recordContent);

    // 标记插件完成
    await pluginManager.complete(pluginId, {
      data: {
        duration,
        content,
        ...customData,
      },
    });

    pluginLogger.info(`Plugin "${pluginId}" completed and recorded`, pluginId, {
      duration,
      content,
    });
  } catch (error) {
    pluginLogger.error(
      `Error completing plugin "${pluginId}": ${error}`,
      pluginId,
      { error }
    );
  }
}

/**
 * 格式化持续时间
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins > 0) {
    return secs > 0 ? `${mins} 分钟 ${secs} 秒` : `${mins} 分钟`;
  }
  
  return `${secs} 秒`;
}

/**
 * 获取插件的显示信息
 */
export function getPluginDisplayInfo(pluginId: string) {
  const plugin = pluginRegistry.get(pluginId);
  
  if (!plugin) {
    return null;
  }

  return {
    id: plugin.metadata.id,
    name: plugin.metadata.name,
    icon: plugin.metadata.icon,
    color: plugin.metadata.color,
    description: plugin.metadata.description,
  };
}

