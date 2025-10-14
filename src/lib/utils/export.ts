/**
 * 导出功能工具函数
 */

import { Record, ExportTimeRange } from '@/lib/types';
import { formatDate, formatTime, formatDateTime, groupByDate, getDateLabel } from './date';

/**
 * 根据时间范围过滤记录
 */
export function filterRecordsByTimeRange(
  records: Record[],
  timeRange: ExportTimeRange
): Record[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeRange) {
    case 'today':
      return records.filter(record => record.createdAt >= today);
    
    case '7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return records.filter(record => record.createdAt >= sevenDaysAgo);
    }
    
    case '30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return records.filter(record => record.createdAt >= thirtyDaysAgo);
    }
    
    case 'all':
    default:
      return records;
  }
}

/**
 * 格式化地址信息
 */
function formatLocation(location: Record['location']): string {
  if (!location) return '';
  
  const parts: string[] = [];
  
  // 构建地址字符串
  if (location.city || location.district || location.street) {
    if (location.city) parts.push(location.city);
    if (location.district) parts.push(location.district);
    if (location.street) parts.push(location.street);
  } else if (location.address) {
    parts.push(location.address);
  }
  
  const addressStr = parts.length > 0 ? parts.join(', ') : '';
  
  // 添加经纬度元信息（精确到6位小数）
  const lat = location.latitude.toFixed(6);
  const lng = location.longitude.toFixed(6);
  const coords = `(${lat}, ${lng})`;
  
  // 如果有精度信息，也包含进来
  let accuracyStr = '';
  if (location.accuracy) {
    accuracyStr = ` [精度: ${location.accuracy.toFixed(0)}m]`;
  }
  
  return addressStr 
    ? `\n  📍 ${addressStr} ${coords}${accuracyStr}`
    : `\n  📍 坐标: ${coords}${accuracyStr}`;
}

/**
 * 格式化记录为 Markdown 格式
 */
export function formatRecordsAsMarkdown(
  records: Record[],
  timeRange: ExportTimeRange
): string {
  if (records.length === 0) {
    return '# 生活记录\n\n暂无记录';
  }
  
  const filteredRecords = filterRecordsByTimeRange(records, timeRange);
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  const grouped = groupByDate(sortedRecords);
  
  let markdown = '# 生活记录\n\n';
  
  // 统计信息
  let totalWithLocation = 0;
  let totalWithAudio = 0;
  
  // 按日期分组输出
  Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .forEach(([, items]) => {
      const dateLabel = getDateLabel(items[0].createdAt);
      markdown += `## ${formatDate(items[0].createdAt)} (${dateLabel})\n\n`;
      
      items
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .forEach(item => {
          // 基本内容
          markdown += `- ${formatTime(item.createdAt)} ${item.content}`;
          
          // 添加音频标记
          if (item.hasAudio && item.audioDuration) {
            const duration = Math.floor(item.audioDuration);
            markdown += ` 🎵[${duration}秒]`;
            totalWithAudio++;
          }
          
          markdown += '\n';
          
          // 添加地址信息和经纬度
          if (item.location) {
            markdown += formatLocation(item.location);
            markdown += '\n';
            totalWithLocation++;
          }
        });
      
      markdown += '\n';
    });
  
  // 添加元信息
  markdown += '---\n\n';
  markdown += `**导出统计**\n\n`;
  markdown += `- 导出时间：${formatDateTime(new Date())}\n`;
  markdown += `- 记录条数：${sortedRecords.length}\n`;
  markdown += `- 包含位置：${totalWithLocation} 条\n`;
  markdown += `- 包含音频：${totalWithAudio} 条\n`;
  
  const timeRangeLabel = {
    today: '今天',
    '7days': '最近7天',
    '30days': '最近30天',
    all: '全部',
  };
  markdown += `- 时间范围：${timeRangeLabel[timeRange]}\n`;
  
  return markdown;
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('复制失败，请手动复制');
  }
}

/**
 * 下载为文本文件
 */
export function downloadAsTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

