/**
 * 日记数据分析器
 * 从数据源中提取结构化信息
 */

import { Record } from '@/lib/types';
import { 
  DiarySource,
  DiarySourceType,
  DiaryAnalysis, 
  MoodPoint, 
  Activity,
  HistoricalContext,
  DiaryPreview 
} from './types';
import { formatTime } from '@/lib/utils/date';

/**
 * 分析今日数据源，生成结构化信息
 */
export function analyzeDailySources(
  sources: {
    records: DiarySource[];
    chats: DiarySource[];
    files: DiarySource[];
    notes: DiarySource[];
  }
): DiaryAnalysis {
  const allSources = [
    ...sources.records,
    ...sources.chats,
    ...sources.files,
    ...sources.notes,
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    mood: analyzeMood(allSources),
    moodCurve: analyzeMoodCurve(allSources),
    activities: extractActivities(sources.records),
    locations: extractLocations(sources.records),
    highlights: identifyHighlights(allSources),
    reflections: extractReflections(allSources),
    topics: extractTopics(allSources),
    peopleInteracted: extractPeople(allSources),
    timeDistribution: analyzeTimeDistribution(allSources),
  };
}

/**
 * 分析整体情绪
 */
function analyzeMood(sources: DiarySource[]): string {
  // 简单的情绪词典
  const positiveWords = ['开心', '快乐', '高兴', '愉快', '满足', '充实', '美好', '幸福', '兴奋', '期待'];
  const negativeWords = ['难过', '沮丧', '焦虑', '担心', '烦躁', '疲惫', '失落', '痛苦', '迷茫', '困惑'];
  const neutralWords = ['平静', '平常', '普通', '一般', '还好'];

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const allContent = sources.map(s => s.content).join(' ');

  positiveWords.forEach(word => {
    const matches = allContent.match(new RegExp(word, 'g'));
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const matches = allContent.match(new RegExp(word, 'g'));
    if (matches) negativeCount += matches.length;
  });

  neutralWords.forEach(word => {
    const matches = allContent.match(new RegExp(word, 'g'));
    if (matches) neutralCount += matches.length;
  });

  // 判断整体情绪
  if (positiveCount > negativeCount && positiveCount > neutralCount) {
    return '积极愉快';
  } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
    return '有些低落';
  } else if (positiveCount === negativeCount && positiveCount > 0) {
    return '复杂交织';
  } else {
    return '平静自然';
  }
}

/**
 * 分析情绪曲线
 */
function analyzeMoodCurve(sources: DiarySource[]): MoodPoint[] {
  if (sources.length === 0) return [];

  // 将一天分成几个时段
  const periods = ['早晨', '上午', '中午', '下午', '傍晚', '晚上', '深夜'];
  const moodPoints: MoodPoint[] = [];

  periods.forEach(period => {
    const periodSources = sources.filter(s => {
      const hour = s.timestamp.getHours();
      switch (period) {
        case '早晨': return hour >= 5 && hour < 8;
        case '上午': return hour >= 8 && hour < 12;
        case '中午': return hour >= 12 && hour < 14;
        case '下午': return hour >= 14 && hour < 17;
        case '傍晚': return hour >= 17 && hour < 19;
        case '晚上': return hour >= 19 && hour < 23;
        case '深夜': return hour >= 23 || hour < 5;
        default: return false;
      }
    });

    if (periodSources.length > 0) {
      const mood = analyzeMood(periodSources);
      // 简单的强度计算
      const intensity = periodSources.length > 3 ? 8 : periodSources.length > 1 ? 6 : 4;
      
      moodPoints.push({
        time: period,
        mood: mood,
        intensity: intensity,
      });
    }
  });

  return moodPoints;
}

/**
 * 提取活动列表
 */
function extractActivities(recordSources: DiarySource[]): Activity[] {
  return recordSources.map(source => {
    // 尝试从内容中提取活动类别
    const content = source.content.toLowerCase();
    let category: Activity['category'] = 'other';

    if (content.includes('工作') || content.includes('会议') || content.includes('项目')) {
      category = 'work';
    } else if (content.includes('朋友') || content.includes('聚会') || content.includes('聊天')) {
      category = 'social';
    } else if (content.includes('看') || content.includes('玩') || content.includes('游戏') || content.includes('电影')) {
      category = 'entertainment';
    } else {
      category = 'life';
    }

    return {
      time: formatTime(source.timestamp),
      description: source.content.substring(0, 100), // 截取前100字符作为描述
      location: source.metadata?.location?.address || source.metadata?.location?.city,
      category: category,
    };
  });
}

