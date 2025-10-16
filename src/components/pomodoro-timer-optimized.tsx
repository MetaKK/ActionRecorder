"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/lib/hooks/use-records";
import { completePluginWithRecord } from "@/lib/plugins";

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const POMODORO_CONFIG = {
  work: 25 * 60, // 25分钟
  shortBreak: 5 * 60, // 5分钟
  longBreak: 15 * 60, // 15分钟
  pomodorosUntilLongBreak: 4,
};

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

const SMOOTH_SPRING = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
};

export function PomodoroTimerOptimized() {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(POMODORO_CONFIG.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const hasCompletedRef = useRef(false); // 防止重复调用
  
  const { addRecord } = useRecords();

  // 进度计算（0-100%）
  const progress = ((getDurationForMode(mode) - timeLeft) / getDurationForMode(mode)) * 100;

  // 初始化
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 计时器
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 使用 ref 防止重复调用
          if (hasCompletedRef.current) {
            return 0;
          }
          hasCompletedRef.current = true;
          
          // 直接在这里处理完成逻辑，避免循环依赖
          setIsRunning(false);
          playCompletionSound();

          if (mode === 'work') {
            // 专注时间完成
            const newPomodoros = completedPomodoros + 1;
            setCompletedPomodoros(newPomodoros);

            const taskText = currentTask.trim() || '专注工作';
            
            // 使用新的插件完成系统
            completePluginWithRecord(
              {
                pluginId: "focus",
                duration: POMODORO_CONFIG.work,
                content: `完成第 ${newPomodoros} 个番茄钟${currentTask ? `：${taskText}` : ''}`,
                customData: {
                  task: currentTask,
                  pomodoros: newPomodoros,
                },
              },
              addRecord
            );

            showNotification('🎉 番茄钟完成！', `完成第 ${newPomodoros} 个番茄钟`);

            toast.success(`🍅 完成第 ${newPomodoros} 个番茄钟！`, {
              description: '已记录到时间线',
            });

            setCurrentTask('');

            const nextMode = newPomodoros % POMODORO_CONFIG.pomodorosUntilLongBreak === 0
              ? 'longBreak'
              : 'shortBreak';
            setTimeout(() => switchMode(nextMode), 1000);
          } else if (mode === 'shortBreak') {
            // 短休息完成
            const durationText = formatDuration(POMODORO_CONFIG.shortBreak);
            const recordContent = `☕ 完成短休息\n⏱️ 休息时长：${durationText}`;
            
            addRecord(recordContent);

            showNotification('☕ 短休息结束', '准备好开始新的番茄钟了吗？');
            
            toast.success('☕ 短休息完成！', {
              description: '已记录到时间线',
            });

            setTimeout(() => switchMode('work'), 1000);
          } else {
            // 长休息完成
            const durationText = formatDuration(POMODORO_CONFIG.longBreak);
            const recordContent = `🛋️ 完成长休息\n⏱️ 休息时长：${durationText}`;
            
            addRecord(recordContent);

            showNotification('🛋️ 长休息结束', '准备好开始新的番茄钟了吗？');
            
            toast.success('🛋️ 长休息完成！', {
              description: '已记录到时间线',
            });

            setTimeout(() => switchMode('work'), 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, completedPomodoros, currentTask, addRecord]);

  function getDurationForMode(m: PomodoroMode): number {
    switch (m) {
      case 'work': return POMODORO_CONFIG.work;
      case 'shortBreak': return POMODORO_CONFIG.shortBreak;
      case 'longBreak': return POMODORO_CONFIG.longBreak;
    }
  }

  // 格式化时长为可读文本
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return secs > 0 ? `${mins} 分钟 ${secs} 秒` : `${mins} 分钟`;
    }
    return `${secs} 秒`;
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const playCompletionSound = () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      [800, 1000].forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + index * 0.15;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    }
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/img/9ade71d75a1c0e93.png',
      });
    }
  };


  const switchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
    setIsRunning(false);
    hasCompletedRef.current = false; // 重置完成标记
  };

  const toggleTimer = () => {
    if (!isRunning) {
      hasCompletedRef.current = false; // 开始新的计时器时重置
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
    hasCompletedRef.current = false; // 重置完成标记
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'work':
        return {
          gradient: 'from-[#FF6B6B] via-[#FF8E53] to-[#FFA94D]',
          shadowColor: 'rgba(255, 107, 107, 0.5)',
          bgGradient: 'from-red-50/50 via-orange-50/30 to-amber-50/50',
          glowColor: '#FF6B6B',
        };
      case 'shortBreak':
        return {
          gradient: 'from-[#4ECDC4] via-[#44A08D] to-[#55C57A]',
          shadowColor: 'rgba(78, 205, 196, 0.5)',
          bgGradient: 'from-teal-50/50 via-emerald-50/30 to-green-50/50',
          glowColor: '#4ECDC4',
        };
      case 'longBreak':
        return {
          gradient: 'from-[#667EEA] via-[#764BA2] to-[#8E54E9]',
          shadowColor: 'rgba(102, 126, 234, 0.5)',
          bgGradient: 'from-indigo-50/50 via-purple-50/30 to-violet-50/50',
          glowColor: '#667EEA',
        };
    }
  };

  const getModeGradient = (m: PomodoroMode) => {
    switch (m) {
      case 'work': return 'from-[#FF6B6B] via-[#FF8E53] to-[#FFA94D]';
      case 'shortBreak': return 'from-[#4ECDC4] via-[#44A08D] to-[#55C57A]';
      case 'longBreak': return 'from-[#667EEA] via-[#764BA2] to-[#8E54E9]';
    }
  };

  const modeConfig = getModeConfig();

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${modeConfig.bgGradient} dark:from-gray-900 dark:to-gray-800`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-20"
          style={{ background: modeConfig.glowColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-20"
          style={{ background: modeConfig.glowColor }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      {/* 主容器 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* 模式切换 - 左下角 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SPRING_CONFIG}
          className="absolute bottom-6 left-6 z-50"
        >
          <div className="flex items-center gap-2 p-1.5 
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl 
            rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50
            hover:shadow-2xl transition-all duration-300">
            {(['work', 'shortBreak', 'longBreak'] as const).map((m) => {
              const isActive = mode === m;
              const getButtonConfig = (mode: PomodoroMode) => {
                switch (mode) {
                  case 'work':
                    return { emoji: '🍅', label: '专注', size: 'text-xl' };
                  case 'shortBreak':
                    return { emoji: '☕', label: '短休', size: 'text-lg' };
                  case 'longBreak':
                    return { emoji: '🛋️', label: '长休', size: 'text-lg' };
                }
              };
              
              const config = getButtonConfig(m);
              
              return (
                <motion.button
                  key={m}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode(m)}
                  className={`relative w-12 h-12 rounded-xl flex items-center justify-center
                    transition-all duration-300 ${
                    isActive
                      ? 'shadow-lg'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                  title={config.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMode"
                      className={`absolute inset-0 bg-gradient-to-r ${getModeGradient(m)} rounded-xl`}
                      transition={SMOOTH_SPRING}
                    />
                  )}
                  <span className={`relative z-10 ${config.size}`}>
                    {config.emoji}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 主时钟 */}
        <div className="relative mb-8 sm:mb-12">
          {/* 外圈装饰 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${modeConfig.glowColor}00, ${modeConfig.glowColor}40, ${modeConfig.glowColor}00)`,
              filter: 'blur(20px)',
              transform: 'scale(1.1)',
            }}
          />

          {/* 主圆环容器 */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-white/60 dark:bg-gray-800/60 
            backdrop-blur-2xl shadow-2xl border border-white/40
            flex items-center justify-center"
          >
            {/* SVG 进度环 */}
            <svg width="100%" height="100%" viewBox="0 0 320 320" className="absolute inset-0 transform -rotate-90">
              {/* 背景圆环 */}
              <circle
                cx="160"
                cy="160"
                r="145"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200/50 dark:text-gray-700/50"
                strokeLinecap="round"
              />
              
              {/* 进度圆环 */}
              <defs>
                <linearGradient id={`gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={mode === 'work' ? '#FF6B6B' : mode === 'shortBreak' ? '#4ECDC4' : '#667EEA'} />
                  <stop offset="50%" stopColor={mode === 'work' ? '#FF8E53' : mode === 'shortBreak' ? '#44A08D' : '#764BA2'} />
                  <stop offset="100%" stopColor={mode === 'work' ? '#FFA94D' : mode === 'shortBreak' ? '#55C57A' : '#8E54E9'} />
                </linearGradient>
              </defs>
              
              <circle
                cx="160"
                cy="160"
                r="145"
                stroke={`url(#gradient-${mode})`}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 145}
                strokeDashoffset={2 * Math.PI * 145 * (1 - progress / 100)}
                style={{
                  transition: 'stroke-dashoffset 0.3s ease-out',
                }}
              />
            </svg>

            {/* 时间显示 */}
            <div className="relative flex flex-col items-center">
              <div
                className="text-5xl sm:text-7xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 
                  dark:from-white dark:to-gray-300 bg-clip-text text-transparent
                  tracking-tight"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {formatTime(timeLeft)}
              </div>
              
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="mt-2 sm:mt-3 text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400"
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    专注中
                  </span>
                ) : (
                  '准备开始'
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* 任务输入 */}
        <AnimatePresence>
          {!isRunning && mode === 'work' && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={SMOOTH_SPRING}
              className="mb-8 w-full max-w-md"
            >
              <input
                type="text"
                placeholder="这个番茄钟要专注什么？✨"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                className="w-full px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl
                  border-2 border-white/40 dark:border-gray-700/40 rounded-2xl
                  text-center text-gray-900 dark:text-white placeholder-gray-400
                  focus:outline-none focus:border-orange-400 dark:focus:border-orange-500
                  transition-all shadow-lg hover:shadow-xl
                  font-medium"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 控制按钮组 */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* 主按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-2xl
              bg-gradient-to-br ${modeConfig.gradient}
              flex items-center justify-center overflow-hidden
              group transition-all`}
            style={{ boxShadow: `0 20px 60px -10px ${modeConfig.shadowColor}` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
            
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />

            <div className="relative z-10">
              {isRunning ? (
                <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              ) : (
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg ml-1" strokeWidth={2.5} />
              )}
            </div>
          </motion.button>

          {/* 重置按钮 */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: -180 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/80 dark:bg-gray-800/80 
              backdrop-blur-2xl shadow-lg border border-white/40
              flex items-center justify-center
              hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </motion.button>
        </div>
      </div>

      {/* 完成庆祝动画 - 增强仪式感 */}
      <AnimatePresence>
        {timeLeft === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md z-20"
          >
            {/* 背景光效 */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: 2 }}
            >
              <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-transparent to-transparent" />
            </motion.div>

            {/* 粒子效果 */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos((i * 30 * Math.PI) / 180) * 200,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 200,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* 主庆祝表情 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [180, 360, 360],
              }}
              transition={{ 
                duration: 0.6,
                times: [0, 0.6, 1],
                ease: "easeOut"
              }}
              className="relative z-10"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: 3,
                  ease: "easeInOut"
                }}
                className="text-9xl drop-shadow-2xl"
              >
                {mode === 'work' ? '🎉' : '☕'}
              </motion.div>
            </motion.div>

            {/* 庆祝文字 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: 2 }}
                className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
              >
                {mode === 'work' ? '🎊 太棒了！' : '✨ 休息结束'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-white/90 flex items-center gap-2 justify-center"
              >
                <Sparkles className="w-5 h-5" />
                {mode === 'work' ? '番茄钟完成，已记录到时间线' : '准备开始新的专注时段'}
                <Sparkles className="w-5 h-5" />
              </motion.div>
            </motion.div>

            {/* 装饰圆环 */}
            <motion.div
              className="absolute w-64 h-64 border-4 border-white/30 rounded-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.5, 1.5],
                opacity: [0, 0.5, 0],
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
