/**
 * 导出功能工具函数 - 多模态内容导出
 */

import { Record, ExportTimeRange } from '@/lib/types';
import { formatDate, formatTime, formatDateTime, groupByDate, getDateLabel } from './date';
import { formatDuration } from './audio';

/**
 * 导出格式类型
 */
export type ExportFormat = 'text' | 'markdown' | 'json';

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
      return records;
    
    default: {
      // 支持特定日期，格式：YYYY-MM-DD
      if (typeof timeRange === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timeRange)) {
        const targetDate = new Date(timeRange);
        const nextDate = new Date(targetDate);
        nextDate.setDate(targetDate.getDate() + 1);
        
        return records.filter(record => {
          const recordDate = record.createdAt;
          return recordDate >= targetDate && recordDate < nextDate;
        });
      }
      return records;
    }
  }
}

/**
 * 格式化地址信息（简洁版）
 */
function formatLocationSimple(location: Record['location']): string {
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
  
  return parts.length > 0 ? parts.join(' ') : '未知位置';
}

/**
 * 格式化地址信息（完整版 - 包含坐标）
 * 保留用于未来可能的导出选项
 */
function formatLocationDetailed(location: Record['location']): string {
  if (!location) return '';
  
  const addressStr = formatLocationSimple(location);
  const lat = location.latitude.toFixed(6);
  const lng = location.longitude.toFixed(6);
  
  return `${addressStr} (${lat}, ${lng})`;
}

/**
 * 格式化记录为纯文本（AI友好）
 */
export function formatRecordsAsText(
  records: Record[],
  timeRange: ExportTimeRange
): string {
  if (records.length === 0) {
    return '暂无记录';
  }
  
  const filteredRecords = filterRecordsByTimeRange(records, timeRange);
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  const grouped = groupByDate(sortedRecords);
  
  let output = '';
  
  // 按日期分组输出
  Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .forEach(([, items]) => {
      const dateLabel = getDateLabel(items[0].createdAt);
      output += `${formatDate(items[0].createdAt)} (${dateLabel})\n`;
      output += '─'.repeat(40) + '\n\n';
      
      items
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .forEach(item => {
          // 时间
          output += `[${formatTime(item.createdAt)}] `;
          
          // 文本内容
          if (item.content) {
            output += item.content;
          }
          
          // 多模态标记
          const tags: string[] = [];
          
          if (item.hasAudio && item.audioDuration) {
            tags.push(`[音频 ${formatDuration(item.audioDuration)}]`);
          }
          
          if (item.hasImages && item.images) {
            const imageCount = item.images.filter(m => m.type === 'image').length;
            const videoCount = item.images.filter(m => m.type === 'video').length;
            
            if (item.images.length === 1) {
              const media = item.images[0];
              if (media.type === 'video') {
                tags.push(`[视频 ${media.duration ? formatDuration(media.duration) : ''}]`);
              } else {
                tags.push(`[图片 ${media.width}×${media.height}]`);
              }
            } else {
              const parts: string[] = [];
              if (imageCount > 0) parts.push(`${imageCount}张图片`);
              if (videoCount > 0) parts.push(`${videoCount}个视频`);
              tags.push(`[${parts.join('和')}]`);
            }
          }
          
          if (tags.length > 0) {
            output += ' ' + tags.join(' ');
          }
          
          output += '\n';
          
          // 位置信息
          if (item.location) {
            output += `  📍 ${formatLocationSimple(item.location)}\n`;
          }
          
          output += '\n';
        });
    });
  
  return output.trim();
}