/**
 * 提取地点信息
 */
function extractLocations(recordSources: DiarySource[]): string[] {
  const locations = new Set<string>();

  recordSources.forEach(source => {
    const location = source.metadata?.location;
    if (location) {
      if (location.address) {
        locations.add(location.address);
      } else if (location.city) {
        locations.add(location.city);
      }
    }
  });

  return Array.from(locations);
}

/**
 * 识别今日亮点
 */
function identifyHighlights(sources: DiarySource[]): string[] {
  // 寻找较长的记录（通常包含更多细节）
  const detailedSources = sources
    .filter(s => s.content.length > 50)
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 3);

  return detailedSources.map(s => {
    // 提取第一句话或前80个字符作为亮点
    const firstSentence = s.content.split(/[。！？\n]/)[0];
    return firstSentence.substring(0, 80);
  });
}

/**
 * 提取反思片段
 */
function extractReflections(sources: DiarySource[]): string[] {
  const reflectionKeywords = ['觉得', '感觉', '想到', '意识到', '发现', '明白', '理解', '思考'];
  const reflections: string[] = [];

  sources.forEach(source => {
    const content = source.content;
    reflectionKeywords.forEach(keyword => {
      const index = content.indexOf(keyword);
      if (index !== -1) {
        // 提取包含关键词的句子
        const startIndex = Math.max(0, content.lastIndexOf('。', index) + 1);
        const endIndex = content.indexOf('。', index);
        const sentence = content.substring(
          startIndex,
          endIndex !== -1 ? endIndex : content.length
        );
        if (sentence.length > 10 && sentence.length < 200) {
          reflections.push(sentence.trim());
        }
      }
    });
  });

  // 去重并限制数量
  return Array.from(new Set(reflections)).slice(0, 5);
}

/**
 * 提取讨论主题
 */
function extractTopics(sources: DiarySource[]): string[] {
  // 简单的关键词提取（实际应用中可以使用更复杂的 NLP 算法）
  const allContent = sources.map(s => s.content).join(' ');
  
  // 常见主题词
  const topicKeywords = [
    '工作', '项目', '学习', '健康', '运动', '家人', '朋友',
    '旅行', '阅读', '电影', '音乐', '美食', '计划', '目标',
    '情感', '思考', '生活', '未来', '梦想', '挑战'
  ];

  const topics: string[] = [];
  topicKeywords.forEach(keyword => {
    if (allContent.includes(keyword)) {
      topics.push(keyword);
    }
  });

  return topics.slice(0, 10);
}

/**
 * 提取互动的人
 */
function extractPeople(sources: DiarySource[]): string[] {
  const people = new Set<string>();
  const allContent = sources.map(s => s.content).join(' ');

  // 简单的人名模式匹配（中文名字）
  const namePattern = /[和与跟同]([A-Za-z\u4e00-\u9fa5]{2,4})[一起聊见面]/g;
  let match;
  while ((match = namePattern.exec(allContent)) !== null) {
    people.add(match[1]);
  }

  // 匹配常见称呼
  const titles = ['妈妈', '爸爸', '同事', '老师', '朋友', '伙伴', '室友'];
  titles.forEach(title => {
    if (allContent.includes(title)) {
      people.add(title);
    }
  });

  return Array.from(people).slice(0, 10);
}

/**
 * 分析时间分布
 */
function analyzeTimeDistribution(sources: DiarySource[]): {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
} {
  return {
    morning: sources.filter(s => {
      const hour = s.timestamp.getHours();
      return hour >= 5 && hour < 12;
    }).length,
    afternoon: sources.filter(s => {
      const hour = s.timestamp.getHours();
      return hour >= 12 && hour < 17;
    }).length,
    evening: sources.filter(s => {
      const hour = s.timestamp.getHours();
      return hour >= 17 && hour < 22;
    }).length,
    night: sources.filter(s => {
      const hour = s.timestamp.getHours();
      return hour >= 22 || hour < 5;
    }).length,
  };
}

