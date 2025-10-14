/**
 * 音频录制 Hook
 * 使用 MediaRecorder API 录制音频
 */

import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  clearAudio: () => void;
  audioURL: string | null;
  error: string | null;
  stream: MediaStream | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // 请求麦克风权限
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,      // 回声消除
          noiseSuppression: true,       // 噪声抑制
          autoGainControl: true,        // 自动增益
          sampleRate: 44100,            // 采样率
        } 
      });

      // 检测支持的格式
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(newStream, { mimeType });

      chunksRef.current = [];
      startTimeRef.current = Date.now();
      
      // 保存stream到state和ref
      streamRef.current = newStream;
      setStream(newStream);

      // 收集音频数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 录音停止时不在这里处理，在stopRecording中统一处理
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        // 创建音频 URL
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        const recordDuration = (Date.now() - startTimeRef.current) / 1000;
        setDuration(recordDuration);

        console.group('🎤 录音完成');
        console.log('音频大小:', (blob.size / 1024).toFixed(2), 'KB');
        console.log('音频时长:', recordDuration.toFixed(1), '秒');
        console.log('音频格式:', mimeType);
        console.groupEnd();
      };

      // 开始录音
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      // 实时更新时长
      durationIntervalRef.current = setInterval(() => {
        const currentDuration = (Date.now() - startTimeRef.current) / 1000;
        setDuration(currentDuration);
      }, 100);

      console.log('🎤 开始录音');
    } catch (err) {
      console.error('录音失败:', err);
      const errorMessage = err instanceof Error ? err.message : '录音失败';
      setError(errorMessage);
      setIsRecording(false);
      throw err;
    }
  }, []);

  /**
   * 停止录音
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const mediaRecorder = mediaRecorderRef.current;
        const currentStream = streamRef.current;
        
        mediaRecorder.onstop = () => {
          const mimeType = mediaRecorder.mimeType;
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
          
          const recordDuration = (Date.now() - startTimeRef.current) / 1000;
          setDuration(recordDuration);

          // 清除定时器
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }

          // ⭐ 关键修复：立即停止所有音频轨道，释放麦克风
          if (currentStream) {
            currentStream.getTracks().forEach(track => {
              track.stop();
              console.log('🛑 停止音频轨道:', track.label);
            });
            streamRef.current = null;
            setStream(null);
          }

          console.log('🎤 停止录音', `时长: ${recordDuration.toFixed(1)}秒`);
          console.log('✅ 麦克风已释放，可以使用语音转文字');
          
          setIsRecording(false);
          resolve(blob);
        };

        mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }, [isRecording]);

  /**
   * 清除音频
   */
  const clearAudio = useCallback(() => {
    // 释放音频 URL
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    // 停止并清理 stream（如果还在运行）
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
      console.log('🛑 清理：停止音频轨道');
    }
    
    setAudioBlob(null);
    setAudioURL(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    
    console.log('🗑️ 清除音频');
  }, [audioURL]);

  return {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    clearAudio,
    audioURL,
    error,
    stream,
  };
}

