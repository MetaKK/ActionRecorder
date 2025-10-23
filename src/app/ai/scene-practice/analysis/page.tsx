'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Lightbulb,
  TrendingUp,
  ListChecks,
  Loader2,
  Sparkles,
  Award,
  BarChart3,
  MessageSquare,
  Zap,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecords } from '@/lib/hooks/use-records';
import { processSSEStream } from '@/lib/ai/sse-parser';

// Apple 风格的圆环进度图
function CircularProgress({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 12,
  color = 'from-blue-500 to-cyan-500',
  label,
  showValue = true
}: { 
  value: number; 
  max?: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;
  
  // Unique gradient ID to avoid conflicts
  const gradientId = `gradient-${label || Math.random().toString(36).substr(2, 9)}`;
  
  // Extract colors from Tailwind class string
  const getGradientColors = (colorClass: string) => {
    if (colorClass.includes('red')) return { start: '#ef4444', end: '#f97316' };
    if (colorClass.includes('blue')) return { start: '#3b82f6', end: '#06b6d4' };
    if (colorClass.includes('green')) return { start: '#10b981', end: '#059669' };
    if (colorClass.includes('purple')) return { start: '#a855f7', end: '#ec4899' };
    return { start: '#3b82f6', end: '#06b6d4' }; // default
  };
  
  const colors = getGradientColors(color);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(value)}
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// Apple 风格的统计卡片
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'from-blue-500 to-cyan-500',
  trend,
  subtitle
}: {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
      )}
    </motion.div>
  );
}

