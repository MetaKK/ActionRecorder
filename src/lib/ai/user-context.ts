/**
 * 用户上下文生成器
 * 基于用户记录生成AI上下文信息
 */

import { Record } from '@/lib/types';
import { formatTime, formatDate } from '@/lib/utils/date';

export interface UserContext {
  recentRecords: string;
  todayRecords: string;
  weeklyPattern: string;
  locationPattern: string;
  activityPattern: string;
  timePattern: string;
}

/**
 * 生成用户上下文信息
 */
export function generateUserContext(records: Record[]): UserContext {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 今日记录
  const todayRecords = records.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= today;
  });
  
  // 最近7天记录
  const recentRecords = records.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= weekAgo;
  });
  
  return {
    recentRecords: formatRecentRecords(recentRecords),
    todayRecords: formatTodayRecords(todayRecords),
    weeklyPattern: analyzeWeeklyPattern(recentRecords),
    locationPattern: analyzeLocationPattern(recentRecords),
    activityPattern: analyzeActivityPattern(recentRecords),
    timePattern: analyzeTimePattern(recentRecords),
  };
}

/**
 * 格式化最近记录
 */
function formatRecentRecords(records: Record[]): string {
  if (records.length === 0) {
    return "暂无最近记录";
  }
  
  const sortedRecords = records
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10); // 只取最近10条
  
  return sortedRecords
    .map(record => {
      const time = formatTime(record.createdAt);
      const date = formatDate(record.createdAt);
      const content = record.content || '(无文字记录)';
      const location = record.location?.city || record.location?.district || '';
      const media = [];
      
      if (record.hasAudio) media.push('🎵音频');
      if (record.hasImages) media.push('📷图片');
      
      const mediaStr = media.length > 0 ? ` [${media.join(', ')}]` : '';
      const locationStr = location ? ` @ ${location}` : '';
      
      return `- ${date} ${time}${locationStr}: ${content}${mediaStr}`;
    })
    .join('\n');
}

/**
 * 格式化今日记录
 */
function formatTodayRecords(records: Record[]): string {
  if (records.length === 0) {
    return "今日暂无记录";
  }
  
  const sortedRecords = records
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  return sortedRecords
    .map(record => {
      const time = formatTime(record.createdAt);
      const content = record.content || '(无文字记录)';
      const location = record.location?.city || record.location?.district || '';
      const media = [];
      
      if (record.hasAudio) media.push('🎵');
      if (record.hasImages) media.push('📷');
      
      const mediaStr = media.length > 0 ? ` ${media.join('')}` : '';
      const locationStr = location ? ` @ ${location}` : '';
      
      return `- ${time}${locationStr}: ${content}${mediaStr}`;
    })
    .join('\n');
}

/**
 * 分析周模式
 */
function analyzeWeeklyPattern(records: Record[]): string {
  if (records.length === 0) {
    return "暂无数据进行分析";
  }
  
  const dayCounts = new Map<string, number>();
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  records.forEach(record => {
    const dayOfWeek = record.createdAt.getDay();
    const dayName = dayNames[dayOfWeek];
    dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
  });
  
  const sortedDays = Array.from(dayCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  if (sortedDays.length === 0) {
    return "暂无记录模式";
  }
  
  const mostActiveDay = sortedDays[0];
  const leastActiveDay = sortedDays[sortedDays.length - 1];
  
  return `最活跃: ${mostActiveDay[0]}(${mostActiveDay[1]}条), 最少: ${leastActiveDay[0]}(${leastActiveDay[1]}条)`;
}

/**
 * 分析位置模式
 */
function analyzeLocationPattern(records: Record[]): string {
  const locationCounts = new Map<string, number>();
  
  records.forEach(record => {
    if (record.location) {
      const location = record.location.city || record.location.district || '未知位置';
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    }
  });
  
  if (locationCounts.size === 0) {
    return "暂无位置信息";
  }
  
  const sortedLocations = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return sortedLocations
    .map(([location, count]) => `${location}(${count}次)`)
    .join(', ');
}

/**
 * 分析活动模式
 */
function analyzeActivityPattern(records: Record[]): string {
  if (records.length === 0) {
    return "暂无活动数据";
  }
  
  const totalRecords = records.length;
  const audioRecords = records.filter(r => r.hasAudio).length;
  const imageRecords = records.filter(r => r.hasImages).length;
  const textOnlyRecords = records.filter(r => !r.hasAudio && !r.hasImages).length;
  
  const patterns = [];
  if (audioRecords > 0) {
    patterns.push(`语音记录 ${audioRecords}次 (${Math.round(audioRecords/totalRecords*100)}%)`);
  }
  if (imageRecords > 0) {
    patterns.push(`图片记录 ${imageRecords}次 (${Math.round(imageRecords/totalRecords*100)}%)`);
  }
  if (textOnlyRecords > 0) {
    patterns.push(`纯文字 ${textOnlyRecords}次 (${Math.round(textOnlyRecords/totalRecords*100)}%)`);
  }
  
  return patterns.length > 0 ? patterns.join(', ') : "暂无记录模式";
}

/**
 * 分析时间模式
 */
function analyzeTimePattern(records: Record[]): string {
  if (records.length === 0) {
    return "暂无时间数据";
  }
  
  const hourCounts = new Map<number, number>();
  
  records.forEach(record => {
    const hour = record.createdAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  
  const sortedHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (sortedHours.length === 0) {
    return "暂无时间模式";
  }
  
  return sortedHours
    .map(([hour, count]) => `${hour}:00-${hour+1}:00(${count}次)`)
    .join(', ');
}

/**
 * 生成完整的用户上下文字符串
 */
export function formatUserContext(context: UserContext): string {
  return `## 用户生活记录上下文

### 📅 今日活动
${context.todayRecords}

### 📝 最近记录 (最近7天)
${context.recentRecords}

### 📊 生活模式分析
- **活跃时间**: ${context.timePattern}
- **活跃地点**: ${context.locationPattern}
- **记录方式**: ${context.activityPattern}
- **周活跃度**: ${context.weeklyPattern}

---
*基于用户的历史记录数据生成，帮助AI更好地理解用户的生活模式*`;
}