/**
 * 格式化记录为 Markdown（文档友好）
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
  
  // 按日期分组输出
  Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .forEach(([, items]) => {
      const dateLabel = getDateLabel(items[0].createdAt);
      markdown += `## ${formatDate(items[0].createdAt)} · ${dateLabel}\n\n`;
      
      items
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .forEach(item => {
          // 时间戳
          markdown += `**${formatTime(item.createdAt)}**`;
          
          // 位置标记（在同一行）
          if (item.location) {
            markdown += ` · 📍 ${formatLocationSimple(item.location)}`;
          }
          
          markdown += '\n\n';
          
          // 文本内容
          if (item.content) {
            markdown += `${item.content}\n\n`;
          }
          
          // 多模态内容标记
          const attachments: string[] = [];
          
          if (item.hasAudio && item.audioDuration) {
            attachments.push(`🎵 音频 (${formatDuration(item.audioDuration)})`);
          }
          
          if (item.hasImages && item.images) {
            item.images.forEach((media, idx) => {
              if (media.type === 'video') {
                const duration = media.duration ? ` (${formatDuration(media.duration)})` : '';
                attachments.push(`🎬 视频${item.images && item.images.length > 1 ? idx + 1 : ''}${duration}`);
              } else {
                attachments.push(`📷 图片${item.images && item.images.length > 1 ? idx + 1 : ''} (${media.width}×${media.height})`);
              }
            });
          }
          
          if (attachments.length > 0) {
            markdown += attachments.map(a => `> ${a}`).join('\n') + '\n\n';
          }
          
          // 详细位置信息（如果有）
          if (item.location) {
            const lat = item.location.latitude.toFixed(6);
            const lng = item.location.longitude.toFixed(6);
            markdown += `<sub>坐标: ${lat}, ${lng}</sub>\n\n`;
          }
          
          markdown += '---\n\n';
        });
    });
  
  return markdown;
}

/**
 * 格式化记录为 JSON（完整数据备份）
 */
export function formatRecordsAsJSON(
  records: Record[],
  timeRange: ExportTimeRange
): string {
  const filteredRecords = filterRecordsByTimeRange(records, timeRange);
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    timeRange,
    totalRecords: sortedRecords.length,
    records: sortedRecords.map(record => ({
      id: record.id,
      content: record.content,
      timestamp: record.timestamp,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      
      // 位置信息
      location: record.location ? {
        latitude: record.location.latitude,
        longitude: record.location.longitude,
        accuracy: record.location.accuracy,
        address: record.location.address,
        city: record.location.city,
        district: record.location.district,
        street: record.location.street,
      } : undefined,
      
      // 音频信息（不包含音频数据，只包含元数据）
      audio: record.hasAudio ? {
        duration: record.audioDuration,
        format: record.audioFormat,
        hasData: !!record.audioData,
      } : undefined,
      
      // 媒体信息（图片+视频，不包含实际数据，只包含元数据）
      images: record.hasImages && record.images ? record.images.map(media => ({
        id: media.id,
        type: media.type,           // 'image' | 'video'
        width: media.width,
        height: media.height,
        size: media.size,
        mimeType: media.mimeType,
        duration: media.duration,   // 仅视频
        createdAt: media.createdAt,
      })) : undefined,
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * 统一导出接口
 */
export function exportRecords(
  records: Record[],
  timeRange: ExportTimeRange,
  format: ExportFormat
): string {
  switch (format) {
    case 'text':
      return formatRecordsAsText(records, timeRange);
    case 'markdown':
      return formatRecordsAsMarkdown(records, timeRange);
    case 'json':
      return formatRecordsAsJSON(records, timeRange);
    default:
      return formatRecordsAsText(records, timeRange);
  }
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
 * 下载为文件
 */
export function downloadAsFile(
  content: string,
  filename: string,
  format: ExportFormat
): void {
  // 根据格式确定 MIME 类型
  const mimeTypes = {
    text: 'text/plain',
    markdown: 'text/markdown',
    json: 'application/json',
  };
  
  const mimeType = mimeTypes[format] || 'text/plain';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成文件名
 */
export function generateFilename(format: ExportFormat): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
  
  const extensions = {
    text: 'txt',
    markdown: 'md',
    json: 'json',
  };
  
  const ext = extensions[format] || 'txt';
  return `life-records-${timestamp}.${ext}`;
}

