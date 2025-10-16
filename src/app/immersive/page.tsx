"use client";

import { useSearchParams } from "next/navigation";
import { ImmersiveContainer } from "@/components/immersive-container";
import { ImmersiveContent, ImmersiveContentConfig } from "@/components/immersive-content";
import { useEffect, useState } from "react";

/**
 * 通用沉浸式内容页面
 * 
 * 支持的内容类型：
 * 1. 图片 + 音乐
 * 2. 图片
 * 3. 视频
 * 4. 视频 + 音乐
 * 
 * URL参数：
 * - type: 内容类型 (image, video, image+music, video+music)
 * - imageUrl: 图片URL
 * - videoUrl: 视频URL
 * - audioUrl: 音频URL
 * - title: 标题
 * - description: 描述
 * - autoPlay: 是否自动播放 (true/false)
 * - loop: 是否循环 (true/false)
 * - muted: 是否静音 (true/false)
 * - volume: 音量 (0-1)
 */
export default function ImmersiveContentPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<ImmersiveContentConfig | null>(null);

  useEffect(() => {
    const type = searchParams.get('type') as ImmersiveContentConfig['type'] || 'image';
    const imageUrl = searchParams.get('imageUrl');
    const videoUrl = searchParams.get('videoUrl');
    const audioUrl = searchParams.get('audioUrl');
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const autoPlay = searchParams.get('autoPlay') === 'true';
    const loop = searchParams.get('loop') === 'true';
    const muted = searchParams.get('muted') === 'true';
    const volume = parseFloat(searchParams.get('volume') || '0.7');

    // 验证必需参数
    if (type === 'image' && !imageUrl) {
      console.error('图片类型需要提供 imageUrl 参数');
      return;
    }
    if (type === 'video' && !videoUrl) {
      console.error('视频类型需要提供 videoUrl 参数');
      return;
    }
    if (type === 'image+music' && (!imageUrl || !audioUrl)) {
      console.error('图片+音乐类型需要提供 imageUrl 和 audioUrl 参数');
      return;
    }
    if (type === 'video+music' && (!videoUrl || !audioUrl)) {
      console.error('视频+音乐类型需要提供 videoUrl 和 audioUrl 参数');
      return;
    }

    setConfig({
      type,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
      audioUrl: audioUrl || undefined,
      title: title || undefined,
      description: description || undefined,
      autoPlay,
      loop,
      muted,
      volume,
    });
  }, [searchParams]);

  if (!config) {
    return (
      <ImmersiveContainer
        showBackButton={true}
        backButtonPosition="top-left"
        showEmotionCharacter={true}
        backRoute="/"
      >
        <div className="flex flex-col items-center justify-center h-screen text-gray-400">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg">配置参数错误</p>
          <p className="text-sm mt-2 opacity-70">请检查URL参数是否正确</p>
        </div>
      </ImmersiveContainer>
    );
  }

  return (
    <ImmersiveContainer
      showBackButton={true}
      backButtonPosition="top-left"
      showEmotionCharacter={true}
      backRoute="/"
    >
      <ImmersiveContent config={config} />
    </ImmersiveContainer>
  );
}