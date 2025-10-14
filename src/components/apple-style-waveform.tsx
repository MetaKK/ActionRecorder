'use client';

/**
 * Apple 风格音频波形可视化组件（优化版）
 * 修复：每次录音创建新的AudioContext，正确清理资源
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AppleStyleWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function AppleStyleWaveform({ 
  stream,
  isRecording,
  variant = 'default',
  className 
}: AppleStyleWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // 检查浏览器支持
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    setIsSupported(!!AudioContextClass && !!stream);
  }, [stream]);

  useEffect(() => {
    if (!isSupported || !canvasRef.current || !stream || !isRecording) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // 设置 Canvas 尺寸（考虑设备像素比）
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvasCtx.scale(dpr, dpr);

    // 保存canvas引用用于清理
    const canvasForCleanup = canvas;

    console.log('🎨 初始化波形可视化...');

    try {
      // ⭐ 每次录音创建新的AudioContext，避免状态混乱
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // 更高的采样率，更流畅
      analyser.smoothingTimeConstant = 0.85; // 更高的平滑度
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      console.log('✅ 波形可视化初始化成功');

      // 绘制函数
      const draw = () => {
        if (!analyserRef.current || !canvasCtx) return;

        animationFrameRef.current = requestAnimationFrame(draw);

        analyserRef.current.getByteTimeDomainData(dataArray);

        // 清空画布
        canvasCtx.clearRect(0, 0, rect.width, rect.height);

        // 设置线条样式
        canvasCtx.lineWidth = 2.5;
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
        
        // 创建渐变色
        const gradient = canvasCtx.createLinearGradient(0, 0, rect.width, 0);
        if (variant === 'compact') {
          gradient.addColorStop(0, '#ef4444');
          gradient.addColorStop(0.5, '#f97316');
          gradient.addColorStop(1, '#ef4444');
        } else {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(0.5, '#ec4899');
          gradient.addColorStop(1, '#a855f7');
        }
        canvasCtx.strokeStyle = gradient;

        // 开始绘制路径
        canvasCtx.beginPath();

        const sliceWidth = rect.width / bufferLength;
        let x = 0;

        // 使用二次贝塞尔曲线绘制平滑波形
        const points: { x: number; y: number }[] = [];
        
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * rect.height) / 2;
          points.push({ x, y });
          x += sliceWidth;
        }

        // 绘制平滑曲线
        if (points.length > 0) {
          canvasCtx.moveTo(points[0].x, points[0].y);

          for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            canvasCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }

          // 最后一个点
          if (points.length > 1) {
            canvasCtx.quadraticCurveTo(
              points[points.length - 1].x,
              points[points.length - 1].y,
              points[points.length - 1].x,
              points[points.length - 1].y
            );
          }
        }

        canvasCtx.stroke();

        // 添加微妙的辉光效果
        if (variant === 'compact') {
          canvasCtx.shadowBlur = 8;
          canvasCtx.shadowColor = 'rgba(239, 68, 68, 0.3)';
        } else {
          canvasCtx.shadowBlur = 10;
          canvasCtx.shadowColor = 'rgba(168, 85, 247, 0.3)';
        }
        canvasCtx.stroke();
      };

      draw();
    } catch (error) {
      console.error('❌ 波形可视化初始化失败:', error);
    }

    // ⭐ 清理函数 - 确保每次都正确清理
    return () => {
      console.log('🧹 清理波形可视化资源...');
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
          sourceRef.current = null;
          console.log('✅ AudioSource 已断开');
        } catch (e) {
          console.warn('⚠️ AudioSource 断开失败:', e);
        }
      }
      
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
          console.log('✅ AudioContext 已关闭');
        } catch (e) {
          console.warn('⚠️ AudioContext 关闭失败:', e);
        }
      }
      
      if (canvasForCleanup && canvasForCleanup.getContext('2d')) {
        const ctx = canvasForCleanup.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasForCleanup.width, canvasForCleanup.height);
        }
      }
      
      console.log('✅ 波形可视化资源清理完成');
    };
  }, [isSupported, stream, isRecording, variant]);

  if (!isSupported || !stream || !isRecording) {
    return null;
  }

  const height = variant === 'compact' ? 'h-16' : 'h-24';

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-lg backdrop-blur-sm",
        variant === 'compact' 
          ? 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/20' 
          : 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20',
        height,
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}