// 分数条
function ScoreBar({ 
  label, 
  score, 
  max = 100,
  color = 'from-blue-500 to-cyan-500'
}: {
  label: string;
  score: number;
  max?: number;
  color?: string;
}) {
  const percentage = (score / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-900 dark:text-white font-bold">{Math.round(score)}</span>
      </div>
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

// 类型定义
interface Message {
  role: 'user' | 'assistant';
  content: string;
  score?: {
    grammar: number;
    vocabulary: number;
    relevance: number;
    fluency: number;
  };
  feedback?: string;
}

interface Scene {
  title: string;
  description: string;
  context: string;
  goal: string;
  difficulty: string;
}

interface SessionData {
  id: string;
  scene: Scene;
  messages: Message[];
  totalScore: number;
  currentTurn: number;
  passedTest: boolean;
  timestamp: number;
}

interface GrammarError {
  sentence: string;
  error: string;
  correction: string;
  explanation: string;
}

interface VocabularyIssue {
  word: string;
  issue: string;
  betterChoice: string;
  example: string;
}

interface AmericanExpression {
  yourExpression: string;
  nativeExpression: string;
  context: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface LearningAdvice {
  category: string;
  priority: 'high' | 'medium' | 'low';
  advice: string;
  actionItems: string[];
}

interface SentenceAnalysis {
  turn: number;
  sentence: string;
  grammarScore: number;
  vocabularyScore: number;
  relevanceScore: number;
  fluencyScore: number;
  strengths: string[];
  improvements: string[];
  rewriteSuggestion: string;
}

interface PerformanceMetrics {
  averageWordCount: number;
  vocabularyDiversity: number;
  grammarAccuracy: number;
  responseSpeed: string;
  confidenceLevel: string;
  progressTrend: 'improving' | 'stable' | 'declining';
}

interface DetailedAnalysis {
  grammarErrors: GrammarError[];
  vocabularyIssues: VocabularyIssue[];
  americanExpressions: AmericanExpression[];
  sentenceAnalysis: SentenceAnalysis[];
  performanceMetrics: PerformanceMetrics;
  overallCharacteristics: string;
  strengths: string[];
  weaknesses: string[];
  learningAdvice: LearningAdvice[];
}

export default function AnalysisPage() {
  const router = useRouter();
  const { addRecord } = useRecords();
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // 加载会话数据
  useEffect(() => {
    const savedSession = localStorage.getItem('scene_practice_session');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setSessionData(data);
    } else {
      // 没有会话数据，返回练习页面
      router.push('/ai/scene-practice');
    }

    // 获取 API Key
    const key = sessionStorage.getItem('api_key_openai') || '';
    setApiKey(key);
  }, [router]);

  // 生成详细分析
  const generateAnalysis = useCallback(async () => {
    if (!sessionData || isAnalyzing) return;

    if (!apiKey) {
      alert('API Key is missing. Please configure your OpenAI API key in the practice page.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // 构建用户对话历史
      const userMessages = sessionData.messages
        .filter(m => m.role === 'user')
        .map((m, idx) => `Turn ${idx + 1}: "${m.content}"`);

       const analysisPrompt = `你是一位专业的英语教师，专注于美式英语教学。请分析这位学生的对话练习，提供详细、可操作的反馈。

**场景：** ${sessionData.scene.title}
**目标：** ${sessionData.scene.goal}
**学生水平：** A2-B1（新概念英语2级别）

**学生的回答：**
${userMessages.join('\n')}

**表现总结：**
- 总分：${sessionData.totalScore}/100
- 完成轮次：${sessionData.currentTurn}
- 测试结果：${sessionData.passedTest ? '通过' : '未通过'}

请提供全面、详细的分析，使用以下JSON格式：

{
  "sentenceAnalysis": [
    {
      "turn": 1,
      "sentence": "学生的原句",
      "grammarScore": 85,
      "vocabularyScore": 75,
      "relevanceScore": 90,
      "fluencyScore": 80,
      "strengths": ["具体优势1", "具体优势2"],
      "improvements": ["具体改进点1", "具体改进点2"],
      "rewriteSuggestion": "更好的表达方式"
    }
  ],
  "performanceMetrics": {
    "averageWordCount": 12.5,
    "vocabularyDiversity": 75,
    "grammarAccuracy": 82,
    "responseSpeed": "appropriate|too fast|too slow",
    "confidenceLevel": "confident|moderate|hesitant",
    "progressTrend": "improving|stable|declining"
  },
  "grammarErrors": [
    {
      "sentence": "学生的原句",
      "error": "具体的语法问题",
      "correction": "修正版本",
      "explanation": "语法规则解释"
    }
  ],
  "vocabularyIssues": [
    {
      "word": "问题词汇",
      "issue": "为什么有问题",
      "betterChoice": "更好的选择",
      "example": "使用示例"
    }
  ],
  "americanExpressions": [
    {
      "yourExpression": "学生说的",
      "nativeExpression": "地道美式表达",
      "context": "使用场景",
      "level": "beginner|intermediate|advanced"
    }
  ],
  "overallCharacteristics": "2-3句话分析学生的整体表现",
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["劣势1", "劣势2", "劣势3"],
  "learningAdvice": [
    {
      "category": "Grammar|Vocabulary|Fluency|Cultural",
      "priority": "high|medium|low",
      "advice": "具体建议",
      "actionItems": ["行动1", "行动2", "行动3"]
    }
  ]
}

**重要指导原则：**

**逐句分析要求：**
- 分析每一个用户回答
- 为每句话提供具体、建设性的反馈
- 分数要反映真实表现（不要太宽松）
- 优势：做得好的地方（2-3点）
- 改进：具体的改进方向（2-3点）
- 改写：展示地道表达方式

**性能指标计算：**
- averageWordCount：所有回答的平均字数
- vocabularyDiversity：独特词汇占比（0-100）
- grammarAccuracy：语法正确句子占比（0-100）
- responseSpeed：节奏合适/过快/过慢
- confidenceLevel：自信/一般/犹豫
- progressTrend：进步中/稳定/下降

**优势劣势：**
- 列出2-4个具体优势（不要泛泛而谈）
- 列出2-4个具体劣势（诚实但不苛刻）

**学习建议：**
- HIGH：影响交流的关键问题
- MEDIUM：重要但不紧急的改进
- LOW：锦上添花的优化
- 每个行动项要具体、可衡量、15-30分钟可完成

**总体原则：**
1. 鼓励但诚实 - 聚焦成长
2. 不要过载 - 优先3-5个最重要问题
3. 使用简单清晰的中文解释
4. 美式表达选择日常常用短语
5. 先肯定优点再建议改进
6. 反馈要具体可执行

**重要：所有内容都用中文，除了学生的原始英文句子**

只返回JSON对象，不要markdown格式。`;

      console.log('[Analysis] Sending request to AI...');
      
      const response = await fetch('/ai/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert English language teacher. Provide detailed, structured analysis in valid JSON format.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          model: 'gpt-4o-mini',
        }),
      });

      console.log('[Analysis] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Analysis] API error:', errorText);
        throw new Error(`Failed to generate analysis: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          processSSEStream(
            value,
            (content: string) => {
              fullText += content;
            },
            () => {}
          );
        }
      }

      // 解析 JSON 响应
      console.log('[Analysis] Raw response:', fullText.substring(0, 200) + '...');
      
      let cleanText = fullText.trim();
      cleanText = cleanText.replace(/^```json\s*/g, '').replace(/^```\s*/g, '');
      cleanText = cleanText.replace(/\s*```$/g, '');

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Analysis] No JSON found in response:', cleanText);
        throw new Error('Failed to parse analysis response: No valid JSON found');
      }

      console.log('[Analysis] Extracted JSON:', jsonMatch[0].substring(0, 200) + '...');
      
      const analysisData = JSON.parse(jsonMatch[0]);
      console.log('[Analysis] Parsed analysis data successfully');
      setAnalysis(analysisData);

    } catch (error) {
      console.error('[Analysis] Generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate analysis: ${errorMessage}\n\nPlease check console for details.`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionData, apiKey, isAnalyzing]);

  // 自动生成分析
  useEffect(() => {
    if (sessionData && apiKey && !analysis && !isAnalyzing) {
      generateAnalysis();
    }
  }, [sessionData, apiKey, analysis, isAnalyzing, generateAnalysis]);

  // 转换为 Action List
  const handleConvertToActionList = async () => {
    if (!analysis || isConverting) return;

    setIsConverting(true);

    try {
      // 收集所有高优先级和中优先级的学习建议
      const actionItems: string[] = [];
      
      analysis.learningAdvice
        .filter(advice => advice.priority === 'high' || advice.priority === 'medium')
        .forEach(advice => {
          advice.actionItems.forEach(item => {
            actionItems.push(`${advice.category}: ${item}`);
          });
        });

      // 添加语法错误改进点（最多3个）
      analysis.grammarErrors.slice(0, 3).forEach(error => {
        actionItems.push(`Grammar: Practice - ${error.explanation}`);
      });

      // 添加词汇改进点（最多3个）
      analysis.vocabularyIssues.slice(0, 3).forEach(issue => {
        actionItems.push(`Vocabulary: Use "${issue.betterChoice}" instead of "${issue.word}"`);
      });

      // 为每个 action item 创建一个 record
      for (const item of actionItems) {
        await addRecord(item);
      }

      alert(`✅ Successfully added ${actionItems.length} learning tasks to your action list!`);
      
      // 跳转到主页查看
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Failed to convert to action list:', error);
      alert('Failed to save to action list. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  // 加载中状态
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/ai/scene-practice')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
             <span className="font-medium hidden sm:inline">返回练习</span>
          </button>

          <div className="flex items-center gap-3">
             <div className="px-2 sm:px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-medium">
               分数: {sessionData.totalScore}/100
             </div>
            {sessionData.passedTest && (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Scenario Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {sessionData.scene.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {sessionData.scene.description}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Goal:</span>
              <span className="font-medium text-gray-900 dark:text-white">{sessionData.scene.goal}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Level:</span>
              <span className="font-medium text-gray-900 dark:text-white">{sessionData.scene.difficulty}</span>
            </div>
          </div>
        </motion.div>

        {/* Analysis Loading */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Analyzing Your Performance...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI teacher is reviewing your conversation and preparing detailed feedback
            </p>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Performance Metrics - Apple Health Style */}
            {analysis.performanceMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  表现总览
                </h3>
                </div>

                {/* Circular Progress Rings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  <div className="flex flex-col items-center">
                    <CircularProgress 
                      value={analysis.performanceMetrics.grammarAccuracy} 
                      size={80}
                      strokeWidth={8}
                      color="from-red-500 to-orange-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">语法</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress 
                      value={analysis.performanceMetrics.vocabularyDiversity} 
                      size={80}
                      strokeWidth={8}
                      color="from-blue-500 to-cyan-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">词汇</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress 
                      value={sessionData.totalScore} 
                      size={80}
                      strokeWidth={8}
                      color="from-green-500 to-emerald-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">总分</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-[80px] h-[80px] flex flex-col items-center justify-center">
                      <Award className={`w-8 h-8 sm:w-10 sm:h-10 mb-1 ${
                        sessionData.passedTest ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                        {sessionData.passedTest ? '通过' : '未通过'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <MetricCard
                    icon={MessageSquare}
                    label="平均字数/回复"
                    value={Math.round(analysis.performanceMetrics.averageWordCount)}
                    color="from-blue-500 to-indigo-500"
                    subtitle={analysis.performanceMetrics.averageWordCount > 10 ? '长度良好' : '尝试更长'}
                  />
                  <MetricCard
                    icon={Zap}
                    label="响应速度"
                    value={analysis.performanceMetrics.responseSpeed === 'appropriate' ? '合适' :
                           analysis.performanceMetrics.responseSpeed === 'too fast' ? '过快' : '过慢'}
                    color="from-amber-500 to-orange-500"
                    subtitle="节奏"
                  />
                  <MetricCard
                    icon={TrendingUp}
                    label="信心水平"
                    value={analysis.performanceMetrics.confidenceLevel === 'confident' ? '自信' :
                           analysis.performanceMetrics.confidenceLevel === 'moderate' ? '一般' : '犹豫'}
                    color="from-purple-500 to-pink-500"
                    trend={analysis.performanceMetrics.progressTrend === 'improving' ? 'up' : 
                           analysis.performanceMetrics.progressTrend === 'declining' ? 'down' : 'stable'}
                    subtitle={analysis.performanceMetrics.progressTrend === 'improving' ? '进步中' :
                             analysis.performanceMetrics.progressTrend === 'stable' ? '稳定' : '下降'}
                  />
                </div>
              </motion.div>
            )}

            {/* Overall Summary with Strengths & Weaknesses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  整体评估
                </h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {analysis.overallCharacteristics}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div className="space-y-3">
                     <h4 className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4" />
                       你的优势
                     </h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                        >
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <div className="space-y-3">
                     <h4 className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" />
                       改进领域
                     </h4>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                        >
                          <span className="text-amber-500 mt-0.5">→</span>
                          <span>{weakness}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sentence-by-Sentence Analysis */}
            {analysis.sentenceAnalysis && analysis.sentenceAnalysis.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                     逐句分析
                   </h3>
                </div>
                
                <div className="space-y-4">
                  {analysis.sentenceAnalysis.map((sentAnalysis, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            Turn {sentAnalysis.turn}
                          </span>
                          <div className="flex items-center gap-2">
                            {sentAnalysis.grammarScore + sentAnalysis.vocabularyScore + sentAnalysis.relevanceScore + sentAnalysis.fluencyScore > 320 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          &quot;{sentAnalysis.sentence}&quot;
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="p-4 space-y-3">
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                           <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                               {Math.round(sentAnalysis.grammarScore)}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400">语法</div>
                           </div>
                           <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                               {Math.round(sentAnalysis.vocabularyScore)}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400">词汇</div>
                           </div>
                           <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                               {Math.round(sentAnalysis.relevanceScore)}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400">相关性</div>
                           </div>
                           <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                               {Math.round(sentAnalysis.fluencyScore)}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400">流畅度</div>
                           </div>
                         </div>

                        {/* Strengths */}
                        {sentAnalysis.strengths.length > 0 && (
                          <div className="mb-3">
                             <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2 block">
                               ✓ 做得好的地方：
                             </span>
                            <ul className="space-y-1">
                              {sentAnalysis.strengths.map((strength, sIdx) => (
                                <li key={sIdx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-green-500">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Improvements */}
                        {sentAnalysis.improvements.length > 0 && (
                          <div className="mb-3">
                             <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2 block">
                               → 如何改进：
                             </span>
                            <ul className="space-y-1">
                              {sentAnalysis.improvements.map((improvement, iIdx) => (
                                <li key={iIdx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-amber-500">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Better Version */}
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                           <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1 block">
                             💡 建议改写：
                           </span>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            &quot;{sentAnalysis.rewriteSuggestion}&quot;
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Grammar Errors */}
            {analysis.grammarErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                     语法分析
                   </h3>
                </div>
                
                <div className="space-y-4">
                  {analysis.grammarErrors.map((error, idx) => (
                    <div key={idx} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">Your sentence:</span>
                        <p className="text-gray-900 dark:text-white mt-1">&quot;{error.sentence}&quot;</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Correction:</span>
                        <p className="text-gray-900 dark:text-white mt-1">&quot;{error.correction}&quot;</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Issue:</span>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{error.error}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">💡 Explanation:</span>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{error.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Vocabulary Issues */}
            {analysis.vocabularyIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                     词汇提升
                   </h3>
                </div>
                
                <div className="space-y-4">
                  {analysis.vocabularyIssues.map((issue, idx) => (
                    <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm font-medium">
                              {issue.word}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm font-medium">
                              {issue.betterChoice}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{issue.issue}</p>
                          <div className="p-2 bg-white/50 dark:bg-gray-700/50 rounded italic text-sm text-gray-600 dark:text-gray-400">
                            &quot;{issue.example}&quot;
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* American Expressions */}
            {analysis.americanExpressions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                     地道美式表达 🇺🇸
                   </h3>
                </div>
                
                <div className="space-y-4">
                  {analysis.americanExpressions.map((expr, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="mb-3">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          Level: {expr.level}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">You said:</span>
                        <p className="text-gray-900 dark:text-white mt-1">&quot;{expr.yourExpression}&quot;</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">🎯 Native way:</span>
                        <p className="text-blue-900 dark:text-blue-100 font-medium mt-1">&quot;{expr.nativeExpression}&quot;</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">When to use:</span>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{expr.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Overall Characteristics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Overall Performance
                </h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.overallCharacteristics}
              </p>
            </motion.div>

            {/* Learning Advice */}
            {analysis.learningAdvice.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-white" />
                  </div>
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                     学习路线图
                   </h3>
                </div>
                
                <div className="space-y-4">
                  {analysis.learningAdvice
                    .sort((a, b) => {
                      const priorityOrder = { high: 0, medium: 1, low: 2 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map((advice, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${
                      advice.priority === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : advice.priority === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          advice.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : advice.priority === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {advice.priority} Priority
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {advice.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 dark:text-white font-medium mb-3">
                        {advice.advice}
                      </p>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          ✓ Action Steps:
                        </span>
                        <ul className="space-y-1 ml-4">
                          {advice.actionItems.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
               className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Button
                onClick={handleConvertToActionList}
                disabled={isConverting}
                 className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium text-sm sm:text-base"
              >
                {isConverting ? (
                  <>
                     <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                     转换中...
                  </>
                ) : (
                  <>
                     <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                     保存到行动清单
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => router.push('/ai/scene-practice')}
                 className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-sm sm:text-base"
              >
                 再试一个场景
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

