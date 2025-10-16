/**
 * AI响应增强器 - 基于Apple和Notion设计原则
 * 提供更好的用户体验和响应质量
 */

export interface EnhancedResponse {
  content: string;
  suggestions?: string[];
  actions?: ResponseAction[];
  metadata?: ResponseMetadata;
}

export interface ResponseAction {
  id: string;
  label: string;
  type: "button" | "link" | "command";
  action: string;
  icon?: string;
}

export interface ResponseMetadata {
  category: "analysis" | "suggestion" | "encouragement" | "question" | "summary";
  confidence: number;
  keywords: string[];
  relatedTopics: string[];
}

/**
 * 增强AI响应，添加交互元素和元数据
 */
export function enhanceAIResponse(content: string): EnhancedResponse {
  const enhanced: EnhancedResponse = {
    content,
    suggestions: [],
    actions: [],
    metadata: {
      category: "suggestion",
      confidence: 0.8,
      keywords: [],
      relatedTopics: []
    }
  };

  // 根据内容类型添加建议
  if (content.includes("记录") || content.includes("日记")) {
    enhanced.suggestions = [
      "记录今天的感受",
      "分享一个重要时刻",
      "写下今天的收获"
    ];
    enhanced.actions = [
      {
        id: "create-record",
        label: "创建记录",
        type: "button",
        action: "create-record",
        icon: "📝"
      }
    ];
  }

  if (content.includes("分析") || content.includes("模式")) {
    enhanced.suggestions = [
      "查看生活模式",
      "分析情绪趋势",
      "回顾目标进展"
    ];
    enhanced.actions = [
      {
        id: "view-analytics",
        label: "查看分析",
        type: "button",
        action: "view-analytics",
        icon: "📊"
      }
    ];
  }

  if (content.includes("学习") || content.includes("成长")) {
    enhanced.suggestions = [
      "制定学习计划",
      "记录学习心得",
      "分享学习资源"
    ];
    enhanced.actions = [
      {
        id: "learning-plan",
        label: "学习计划",
        type: "button",
        action: "learning-plan",
        icon: "🎯"
      }
    ];
  }

  return enhanced;
}

/**
 * 生成智能建议
 */
export function generateSmartSuggestions(context: string): string[] {
  const suggestions: string[] = [];

  if (context.includes("工作") || context.includes("职业")) {
    suggestions.push("💼 记录今天的工作成就");
    suggestions.push("📈 分析工作效率模式");
    suggestions.push("🎯 制定职业发展目标");
  }

  if (context.includes("健康") || context.includes("运动")) {
    suggestions.push("🏃 记录今天的运动情况");
    suggestions.push("🥗 分享健康饮食心得");
    suggestions.push("😴 分析睡眠质量");
  }

  if (context.includes("学习") || context.includes("知识")) {
    suggestions.push("📚 记录今天学到的知识");
    suggestions.push("💡 分享学习方法和技巧");
    suggestions.push("🎓 制定学习目标");
  }

  if (context.includes("情感") || context.includes("心情")) {
    suggestions.push("😊 记录今天的心情变化");
    suggestions.push("🤗 分享让你开心的事情");
    suggestions.push("💭 写下内心的想法");
  }

  return suggestions;
}

/**
 * 格式化响应内容
 */
export function formatResponseContent(content: string): string {
  // 添加适当的换行和结构
  let formatted = content
    .replace(/\n\n/g, '\n\n')
    .replace(/(\d+\.)/g, '\n$1') // 数字列表
    .replace(/(•|▪|▫)/g, '\n$1') // 项目符号
    .trim();

  // 确保段落之间有适当间距
  formatted = formatted.replace(/\n\n\n+/g, '\n\n');

  return formatted;
}

/**
 * 检测响应类型
 */
export function detectResponseType(content: string): ResponseMetadata['category'] {
  if (content.includes("分析") || content.includes("模式") || content.includes("趋势")) {
    return "analysis";
  }
  
  if (content.includes("建议") || content.includes("推荐") || content.includes("可以")) {
    return "suggestion";
  }
  
  if (content.includes("鼓励") || content.includes("加油") || content.includes("很棒")) {
    return "encouragement";
  }
  
  if (content.includes("?") || content.includes("？") || content.includes("吗")) {
    return "question";
  }
  
  if (content.includes("总结") || content.includes("回顾") || content.includes("概括")) {
    return "summary";
  }
  
  return "suggestion";
}
