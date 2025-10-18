/**
 * 日期格式化工具函数
 */

import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化时间为 HH:mm
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: zhCN });
}

/**
 * 格式化为简短日期时间 MM-dd HH:mm
 */
export function formatShortDateTime(date: Date): string {
  return format(date, 'MM-dd HH:mm', { locale: zhCN });
}

/**
 * 格式化日期为 yyyy-MM-dd
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd', { locale: zhCN });
}

/**
 * 格式化完整日期时间
 */
export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
}

/**
 * 获取日期标签（今天/昨天/具体日期）
 */
export function getDateLabel(date: Date): string {
  if (isToday(date)) {
    return '今天';
  }
  if (isYesterday(date)) {
    return '昨天';
  }
  
  const days = differenceInDays(new Date(), date);
  if (days < 7) {
    return `${days}天前`;
  }
  
  return formatDate(date);
}

/**
 * 按日期分组记录
 */
export function groupByDate<T extends { createdAt: Date }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  items.forEach(item => {
    const dateKey = formatDate(item.createdAt);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    const dayItems = groups.get(dateKey);
    if (dayItems) {
      dayItems.push(item);
    }
  });
  
  return groups;
}

