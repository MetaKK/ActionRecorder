"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceRecorderOptions {
  /** 最终确认的文本回调（用户停顿后确认的结果） */
  onResult?: (text: string, isFinal: boolean) => void;
  /** 实时临时结果回调（正在识别中的文本，用于实时显示） */
  onInterimResult?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  /** 是否自动去重（防止重复添加相同文本） */
  preventDuplicates?: boolean;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  error: string | null;
}

/**
 * 语音转文字 Hook - 参考语音产品最佳实践
 * 
 * 工作流程：
 * 1. 实时显示临时识别结果（灰色/斜体）- onInterimResult
 * 2. 用户停顿后，临时结果变为最终确认结果 - onResult(text, true)
 * 3. 继续识别新的临时结果，追加到已确认的文本后
 * 
 * 这种方式提供最佳的实时反馈体验
 */
export function useVoiceRecorder({
  onResult,
  onInterimResult,
  onError,
  language = "zh-CN",
  preventDuplicates = true,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const lastFinalResultRef = useRef<string>("");
  const accumulatedFinalTextRef = useRef<string>("");

  const isSupported = typeof window !== "undefined" && 
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      const errorMsg = "语音识别不支持此浏览器";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    setIsRecording(true);
    lastFinalResultRef.current = "";
    accumulatedFinalTextRef.current = "";

    try {
      // 使用 Web Speech API 进行实时语音识别
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as { new(): unknown })() as any;
      
      recognition.continuous = true;
      recognition.interimResults = true; // 启用临时结果，实现实时反馈
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("🎤 语音识别开始");
      };

      recognition.onresult = (event: unknown) => {
        const speechEvent = event as { 
          resultIndex: number; 
          results: Array<Array<{ transcript: string }> & { isFinal: boolean }> 
        };

        let interimTranscript = "";
        let finalTranscript = "";

        // 遍历所有识别结果
        for (let i = 0; i < speechEvent.results.length; i++) {
          const transcript = speechEvent.results[i][0].transcript;
          
          if (speechEvent.results[i].isFinal) {
            // 最终确认的结果
            finalTranscript += transcript;
          } else {
            // 临时结果（正在识别中）
            interimTranscript += transcript;
          }
        }

        // 处理临时结果 - 实时显示
        if (interimTranscript) {
          console.log("💬 临时识别:", interimTranscript);
          onInterimResult?.(interimTranscript);
        }

        // 处理最终结果 - 确认并追加
        if (finalTranscript) {
          // 防重复逻辑
          if (preventDuplicates && finalTranscript === lastFinalResultRef.current) {
            console.log("⏭️ 跳过重复结果:", finalTranscript);
            return;
          }
          
          lastFinalResultRef.current = finalTranscript;
          accumulatedFinalTextRef.current += finalTranscript;
          
          console.log("✅ 最终确认:", finalTranscript);
          console.log("📝 累计文本:", accumulatedFinalTextRef.current);
          
          // 回调最终结果
          onResult?.(finalTranscript, true);
        }
      };

      recognition.onerror = (event: unknown) => {
        const errorEvent = event as { error: string };
        console.error("❌ 语音识别错误:", errorEvent.error);
        const errorMsg = `语音识别错误: ${errorEvent.error}`;
        setError(errorMsg);
        onError?.(errorMsg);
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log("🛑 语音识别结束");
        setIsRecording(false);
        lastFinalResultRef.current = "";
        accumulatedFinalTextRef.current = "";
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      const errorMsg = "启动语音识别失败";
      setError(errorMsg);
      onError?.(errorMsg);
      setIsRecording(false);
    }
  }, [isSupported, language, onResult, onInterimResult, onError, preventDuplicates]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    lastFinalResultRef.current = "";
    accumulatedFinalTextRef.current = "";
  }, []);

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    error,
  };
}

// 语音播放功能
export function useVoicePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playText = useCallback(async (text: string, language = "zh-CN") => {
    if (!("speechSynthesis" in window)) {
      const errorMsg = "语音播放不支持此浏览器";
      setError(errorMsg);
      return;
    }

    setError(null);
    setIsPlaying(true);

    try {
      // 停止当前播放
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (event: unknown) => {
        const errorEvent = event as { error: string };
        console.error("语音播放错误:", errorEvent.error);
        setError(`语音播放错误: ${errorEvent.error}`);
        setIsPlaying(false);
      };

      speechSynthesis.speak(utterance);
    } catch {
      const errorMsg = "语音播放失败";
      setError(errorMsg);
      setIsPlaying(false);
    }
  }, []);

  const stopPlaying = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return {
    isPlaying,
    error,
    playText,
    stopPlaying,
  };
}

// 扩展 Window 接口以支持语音识别
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

