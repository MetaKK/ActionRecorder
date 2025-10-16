/**
 * 插件日志记录系统
 * 统一管理插件的日志记录、事件追踪和数据持久化
 */

import { PluginEvent, PluginEventType, PluginHookContext } from "./types";

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  pluginId?: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * 插件日志记录器
 */
class PluginLogger {
  private logs: LogEntry[] = [];
  private events: PluginEvent[] = [];
  private maxLogs = 1000; // 最多保留 1000 条日志
  private maxEvents = 500; // 最多保留 500 个事件

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, pluginId?: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      pluginId,
      timestamp: Date.now(),
      data,
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 在开发环境输出到控制台
    if (process.env.NODE_ENV === "development") {
      const prefix = pluginId ? `[Plugin:${pluginId}]` : "[Plugin]";
      console[level === LogLevel.ERROR ? "error" : "log"](prefix, message, data || "");
    }
  }

  /**
   * Debug 日志
   */
  debug(message: string, pluginId?: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, pluginId, data);
  }

  /**
   * Info 日志
   */
  info(message: string, pluginId?: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, pluginId, data);
  }

  /**
   * Warning 日志
   */
  warn(message: string, pluginId?: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, pluginId, data);
  }

  /**
   * Error 日志
   */
  error(message: string, pluginId?: string, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, pluginId, data);
  }

  /**
   * 记录插件事件
   */
  trackEvent(event: PluginEvent): void {
    this.events.push(event);

    // 限制事件数量
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // 记录到日志
    this.info(`Event: ${event.type}`, event.pluginId, event.data);
  }

  /**
   * 获取所有日志
   */
  getLogs(pluginId?: string, level?: LogLevel): LogEntry[] {
    let filtered = this.logs;

    if (pluginId) {
      filtered = filtered.filter((log) => log.pluginId === pluginId);
    }

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    return filtered;
  }

  /**
   * 获取所有事件
   */
  getEvents(pluginId?: string, type?: PluginEventType): PluginEvent[] {
    let filtered = this.events;

    if (pluginId) {
      filtered = filtered.filter((event) => event.pluginId === pluginId);
    }

    if (type) {
      filtered = filtered.filter((event) => event.type === type);
    }

    return filtered;
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 清空事件
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * 导出日志（用于调试）
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 导出事件（用于分析）
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

/**
 * 导出单例实例
 */
export const pluginLogger = new PluginLogger();

/**
 * 创建用于记录到时间线的辅助函数
 * 这个函数会在插件完成时自动记录到用户的时间线
 */
export interface TimelineRecordParams {
  pluginId: string;
  pluginName: string;
  icon: string;
  content: string;
  duration?: string;
  customData?: Record<string, any>;
}

export function createTimelineRecord(params: TimelineRecordParams): string {
  const { icon, pluginName, content, duration } = params;
  
  let record = `${icon} ${content}`;
  
  if (duration) {
    record += `\n⏱️ 时长：${duration}`;
  }
  
  return record;
}

