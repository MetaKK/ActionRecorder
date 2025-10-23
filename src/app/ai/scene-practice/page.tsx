"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, ArrowLeft, Trophy, Target, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecords } from "@/lib/hooks/use-records";
import { Record } from "@/lib/types";
import { AIInputMinimal } from "@/components/ai/ai-input-minimal";
import { processSSEStream } from "@/lib/ai/sse-parser";
import { motion, AnimatePresence } from "framer-motion";

// 评分维度
interface ScoreDimensions {
  communication: number;  // 交际效果 (30%)
  accuracy: number;      // 语言准确性 (25%)
  scenario: number;      // 场景掌握 (25%)
  fluency: number;       // 对话流畅度 (20%)
}

// 对话消息
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  score?: ScoreDimensions;
  feedback?: string;
}

// 场景信息
interface SceneInfo {
  title: string;
  description: string;
  context: string;
  goal: string;
  difficulty: "A2" | "B1";
}

const MAX_TURNS = 10;
const PASS_SCORE = 80;
const MIN_TURNS = 5; // 至少要对话5轮才能通过

// 根据场景生成自然的开场白
function getSceneGreeting(scene: SceneInfo): string {
  const greetings = {
    shop: "Hello! Welcome! What can I help you find today?",
    restaurant: "Good evening! Welcome to our restaurant. Have you made a reservation?",
    coffee: "Hi there! What can I get started for you today?",
    hotel: "Good afternoon! Welcome to our hotel. How may I assist you?",
    airport: "Hello! Where are you traveling to today?",
    doctor: "Hello, please come in. What brings you here today?",
    bank: "Good morning! How can I help you today?",
    default: "Hello! How can I help you today?"
  };
  
  const context = scene.context.toLowerCase();
  if (context.includes('store') || context.includes('shop') || context.includes('market')) {
    return greetings.shop;
  } else if (context.includes('restaurant') || context.includes('café') || context.includes('cafe')) {
    return greetings.restaurant;
  } else if (context.includes('coffee') || context.includes('starbucks')) {
    return greetings.coffee;
  } else if (context.includes('hotel')) {
    return greetings.hotel;
  } else if (context.includes('airport')) {
    return greetings.airport;
  } else if (context.includes('doctor') || context.includes('hospital') || context.includes('clinic')) {
    return greetings.doctor;
  } else if (context.includes('bank')) {
    return greetings.bank;
  }
  
  return greetings.default;
}

