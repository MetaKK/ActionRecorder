'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  TrendingDown,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecords } from '@/lib/hooks/use-records';
import { processSSEStream } from '@/lib/ai/sse-parser';

// 复用分析页面的组件
import { CircularProgress } from './components/CircularProgress';

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

interface ScenarioVocabulary {
  category: string;
  words: string[];
  expressions: string[];
  usage: string;
}

interface CulturalNote {
  aspect: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
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
  scenarioVocabulary: ScenarioVocabulary[];
  culturalNotes: CulturalNote[];
  sentenceAnalysis: SentenceAnalysis[];
  performanceMetrics: PerformanceMetrics;
  overallCharacteristics: string;
  strengths: string[];
  weaknesses: string[];
  learningAdvice: LearningAdvice[];
}

interface AnalysisCache {
  id: string;
  sessionData: SessionData;
  analysis: DetailedAnalysis;
  createdAt: number;
  expiresAt: number;
}

// MetricCard 组件
interface MetricCardProps {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'from-blue-500 to-cyan-500',
  trend,
  subtitle 
}: MetricCardProps) {
  return (
    <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {trend === 'up' && (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <TrendingUp className="w-3 h-3" />
              </span>
            )}
            {trend === 'down' && (
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <TrendingDown className="w-3 h-3" />
              </span>
            )}
            {trend === 'stable' && (
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <div className="w-3 h-3 border-t-2 border-current"></div>
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;
  const { addRecord } = useRecords();
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  // 从缓存加载分析结果
  const loadFromCache = useCallback((id: string): AnalysisCache | null => {
    try {
      const cached = localStorage.getItem(`analysis_${id}`);
      if (!cached) return null;
      
      const cacheData: AnalysisCache = JSON.parse(cached);
      
      // 检查是否过期（24小时）
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(`analysis_${id}`);
        return null;
      }
      
      return cacheData;
    } catch (error) {
      console.error('Failed to load from cache:', error);
      return null;
    }
  }, []);

  // 保存到缓存
  const saveToCache = useCallback((id: string, sessionData: SessionData, analysis: DetailedAnalysis) => {
    try {
      const cacheData: AnalysisCache = {
        id,
        sessionData,
        analysis,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时
      };
      
      localStorage.setItem(`analysis_${id}`, JSON.stringify(cacheData));
      console.log(`[Analysis] Cached analysis for ID: ${id}`);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }, []);

  // 生成详细分析
  const generateAnalysis = useCallback(async () => {
    console.log('[Analysis] generateAnalysis called:', {
      sessionData: !!sessionData,
      apiKey: !!apiKey,
      isAnalyzing
    });
    
    if (!sessionData) {
      console.log('[Analysis] No session data, returning');
      return;
    }

    if (!apiKey) {
      console.log('[Analysis] No API key, setting error');
      setError('API Key 缺失。请先在练习页面配置您的 OpenAI API Key。');
      return;
    }

    if (isAnalyzing) {
      console.log('[Analysis] Already analyzing, returning');
      return; // 如果正在分析，直接返回
    }

    console.log('[Analysis] Starting analysis generation...');
    setIsAnalyzing(true);
    setError(null);

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

**特别要求：**
1. 针对"${sessionData.scene.title}"场景提供相关的高频词汇和表达
2. 提供该场景下的常用美式表达、俚语和习语
3. 建议该场景下的文化注意事项和社交礼仪
4. 推荐该场景下的进阶表达方式和专业术语

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
  "scenarioVocabulary": [
    {
      "category": "词汇分类（如：购物、餐厅、旅行等）",
      "words": ["相关词汇1", "相关词汇2", "相关词汇3"],
      "expressions": ["相关表达1", "相关表达2"],
      "usage": "使用说明和例句"
    }
  ],
  "culturalNotes": [
    {
      "aspect": "文化方面（如：社交礼仪、商务文化等）",
      "description": "具体说明",
      "importance": "high|medium|low"
    }
  ],
  "overallCharacteristics": "2-3句话分析学生的整体表现",
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["劣势1", "劣势2", "劣势3"],
  "learningAdvice": [
    {
      "category": "Grammar|Vocabulary|Fluency|Cultural|Scenario",
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
              content: '你是一位专业的英语教师。请提供详细、结构化的中文分析，使用有效的JSON格式。'
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
        throw new Error(`分析生成失败: ${response.status} ${errorText}`);
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
        throw new Error('分析响应解析失败: 未找到有效JSON');
      }

      console.log('[Analysis] Extracted JSON:', jsonMatch[0].substring(0, 200) + '...');
      
      const analysisData = JSON.parse(jsonMatch[0]);
      console.log('[Analysis] Parsed analysis data successfully');
      
      setAnalysis(analysisData);
      
      // 保存到缓存
      saveToCache(analysisId, sessionData, analysisData);

    } catch (error) {
      console.error('[Analysis] Generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`分析生成失败: ${errorMessage}\n\n请检查控制台获取详细信息。`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionData, apiKey, analysisId, saveToCache]);

  // 页面加载逻辑
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. 尝试从缓存加载
        const cached = loadFromCache(analysisId);
        if (cached) {
          console.log('[Analysis] Loading from cache:', analysisId);
          setSessionData(cached.sessionData);
          setAnalysis(cached.analysis);
          setIsLoading(false);
          return;
        }

        // 2. 尝试从 sessionStorage 加载当前会话
        const currentSession = localStorage.getItem('scene_practice_session');
        if (currentSession) {
          const sessionData = JSON.parse(currentSession);
          if (sessionData.id === analysisId) {
            console.log('[Analysis] Loading current session:', analysisId);
            setSessionData(sessionData);
            
            // 获取 API Key
            const key = sessionStorage.getItem('api_key_openai') || '';
            setApiKey(key);
            
            // 设置状态但不立即开始分析
            setIsLoading(false);
            // 让 useEffect 自动触发分析
            return;
          }
        }

        // 3. 如果都没有，显示错误
        setError('未找到分析结果。请先完成英语场景练习，然后查看分析。');
        
      } catch (error) {
        console.error('[Analysis] Initialization failed:', error);
        setError('页面加载失败，请重试。');
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [analysisId, loadFromCache]);

  // 自动生成分析
  useEffect(() => {
    console.log('[Analysis] Auto-generate effect triggered:', {
      sessionData: !!sessionData,
      apiKey: !!apiKey,
      analysis: !!analysis,
      isAnalyzing,
      isLoading
    });
    
    if (sessionData && apiKey && !analysis && !isAnalyzing && !isLoading) {
      console.log('[Analysis] Starting auto-generation...');
      generateAnalysis();
    }
  }, [sessionData, apiKey, analysis, isAnalyzing, isLoading, generateAnalysis]);

  // 转换为 Action List
  const handleConvertToActionList = async () => {
    if (!analysis || isConverting) return;

    setIsConverting(true);

    try {
      // 创建一个符合首页卡片样式的学习分析记录
      const analysisRecord = {
        type: 'english_analysis',
        title: sessionData?.scene.title || '英语场景练习',
        description: `完成了${sessionData?.currentTurn || 0}轮英语对话练习，${sessionData?.passedTest ? '成功通过' : '需要继续努力'}。AI教师为您提供了详细的语法分析、词汇建议和美式表达指导。`,
        score: sessionData?.totalScore || 0,
        passed: sessionData?.passedTest || false,
        turns: sessionData?.currentTurn || 0,
        analysisUrl: window.location.href,
        timestamp: Date.now(),
        // 添加分析摘要信息
        summary: {
          grammarAccuracy: analysis.performanceMetrics?.grammarAccuracy || 0,
          vocabularyDiversity: analysis.performanceMetrics?.vocabularyDiversity || 0,
          strengths: analysis.strengths?.slice(0, 2) || [],
          mainIssues: analysis.weaknesses?.slice(0, 2) || []
        }
      };

      // 保存为特殊格式的记录，首页可以识别并渲染为卡片
      await addRecord(JSON.stringify(analysisRecord));

      alert(`✅ 成功添加英语学习分析报告到您的行动清单！\n\n点击卡片可查看详细分析。`);
      
      // 跳转到主页查看
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Failed to convert to action list:', error);
      alert('保存到行动清单失败，请重试。');
    } finally {
      setIsConverting(false);
    }
  };

  // 分享分析结果
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '英语学习分析报告',
          text: `查看我的英语场景练习分析结果 - 总分: ${sessionData?.totalScore}/100`,
          url: window.location.href,
        });
      } else {
        // 降级到复制链接
        await navigator.clipboard.writeText(window.location.href);
        alert('分析链接已复制到剪贴板！');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // 降级到复制链接
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('分析链接已复制到剪贴板！');
      } catch (copyError) {
        alert('分享失败，请手动复制链接。');
      }
    }
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            加载分析结果...
          </p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/ai/scene-practice')}
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium"
            >
              开始新的练习
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-11 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium"
            >
              重新加载
            </Button>
          </div>
        </div>
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">分享</span>
            </Button>
            
            <div className="px-2 sm:px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-medium">
              分数: {sessionData?.totalScore}/100
            </div>
            {sessionData?.passedTest && (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* 这里复用原来的分析内容渲染逻辑 */}
        {/* 为了简化，这里先显示基本信息 */}
        {sessionData && (
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
                <span className="text-gray-500 dark:text-gray-400">目标</span>
                <span className="font-medium text-gray-900 dark:text-white">{sessionData.scene.goal}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">级别</span>
                <span className="font-medium text-gray-900 dark:text-white">{sessionData.scene.difficulty}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 分析加载中 */}
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
              正在分析您的表现...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI 教师正在审查您的对话并准备详细反馈
            </p>
          </motion.div>
        )}


        {/* 手动触发分析按钮 - 当有数据但没有分析时显示 */}
        {sessionData && !analysis && !isAnalyzing && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 text-center"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              准备开始分析
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              点击下方按钮开始生成您的英语学习分析报告
            </p>
            <Button
              onClick={generateAnalysis}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-6 py-3"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始分析
            </Button>
          </motion.div>
        )}

        {/* 分析结果 - 完整版本 */}
        {analysis && (
          <>
            {/* Performance Overview */}
            {analysis.performanceMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                      value={sessionData?.totalScore || 0} 
                      size={80}
                      strokeWidth={8}
                      color="from-green-500 to-emerald-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">总分</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-[80px] h-[80px] flex flex-col items-center justify-center">
                      <Award className={`w-8 h-8 sm:w-10 sm:h-10 mb-1 ${
                        sessionData?.passedTest ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                        {sessionData?.passedTest ? '通过' : '未通过'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 精简指标卡片 - 一行显示 */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-gray-200/40 dark:border-gray-700/40">
                  {/* 平均字数 */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">字数</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round(analysis.performanceMetrics.averageWordCount)}
                      </div>
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>

                  {/* 响应速度 */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">速度</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {analysis.performanceMetrics.responseSpeed === 'appropriate' ? '合适' :
                         analysis.performanceMetrics.responseSpeed === 'too fast' ? '过快' : '过慢'}
                      </div>
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>

                  {/* 信心水平 */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">信心</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {analysis.performanceMetrics.confidenceLevel === 'confident' ? '自信' :
                         analysis.performanceMetrics.confidenceLevel === 'moderate' ? '一般' : '犹豫'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Overall Assessment */}
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
                          transition={{ delay: 0.1 * idx }}
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                        >
                          <span className="text-green-500 mt-0.5">•</span>
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
                          transition={{ delay: 0.1 * idx }}
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                        >
                          <span className="text-amber-500 mt-0.5">•</span>
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
                transition={{ delay: 0.2 }}
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                    >
                      {/* Original Sentence */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                            第 {sentAnalysis.turn} 轮
                          </span>
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
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
            {analysis.grammarErrors && analysis.grammarErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">原句：</span>
                        <p className="text-gray-900 dark:text-white font-medium">&quot;{error.sentence}&quot;</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">问题：</span>
                        <p className="text-gray-700 dark:text-gray-300">{error.error}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">修正：</span>
                        <p className="text-gray-900 dark:text-white font-medium">&quot;{error.correction}&quot;</p>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">解释：</span>
                        <p className="text-gray-700 dark:text-gray-300">{error.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Vocabulary Issues */}
            {analysis.vocabularyIssues && analysis.vocabularyIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                      <div className="mb-2">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">问题词汇：</span>
                        <span className="text-gray-900 dark:text-white font-medium">&quot;{issue.word}&quot;</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">问题：</span>
                        <p className="text-gray-700 dark:text-gray-300">{issue.issue}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">更好选择：</span>
                        <span className="text-gray-900 dark:text-white font-medium">&quot;{issue.betterChoice}&quot;</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">示例：</span>
                        <p className="text-gray-700 dark:text-gray-300">&quot;{issue.example}&quot;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* American Expressions */}
            {analysis.americanExpressions && analysis.americanExpressions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
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
                      <div className="mb-2">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">你说的：</span>
                        <span className="text-gray-900 dark:text-white font-medium">&quot;{expr.yourExpression}&quot;</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">地道表达：</span>
                        <span className="text-gray-900 dark:text-white font-medium">&quot;{expr.nativeExpression}&quot;</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-400">使用场景：</span>
                        <p className="text-gray-700 dark:text-gray-300">{expr.context}</p>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">难度：</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          expr.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          expr.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {expr.level === 'beginner' ? '初级' : expr.level === 'intermediate' ? '中级' : '高级'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scenario Vocabulary */}
            {analysis.scenarioVocabulary && analysis.scenarioVocabulary.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    场景高频词汇
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {analysis.scenarioVocabulary.map((vocab, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                      <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 uppercase tracking-wide">
                        {vocab.category}
                      </h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">核心词汇</h5>
                          <div className="flex flex-wrap gap-2">
                            {vocab.words.map((word, wordIdx) => (
                              <span key={wordIdx} className="px-2 py-1 bg-purple-100 dark:bg-purple-800/30 text-purple-800 dark:text-purple-300 rounded-md text-sm font-medium">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">常用表达</h5>
                          <div className="flex flex-wrap gap-2">
                            {vocab.expressions.map((expr, exprIdx) => (
                              <span key={exprIdx} className="px-2 py-1 bg-pink-100 dark:bg-pink-800/30 text-pink-800 dark:text-pink-300 rounded-md text-sm font-medium">
                                {expr}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {vocab.usage && (
                        <div className="mt-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">使用说明：</span>{vocab.usage}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Cultural Notes */}
            {analysis.culturalNotes && analysis.culturalNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    文化注意事项
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {analysis.culturalNotes.map((note, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${
                      note.importance === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : note.importance === 'medium'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          note.importance === 'high'
                            ? 'bg-red-100 dark:bg-red-800/30'
                            : note.importance === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-800/30'
                            : 'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          <span className={`text-xs font-bold ${
                            note.importance === 'high'
                              ? 'text-red-600 dark:text-red-400'
                              : note.importance === 'medium'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {note.importance === 'high' ? '!' : note.importance === 'medium' ? '•' : '○'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                            {note.aspect}
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {note.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Learning Advice */}
            {analysis.learningAdvice && analysis.learningAdvice.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
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
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          advice.priority === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : advice.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {advice.priority === 'high' ? '高优先级' : advice.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {advice.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {advice.advice}
                      </p>
                      
                      <div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2 block">具体行动：</span>
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
              transition={{ delay: 0.7 }}
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
