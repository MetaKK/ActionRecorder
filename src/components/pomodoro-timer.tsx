"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  mode: PomodoroMode;
  duration: number;
  completedAt: Date;
}

interface PomodoroStats {
  completedPomodoros: number;
  totalFocusTime: number;
  sessionsToday: number;
}

// 番茄钟配置（符合业界标准）
const POMODORO_CONFIG = {
  work: 25 * 60,        // 25 分钟工作
  shortBreak: 5 * 60,   // 5 分钟短休息
  longBreak: 15 * 60,   // 15 分钟长休息
  pomodorosUntilLongBreak: 4, // 4 个番茄钟后长休息
};

export function PomodoroTimer() {
  // 核心状态
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(POMODORO_CONFIG.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  // 任务和统计
  const [currentTask, setCurrentTask] = useState('');
  const [stats, setStats] = useState<PomodoroStats>({
    completedPomodoros: 0,
    totalFocusTime: 0,
    sessionsToday: 0,
  });
  
  // 历史记录
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  
  // 音效引用
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化音效
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
    
    // 从 localStorage 加载数据
    loadStatsFromStorage();
  }, []);

  // 计时器逻辑
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  // 从 localStorage 加载统计数据
  const loadStatsFromStorage = () => {
    try {
      const savedStats = localStorage.getItem('pomodoro-stats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setStats(parsed);
        setCompletedPomodoros(parsed.completedPomodoros);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // 保存统计数据到 localStorage
  const saveStatsToStorage = (newStats: PomodoroStats) => {
    try {
      localStorage.setItem('pomodoro-stats', JSON.stringify(newStats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  };

  // 计时器完成处理
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    // 播放完成音效（使用浏览器原生音效）
    playCompletionSound();
    
    // 显示通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('番茄钟', {
        body: mode === 'work' ? '工作时段完成！休息一下吧 ☕' : '休息结束！准备开始工作 💪',
        icon: '/img/9ade71d75a1c0e93.png',
      });
    }

    // 记录完成的会话
    const newSession: PomodoroSession = {
      mode,
      duration: getDurationForMode(mode),
      completedAt: new Date(),
    };
    setSessions((prev) => [...prev, newSession]);

    // 更新统计数据
    if (mode === 'work') {
      const newPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newPomodoros);
      
      const newStats: PomodoroStats = {
        completedPomodoros: stats.completedPomodoros + 1,
        totalFocusTime: stats.totalFocusTime + POMODORO_CONFIG.work,
        sessionsToday: stats.sessionsToday + 1,
      };
      setStats(newStats);
      saveStatsToStorage(newStats);

      // 显示鼓励消息
      toast.success(`🎉 完成第 ${newPomodoros} 个番茄钟！`, {
        description: getEncouragementMessage(newPomodoros),
      });

      // 自动切换到休息模式
      const nextMode = newPomodoros % POMODORO_CONFIG.pomodorosUntilLongBreak === 0 
        ? 'longBreak' 
        : 'shortBreak';
      switchMode(nextMode);
    } else {
      // 休息结束，返回工作模式
      toast('休息结束', {
        description: '准备好开始新的番茄钟了吗？',
      });
      switchMode('work');
    }
  }, [mode, completedPomodoros, stats]);

  // 播放完成音效
  const playCompletionSound = () => {
    // 使用 Web Audio API 生成简单的提示音
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  // 获取鼓励消息
  const getEncouragementMessage = (count: number): string => {
    if (count === 1) return '很好的开始！继续保持专注 💪';
    if (count === 4) return '完成一轮！你真棒！🌟';
    if (count === 8) return '太厉害了！专注大师 🏆';
    if (count % 4 === 0) return `完成 ${count / 4} 轮！你是专注冠军！🎯`;
    return '继续保持这个节奏！';
  };

  // 切换模式
  const switchMode = useCallback((newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
    setIsRunning(false);
  }, []);

  // 获取模式时长
  const getDurationForMode = (m: PomodoroMode): number => {
    switch (m) {
      case 'work':
        return POMODORO_CONFIG.work;
      case 'shortBreak':
        return POMODORO_CONFIG.shortBreak;
      case 'longBreak':
        return POMODORO_CONFIG.longBreak;
    }
  };

  // 开始/暂停
  const toggleTimer = () => {
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  // 重置
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const progress = ((getDurationForMode(mode) - timeLeft) / getDurationForMode(mode)) * 100;

  // 获取模式配置
  const getModeConfig = () => {
    switch (mode) {
      case 'work':
        return {
          label: '专注工作',
          color: 'from-red-500 to-orange-500',
          icon: Zap,
          bgGradient: 'from-red-50 to-orange-50',
        };
      case 'shortBreak':
        return {
          label: '短休息',
          color: 'from-green-500 to-teal-500',
          icon: Coffee,
          bgGradient: 'from-green-50 to-teal-50',
        };
      case 'longBreak':
        return {
          label: '长休息',
          color: 'from-blue-500 to-purple-500',
          icon: Coffee,
          bgGradient: 'from-blue-50 to-purple-50',
        };
    }
  };

  const modeConfig = getModeConfig();
  const ModeIcon = modeConfig.icon;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${modeConfig.bgGradient} dark:from-gray-900 dark:to-gray-800`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* 顶部统计 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {completedPomodoros}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">个番茄钟</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.floor(stats.totalFocusTime / 60)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">分钟专注</span>
          </div>
        </motion.div>

        {/* 模式标签 */}
        <motion.div
          key={mode}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <div className={`flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${modeConfig.color} rounded-full shadow-xl`}>
            <ModeIcon className="w-6 h-6 text-white" />
            <span className="text-xl font-bold text-white">{modeConfig.label}</span>
          </div>
        </motion.div>

        {/* 圆形进度环 + 倒计时 */}
        <div className="relative mb-12">
          {/* 进度环 */}
          <svg width="320" height="320" className="transform -rotate-90">
            {/* 背景圆 */}
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* 进度圆 */}
            <motion.circle
              cx="160"
              cy="160"
              r="140"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 140}
              strokeDashoffset={2 * Math.PI * 140 * (1 - progress / 100)}
              initial={{ strokeDashoffset: 2 * Math.PI * 140 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 140 * (1 - progress / 100) }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            {/* 渐变定义 */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={mode === 'work' ? '#ef4444' : mode === 'shortBreak' ? '#10b981' : '#3b82f6'} />
                <stop offset="100%" stopColor={mode === 'work' ? '#f97316' : mode === 'shortBreak' ? '#14b8a6' : '#8b5cf6'} />
              </linearGradient>
            </defs>
          </svg>

          {/* 中心时间显示 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-7xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className="text-lg text-gray-600 dark:text-gray-400">
              {isRunning ? '专注中...' : '准备好了吗？'}
            </div>
          </div>
        </div>

        {/* 任务输入 */}
        {!isRunning && mode === 'work' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 w-full max-w-md"
          >
            <input
              type="text"
              placeholder="这个番茄钟要专注什么？"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              className="w-full px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md 
                border-2 border-gray-200 dark:border-gray-700 rounded-2xl
                text-center text-gray-900 dark:text-white placeholder-gray-400
                focus:outline-none focus:border-orange-500 dark:focus:border-orange-400
                transition-colors"
            />
          </motion.div>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center gap-4">
          {/* 主按钮 - 开始/暂停 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={`flex items-center justify-center w-20 h-20 rounded-full shadow-2xl
              bg-gradient-to-br ${modeConfig.color} text-white
              hover:shadow-3xl transition-all`}
          >
            {isRunning ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </motion.button>

          {/* 重置按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="flex items-center justify-center w-14 h-14 rounded-full
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg
              text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800
              transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>
        </div>

        {/* 模式切换 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3"
        >
          <button
            onClick={() => switchMode('work')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              mode === 'work'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            工作
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              mode === 'shortBreak'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            短休息
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              mode === 'longBreak'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            长休息
          </button>
        </motion.div>
      </div>

      {/* 完成动画 */}
      <AnimatePresence>
        {timeLeft === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