export default function ScenePracticePage() {
  const router = useRouter();
  const { records } = useRecords();
  
  const [scene, setScene] = useState<SceneInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentTurn, setCurrentTurn] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scoreChange, setScoreChange] = useState<number | null>(null); // 用于显示分数变化动画
  const [turnScores, setTurnScores] = useState<number[]>([]); // 存储每轮的分数
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(true); // 默认显示输入界面
  const [isInitialized, setIsInitialized] = useState(false); // 新增：标记是否已初始化
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 动态评分调整函数 - 针对口语练习优化
  const calculateScoreAdjustment = (currentScore: number, historicalAverage: number, variance: number): number => {
    const scoreDiff = currentScore - historicalAverage;
    
    // 口语练习更宽松的调整策略
    if (historicalAverage >= 75) {
      return Math.min(0, scoreDiff * 0.05); // 轻微调整，避免过于严格
    }
    
    // 低水平用户给予更多鼓励
    if (historicalAverage <= 50) {
      return Math.max(0, scoreDiff * 0.15); // 更多鼓励
    }
    
    // 中等水平用户保持稳定
    if (Math.abs(scoreDiff) > 25) {
      return scoreDiff * 0.08; // 更温和的调整
    }
    
    return 0; // 无需调整
  };
  
  // 添加调试日志
  console.log('[Scene Practice] Render state:', {
    showApiKeyInput,
    hasApiKey: !!apiKey,
    hasScene: !!scene,
    isGeneratingScene,
    isInitialized
  });

  // 检查 API Key
  useEffect(() => {
    console.log('[Scene Practice] Component mounted, checking API key...');
    
    // 注意：process.env 在客户端组件中不可用
    // 只检查 sessionStorage
    const savedKey = sessionStorage.getItem('api_key_openai');
    console.log('[Scene Practice] Saved API key exists:', !!savedKey);
    
    if (savedKey) {
      console.log('[Scene Practice] Using saved API key');
      setApiKey(savedKey);
      setShowApiKeyInput(false);
    } else {
      console.log('[Scene Practice] No API key found, showing input form');
      setShowApiKeyInput(true);
    }
    
    setIsInitialized(true);
  }, []);

  // 自动滚动
  const scrollToBottom = useCallback((immediate = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: immediate ? 'auto' : 'smooth'
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAIMessage, scrollToBottom]);

  // 生成场景
  const generateScene = useCallback(async () => {
    if (isGeneratingScene) return; // 防止重复调用
    
    setIsGeneratingScene(true);
    try {
      // 获取今天的记录
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecords = records.filter(r => {
        const recordDate = new Date(r.createdAt);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      // 构建场景生成 prompt
      const recordsSummary = todayRecords.length > 0
        ? todayRecords.map(r => r.content).join('; ')
        : 'You are helping an English learner. Generate an interesting daily life scenario.';

      const scenePrompt = `Based on these daily activities: "${recordsSummary}"

Generate an interesting English conversation scenario suitable for A2-B1 level learners (New Concept English 2 level).

Requirements:
- Create a realistic, engaging scenario related to the activities (if provided)
- If no activities provided, create a common daily life scenario (e.g., ordering food, shopping, meeting friends)
- Include cultural elements or interesting contexts
- Keep it fun, practical, and educational
- Use simple, natural English expressions
- Avoid sensitive or harmful content

Return ONLY a valid JSON object (no markdown code blocks, no extra text) with this exact structure:
{
  "title": "Short scenario title",
  "description": "Brief description in English",
  "context": "Detailed scenario context and background",
  "goal": "What the learner should accomplish in this conversation",
  "difficulty": "A2"
}

Example output:
{"title":"Coffee Shop Order","description":"Order a customized coffee at Starbucks","context":"You are at Starbucks. The barista is friendly and ready to help. You want to order a coffee drink with specific preferences.","goal":"Successfully order a customized coffee drink using natural English expressions","difficulty":"A2"}`;

      const response = await fetch('/ai/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: scenePrompt }
          ],
          model: 'gpt-4o-mini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scene');
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

      // 解析 JSON
      console.log('[Scene Practice] Raw AI response:', fullText);
      
      let cleanText = fullText.trim();
      // 移除可能的 markdown 代码块标记
      cleanText = cleanText.replace(/^```json\s*/g, '').replace(/^```\s*/g, '');
      cleanText = cleanText.replace(/\s*```$/g, '');
      cleanText = cleanText.trim();
      
      console.log('[Scene Practice] Cleaned text:', cleanText);
      
      // 尝试找到 JSON 对象
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      const sceneData = JSON.parse(cleanText);
      console.log('[Scene Practice] Parsed scene data:', sceneData);
      
      // 初始化对话 - AI 开场白（更自然的对话开场）
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Welcome to today's scenario: **${sceneData.title}**\n\n${sceneData.context}\n\n**Your Goal**: ${sceneData.goal}\n\nLet's start! Remember, speak only in English. You have ${MAX_TURNS} turns to reach ${PASS_SCORE} points. Good luck! 🎯`,
        timestamp: new Date(),
      };
      
      // AI 的第一句对话（模拟场景开场）
      const aiGreeting: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSceneGreeting(sceneData),
        timestamp: new Date(),
      };

      // 🔥 关键：先设置完所有数据，再修改 isGeneratingScene
      console.log('[Scene Practice] Setting scene and messages...');
      setScene(sceneData);
      setMessages([initialMessage, aiGreeting]); // 包含AI的开场对话
      setCurrentTurn(0);
      setIsGeneratingScene(false); // 🔥 立即设置为 false，触发页面切换
      
      console.log('[Scene Practice] Scene generation complete!');
      
    } catch (error) {
      console.error('[Scene Practice] Error generating scene:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate scene: ${errorMessage}\n\nPlease try again or check your API key configuration.`);
      setIsGeneratingScene(false);
      setShowApiKeyInput(true); // 显示API Key配置界面
    }
  }, [records, apiKey, isGeneratingScene]);

  // 开始场景 - 当API Key可用且不在显示输入界面时
  useEffect(() => {
    console.log('[Scene Practice] useEffect check:', {
      hasScene: !!scene,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length,
      showApiKeyInput,
      isGeneratingScene,
      isInitialized
    });
    
    if (isInitialized && !scene && apiKey && !showApiKeyInput && !isGeneratingScene) {
      console.log('[Scene Practice] Conditions met, starting scene generation...');
      generateScene();
    } else {
      console.log('[Scene Practice] Not generating because:', {
        notInitialized: !isInitialized,
        hasScene: !!scene,
        noApiKey: !apiKey,
        showingInput: showApiKeyInput,
        alreadyGenerating: isGeneratingScene
      });
    }
  }, [apiKey, showApiKeyInput, isInitialized, scene, isGeneratingScene, generateScene]);

  // 提交用户消息
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isSending || isFinished || !scene) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setIsTyping(true);
    setCurrentAIMessage("");

    try {
      // 构建评分和回复的 prompt
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));


      // 计算历史评分数据用于动态调整
      const historicalScores = turnScores.filter((score: number) => score > 0);
      const averageHistoricalScore = historicalScores.length > 0 
        ? historicalScores.reduce((sum: number, score: number) => sum + score, 0) / historicalScores.length 
        : 50;
      
      const scoreVariance = historicalScores.length > 1 
        ? Math.sqrt(historicalScores.reduce((sum: number, score: number) => sum + Math.pow(score - averageHistoricalScore, 2), 0) / historicalScores.length)
        : 10;

      const evaluationPrompt = `You are an advanced English teacher with expertise in adaptive assessment. Evaluate the student's response using a sophisticated, dynamic scoring system.

**Context:**
- Scenario: ${scene.title}
- Goal: ${scene.goal}
- Turn: ${currentTurn + 1}/${MAX_TURNS}
- Current Score: ${totalScore}/100
- Historical Average: ${Math.round(averageHistoricalScore)}
- Score Variance: ${Math.round(scoreVariance)}

**Student's Response:** "${userMessage.content}"
**Word Count:** ${userMessage.content.trim().split(/\s+/).length} words

**COMPREHENSIVE EVALUATION CRITERIA (0-100 each):**

**Communication Effectiveness (30%):**
- Excellent (85-100): Natural, engaging, culturally appropriate, shows personality
- Good (70-84): Clear communication, mostly natural, contextually appropriate
- Fair (55-69): Understandable, some awkwardness but functional
- Basic (40-54): Basic communication, limited naturalness
- Needs work (0-39): Difficult to understand or inappropriate

**Language Accuracy (25%):**
- Excellent (85-100): Accurate grammar, rich vocabulary, proper pronunciation patterns
- Good (70-84): Mostly accurate, good vocabulary range, minor errors
- Fair (55-69): Some errors but meaning clear, basic vocabulary
- Basic (40-54): Several errors but understandable
- Needs work (0-39): Many errors affecting comprehension

**Scenario Mastery (25%):**
- Excellent (85-100): Perfectly fits context, shows deep understanding, cultural awareness
- Good (70-84): Appropriate for situation, shows good context awareness
- Fair (55-69): Mostly relevant, some context issues
- Basic (40-54): Somewhat appropriate but lacks depth
- Needs work (0-39): Off-topic or inappropriate

**Conversational Fluency (20%):**
- Excellent (85-100): Natural rhythm, good timing, engaging interaction
- Good (70-84): Smooth flow, appropriate pacing
- Fair (55-69): Clear but may have timing issues
- Basic (40-54): Understandable but lacks natural flow
- Needs work (0-39): Disrupted flow, hard to follow

**BALANCED SCORING RULES:**
1. **Communication First:** Prioritize effective communication over perfect grammar
   - Natural contractions (wanna, gonna, don't, can't): +4-6 points BONUS
   - Informal expressions (yeah, sure, cool, awesome): +2-4 points BONUS
   - Phrasal verbs (pick up, hang out, check out): +3-5 points BONUS
   - Idioms and cultural expressions: +4-8 points BONUS

2. **Balanced Expectations:**
   - Reward both accuracy and naturalness
   - Encourage authentic communication patterns
   - Value cultural appropriateness

3. **Flexible Word Count Guidelines:**
   - 1-3 words: 40-60 points (appropriate for quick responses)
   - 4-6 words: 50-75 points (good conversational length)
   - 7-12 words: 60-85 points (excellent detail)
   - 13+ words: 70-95 points (comprehensive responses)

4. **Comprehensive Bonuses:**
   - Natural contractions: +4-6 points
   - Informal expressions: +2-4 points
   - Phrasal verbs: +3-5 points
   - Idioms/slang: +4-8 points
   - Cultural awareness: +3-5 points
   - Personality/humor: +2-4 points
   - Advanced vocabulary: +2-4 points
   - Complex grammar: +2-3 points

5. **Balanced Penalties:**
   - Minor grammar errors: -2-4 points
   - Simple vocabulary: -1-3 points
   - Slightly off-topic: -3-6 points
   - Major grammar errors: -5-8 points

6. **Learning Encouragement:**
   - First attempts at new expressions: +2-4 points
   - Risk-taking with language: +3-5 points
   - Showing personality: +2-3 points
   - Cultural references: +2-4 points

**CONVERSATION END ASSESSMENT:**
After scoring, evaluate if the conversation should end:
- Goal achieved: Student has successfully completed the scenario objective
- Natural conclusion: Conversation has reached a logical endpoint
- Repetitive content: Student is repeating similar responses
- Low engagement: Student responses are becoming shorter/less detailed
- Time limit: Approaching maximum turns without significant progress

**Response Format (ONLY JSON, no markdown):**
{
  "scores": {
    "communication": 85,
    "accuracy": 80,
    "scenario": 90,
    "fluency": 85
  },
  "feedback": "Great use of natural expressions!",
  "response": "Sure! The tomatoes are $2.99 per pound. Would you like anything else?",
  "hasChinese": false,
  "shouldEnd": false,
  "endReason": "none",
  "confidence": "high",
  "nextTurnExpectation": "What to expect in next turn"
}

**Scoring Examples for Natural Speech:**
- "I need apples" → Natural 60, Vocab 50, Relevance 70, Flow 55 = 59 points
- "I need some apples please" → Natural 65, Vocab 60, Relevance 75, Flow 60 = 65 points  
- "I'm looking for fresh apples" → Natural 70, Vocab 70, Relevance 80, Flow 65 = 71 points
- "Could you help me find some fresh apples?" → Natural 75, Vocab 75, Relevance 85, Flow 75 = 78 points
- "Hey, I'm looking for some fresh apples" → Natural 80, Vocab 80, Relevance 85, Flow 80 = 81 points (BONUS for "Hey")
- "I wanna get some fresh apples" → Natural 85, Vocab 85, Relevance 85, Flow 85 = 85 points (BONUS for "wanna")
- "Sure thing! We've got some great organic apples" → Natural 90, Vocab 90, Relevance 90, Flow 90 = 90 points (BONUS for natural response)

**Conversation Tips:**
- Keep your response natural and in-character
- Ask follow-up questions to continue the conversation
- Use A2-B1 level English (like New Concept English 2)
- Be friendly and encouraging`;

      const response = await fetch('/ai/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
        body: JSON.stringify({
          messages: [
            ...conversationHistory,
            { role: 'user', content: userMessage.content },
            { role: 'system', content: evaluationPrompt }
          ],
          model: 'gpt-4o-mini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
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

      // 解析最终的完整评分数据
      let cleanText = fullText.trim();
      cleanText = cleanText.replace(/^```json\s*/g, '').replace(/^```\s*/g, '');
      cleanText = cleanText.replace(/\s*```$/g, '');
      
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response: No valid JSON found');
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);

      // 🔥 实现打字机效果 - 逐字符显示 AI 的回复
      const responseText = evaluation.response || "I see. Let's continue.";
      await new Promise<void>((resolve) => {
        let charIndex = 0;
        const typingSpeed = 30; // 每个字符的延迟（ms）
        
        const typeNextChar = () => {
          if (charIndex < responseText.length) {
            setCurrentAIMessage(responseText.slice(0, charIndex + 1));
            charIndex++;
            setTimeout(typeNextChar, typingSpeed);
          } else {
            resolve();
          }
        };
        
        typeNextChar();
      });

      // 智能评分处理 - 使用综合评分维度
      const scores: ScoreDimensions = evaluation.scores;
      let turnScore = (scores.communication + scores.accuracy + scores.scenario + scores.fluency) / 4;
      
      // 动态评分调整 - 基于历史表现
      const scoreAdjustment = calculateScoreAdjustment(turnScore, averageHistoricalScore, scoreVariance);
      turnScore = Math.max(0, Math.min(100, turnScore + scoreAdjustment));
      
      // 应用惩罚和奖励
      let finalTurnScore = turnScore;
      if (evaluation.hasChinese) {
        finalTurnScore = Math.max(0, turnScore - 15);
      }

      // 口语练习的分数变化控制 - 更宽松
      const maxScoreChange = Math.max(8, Math.min(20, scoreVariance * 2.5)); // 增加变化范围
      const previousScore = turnScores[currentTurn] || averageHistoricalScore;
      const scoreChange = finalTurnScore - previousScore;
      if (Math.abs(scoreChange) > maxScoreChange) {
        finalTurnScore = previousScore + (scoreChange > 0 ? maxScoreChange : -maxScoreChange);
      }

      // 更新总分（累加平均）
      const newTotalScore = Math.round(((totalScore * currentTurn) + finalTurnScore) / (currentTurn + 1));
      const scoreDiff = newTotalScore - totalScore;
      
      // 显示分数变化动画
      setScoreChange(scoreDiff);
      setTimeout(() => setScoreChange(null), 2000); // 2秒后消失

      // 检查是否应该结束对话 - 口语练习更宽松的结束条件
      const shouldEndConversation = evaluation.shouldEnd || 
        (currentTurn >= 6 && evaluation.endReason && evaluation.endReason !== 'none') ||
        (currentTurn >= 9 && newTotalScore < 50); // 9轮后分数仍低于50分

      if (shouldEndConversation) {
        // 提前结束对话
        setTimeout(() => {
          setCurrentTurn(MAX_TURNS);
          setIsFinished(true);
        }, 2000);
      }
      
      setTotalScore(newTotalScore);

      // 更新turnScores数组
      setTurnScores(prev => [...prev, finalTurnScore]);

      // 更新用户消息添加评分
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id 
          ? { ...m, score: scores, feedback: evaluation.feedback }
          : m
      ));

      // AI 回复（使用最终解析的内容）
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentAIMessage(""); // 清空临时显示
      
      // 更新轮次
      const nextTurn = currentTurn + 1;
      setCurrentTurn(nextTurn);

      // 检查是否结束
      if (nextTurn >= MAX_TURNS) {
        setIsFinished(true);
      } else if (newTotalScore >= PASS_SCORE && nextTurn >= MIN_TURNS) {
        // 必须达到最低轮次要求才能通过
        setIsFinished(true);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [input, isSending, isFinished, scene, messages, currentTurn, totalScore, apiKey]);

  // 保存 API Key
  const handleSaveApiKey = () => {
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
      console.log('[Scene Practice] Saving API key and starting scene generation');
      sessionStorage.setItem('api_key_openai', trimmedKey);
      setApiKey(trimmedKey); // 确保状态更新
      setShowApiKeyInput(false);
      
      // 立即触发场景生成
      setTimeout(() => {
        console.log('[Scene Practice] Triggering scene generation after API key save');
        generateScene();
      }, 100);
    } else {
      alert('Please enter a valid API key');
    }
  };

  // 保存会话数据并跳转到分析页面
  const handleViewAnalysis = () => {
    if (!scene) return;
    
    // 生成唯一ID
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存完整会话数据到 localStorage
    const sessionData = {
      id: analysisId,
      scene,
      messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
      totalScore,
      currentTurn,
      passedTest: totalScore >= PASS_SCORE && currentTurn >= MIN_TURNS,
      timestamp: Date.now(),
    };
    
    localStorage.setItem('scene_practice_session', JSON.stringify(sessionData));
    
    // 跳转到动态分析页面
    window.location.href = `/ai/scene-practice/analysis/${analysisId}`;
  };
  
  // 重新开始
  const handleRestart = () => {
    console.log('[Scene Practice] Restarting...');
    setScene(null);
    setMessages([]);
    setCurrentTurn(0);
    setTotalScore(0);
    setIsFinished(false);
    setIsGeneratingScene(false);
    
    // 延迟一点再生成新场景，确保状态更新完成
    setTimeout(() => {
      generateScene();
    }, 100);
  };

  // 初始化前显示加载
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // API Key 输入界面
  if (showApiKeyInput) {
    console.log('[Scene Practice] Rendering API Key input form');
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Configure API Key
          </h2>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
            Please enter your OpenAI API key to use this feature
          </p>
          <div className="space-y-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && apiKey.trim()) {
                  handleSaveApiKey();
                }
              }}
              placeholder="sk-..."
              autoFocus
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
            />
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
            >
              Start Practice
            </Button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Your API key will be stored in your browser session
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 加载场景中
  if (!scene || isGeneratingScene) {
    console.log('[Scene Practice] Rendering loading screen', { hasScene: !!scene, isGeneratingScene });
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generating your scenario...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This may take a few seconds
          </p>
        </div>
      </div>
    );
  }
  
  console.log('[Scene Practice] Rendering main content with scene:', scene.title);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <MessageCircle className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {currentTurn}/{MAX_TURNS}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Dashboard */}
      <div className="flex-shrink-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* 总分和目标 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 relative">
                <Trophy className={`w-6 h-6 ${totalScore >= PASS_SCORE ? 'text-green-500' : 'text-amber-500'}`} />
                <span className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {totalScore}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
                
                {/* 分数变化动画 - Apple 风格 */}
                <AnimatePresence>
                  {scoreChange !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ 
                        opacity: [0, 1, 1, 0], 
                        y: [10, -20, -25, -30],
                        scale: [0.5, 1.2, 1, 0.8]
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ 
                        duration: 2,
                        times: [0, 0.2, 0.8, 1],
                        ease: "easeOut"
                      }}
                      className={`absolute left-1/2 -translate-x-1/2 top-0 font-bold text-2xl pointer-events-none drop-shadow-lg ${
                        scoreChange > 0 
                          ? 'text-green-500' 
                          : scoreChange < 0 
                          ? 'text-red-500' 
                          : 'text-gray-500'
                      }`}
                    >
                      {scoreChange > 0 ? '+' : ''}{scoreChange}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Goal: {PASS_SCORE}
              </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                totalScore >= PASS_SCORE
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${Math.min(totalScore, 100)}%` }}
            />
            {/* 目标线 */}
            <div
              className="absolute inset-y-0 w-0.5 bg-blue-500"
              style={{ left: `${PASS_SCORE}%` }}
            />
          </div>

          {/* 最后一次评分详情 */}
          {messages.length > 1 && messages[messages.length - 2]?.score && (
            <div className="mt-3 flex gap-2">
              {Object.entries(messages[messages.length - 2].score || {}).map(([key, value]) => (
                <div key={key} className="flex-1 px-2 py-1.5 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize mb-0.5">{key}</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{Math.round(value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                      : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
                
                {/* 用户消息的评分反馈 */}
                {message.role === 'user' && message.feedback && (
                  <div className="mt-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                    {message.feedback}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 正在输入 */}
          {isTyping && currentAIMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white">
                  <div className="text-sm whitespace-pre-wrap">{currentAIMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* 结束状态 */}
          {isFinished && (
            <div className="flex justify-center">
              <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 text-center">
                <div className={`flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full ${
                  totalScore >= PASS_SCORE
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {totalScore >= PASS_SCORE && currentTurn >= MIN_TURNS 
                    ? 'Congratulations! 🎉' 
                    : 'Keep Practicing! 💪'}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Final Score: <span className="text-2xl font-bold text-amber-600">{totalScore}</span>/100
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                  Completed {currentTurn} turns
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  {totalScore >= PASS_SCORE && currentTurn >= MIN_TURNS
                    ? 'You passed this scenario! Great job on your English practice.'
                    : totalScore >= PASS_SCORE
                    ? `You reached ${PASS_SCORE} points but need at least ${MIN_TURNS} turns to pass.`
                    : `You need ${PASS_SCORE} points and at least ${MIN_TURNS} turns to pass. Keep trying!`}
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleViewAnalysis}
                    className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium"
                  >
                    📊 View Detailed Analysis
                  </Button>
                  
                  <Button
                    onClick={handleRestart}
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
                  >
                    Try New Scenario
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isFinished && (
        <div className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-4">
          <div className="w-full max-w-4xl mx-auto">
            <AIInputMinimal
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isSending}
              onVoiceError={(error) => console.error("Voice error:", error)}
              onInputFocus={scrollToBottom}
              onInputBlur={scrollToBottom}
              placeholder="Type your response in English..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