/**
 * 分析历史上下文
 */
export function analyzeHistoricalContext(
  allRecords: Record[],
  previousDiaries?: DiaryPreview[]
): HistoricalContext {
  // 分析最近7天的记录
  const recentRecords = allRecords.filter(record => {
    const daysDiff = (Date.now() - record.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });

  return {
    writingStyle: inferWritingStyle(recentRecords),
    interests: extractInterests(recentRecords),
    emotionalTone: inferEmotionalTone(recentRecords),
    recentPatterns: identifyPatterns(recentRecords),
    previousDiaries: previousDiaries?.slice(0, 3) || [],
  };
}

/**
 * 推断写作风格
 */
function inferWritingStyle(records: Record[]): string {
  if (records.length === 0) {
    return '简洁明快，注重记录关键事件和感受';
  }

  const avgLength = records.reduce((sum, r) => sum + r.content.length, 0) / records.length;
  const hasDetailedRecords = records.some(r => r.content.length > 200);
  const hasEmoji = records.some(r => /[\u{1F300}-\u{1F9FF}]/u.test(r.content));

  if (avgLength > 150 && hasDetailedRecords) {
    return '细腻详实，喜欢用文字描绘生活细节和内心感受';
  } else if (avgLength < 50) {
    return '简洁明快，倾向于用关键词记录要点';
  } else if (hasEmoji) {
    return '轻松活泼，善于用表情符号表达情感';
  } else {
    return '真实自然，用朴实的语言记录日常';
  }
}

/**
 * 提取兴趣爱好
 */
function extractInterests(records: Record[]): string[] {
  const interestKeywords = {
    '阅读': ['读', '书', '文章', '小说'],
    '运动': ['跑步', '健身', '运动', '锻炼', '球'],
    '音乐': ['音乐', '歌', '听歌', '演唱会'],
    '电影': ['电影', '影片', '观影'],
    '美食': ['美食', '餐厅', '吃', '料理'],
    '旅行': ['旅行', '旅游', '出游', '游玩'],
    '摄影': ['拍照', '摄影', '照片'],
    '游戏': ['游戏', '玩'],
    '编程': ['代码', '编程', '开发', '项目'],
  };

  const allContent = records.map(r => r.content).join(' ');
  const interests: string[] = [];

  Object.entries(interestKeywords).forEach(([interest, keywords]) => {
    if (keywords.some(keyword => allContent.includes(keyword))) {
      interests.push(interest);
    }
  });

  return interests;
}

/**
 * 推断情绪基调
 */
function inferEmotionalTone(records: Record[]): string {
  const sources: DiarySource[] = records.map(r => ({
    type: DiarySourceType.RECORDS,
    id: r.id,
    timestamp: r.createdAt,
    content: r.content,
    metadata: {},
  }));

  return analyzeMood(sources);
}

/**
 * 识别生活模式
 */
function identifyPatterns(records: Record[]): string[] {
  const patterns: string[] = [];

  // 检查是否有固定的记录时间
  const recordHours = records.map(r => new Date(r.createdAt).getHours());
  const morningRecords = recordHours.filter(h => h >= 6 && h < 12).length;
  const eveningRecords = recordHours.filter(h => h >= 18 && h < 24).length;

  if (morningRecords > records.length * 0.6) {
    patterns.push('习惯在早晨记录生活');
  } else if (eveningRecords > records.length * 0.6) {
    patterns.push('喜欢在晚上回顾和记录');
  }

  // 检查是否经常记录
  if (records.length >= 7) {
    patterns.push('坚持每日记录，养成了良好的习惯');
  } else if (records.length >= 3) {
    patterns.push('定期记录生活片段');
  }

  // 检查是否有位置信息
  const hasLocationCount = records.filter(r => r.location).length;
  if (hasLocationCount > records.length * 0.5) {
    patterns.push('注重记录地点信息，喜欢标记生活轨迹');
  }

  // 检查是否有多媒体
  const hasMediaCount = records.filter(r => r.hasImages || r.hasAudio).length;
  if (hasMediaCount > records.length * 0.5) {
    patterns.push('喜欢用图片和音频丰富记录');
  }

  return patterns;
}

