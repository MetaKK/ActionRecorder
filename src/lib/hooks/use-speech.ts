/**
 * 语音识别 Hook
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// 声明 webkitSpeechRecognition 类型
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
    isFinal: boolean;
  };
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    lang = 'zh-CN',
    continuous = false,
    interimResults = true,
  } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  
  // 检查浏览器支持
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        setInterimTranscript('');
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';
        
        // ✅ 只遍历新的识别结果（从 resultIndex 开始）
        // resultIndex 指示新结果的起始位置，避免重复处理旧结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += result;
          } else {
            interimText += result;
          }
        }
        
        // 只有最终结果才更新 transcript
        if (finalText) {
          setTranscript(prev => prev + finalText);
        }
        
        // 临时结果单独存储
        setInterimTranscript(interimText);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'no-speech':
            // 在持续模式下，不把 no-speech 当作错误
            // 用户可能只是暂停说话，不需要停止录音
            if (!continuous) {
              setIsListening(false);
              setError('未检测到语音，请重试');
            }
            // 持续模式下忽略此错误，继续录音
            break;
          case 'audio-capture':
            setIsListening(false);
            setError('无法访问麦克风，请检查麦克风是否正常工作');
            break;
          case 'not-allowed':
            setIsListening(false);
            setError('麦克风权限被拒绝，请点击地址栏🔒图标允许麦克风访问');
            break;
          case 'network':
            setIsListening(false);
            setError('网络错误，语音识别需要网络连接');
            break;
          case 'aborted':
            // 用户主动停止，不显示错误
            setIsListening(false);
            break;
          default:
            setIsListening(false);
            setError(`语音识别出错 (${event.error})，请重试`);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang, continuous, interimResults]);
  
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器');
      return;
    }
    
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('already started')) {
        // 如果已经启动，先停止再重新启动
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (restartErr) {
                console.error('Failed to restart recognition:', restartErr);
                setError('启动语音识别失败，请重试');
              }
            }
          }, 100);
        } catch {
          setError('启动语音识别失败，请重试');
        }
      } else {
        setError('启动语音识别失败，请刷新页面重试');
      }
    }
  }, []);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);
  
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);
  
  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}


