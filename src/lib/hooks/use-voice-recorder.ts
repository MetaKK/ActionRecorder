"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceRecorderOptions {
  onResult?: (text: string) => void;
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

export function useVoiceRecorder({
  onResult,
  onError,
  language = "zh-CN",
  preventDuplicates = true,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const lastResultRef = useRef<string>("");

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
    lastResultRef.current = ""; // 重置上次结果

    try {
      // 使用 Web Speech API 进行实时语音识别
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as { new(): unknown })() as any;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log("语音识别开始");
      };

      recognition.onresult = (event: unknown) => {
        let finalTranscript = "";
        const speechEvent = event as { resultIndex: number; results: Array<Array<{ transcript: string }> & { isFinal: boolean }> };

        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
          const transcript = speechEvent.results[i][0].transcript;
          if (speechEvent.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          // 防重复逻辑：检查是否与上次结果相同
          if (preventDuplicates && finalTranscript === lastResultRef.current) {
            console.log("跳过重复的语音识别结果:", finalTranscript);
            return;
          }
          
          lastResultRef.current = finalTranscript;
          onResult?.(finalTranscript);
        }
      };

      recognition.onerror = (event: unknown) => {
        const errorEvent = event as { error: string };
        console.error("语音识别错误:", errorEvent.error);
        const errorMsg = `语音识别错误: ${errorEvent.error}`;
        setError(errorMsg);
        onError?.(errorMsg);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        lastResultRef.current = ""; // 清空上次结果
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      const errorMsg = "启动语音识别失败";
      setError(errorMsg);
      onError?.(errorMsg);
      setIsRecording(false);
    }
  }, [isSupported, language, onResult, onError, preventDuplicates]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    lastResultRef.current = ""; // 清空上次结果
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
