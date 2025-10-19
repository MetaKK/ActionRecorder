/*
 * @Author: meta-kk 11097094+teacher-kk@user.noreply.gitee.com
 * @Date: 2025-10-16 19:28:35
 * @LastEditors: MetaKK metakk@example.com
 * @LastEditTime: 2025-10-20 00:33:41
 * @FilePath: /life-recorder/src/app/window/page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client";

import { ImmersiveContainer } from "@/components/immersive-container";
import { WindowTravelOptimized as WindowTravelView, TravelContent, WindowFrame } from "@/components/window-travel-optimized";

/**
 * 沉浸式窗口旅行视频页面
 * 
 * 特性：
 * - 上下滑动切换旅行视频
 * - 左右滑动切换窗口框架
 * - 双层结构：底层视频 + 上层窗口图片
 * - 预加载优化，流畅切换
 */

// 默认旅行视频配置
const DEFAULT_VIDEOS: TravelContent[] = [
  {
    id: "video-1",
    videoUrl: "/videos/travel-1.mp4",
    title: "横滨夜晚",
    location: "日本横滨",
  },
  {
    id: "video-2",
    videoUrl: "/videos/travel-2.mp4",
    title: "东京雨夜",
    location: "日本东京",
  },
  {
    id: "video-3",
    videoUrl: "/videos/travel-3.mp4",
    title: "圣托里尼",
    location: "希腊圣托里尼",
  },
];

// 默认窗口框架配置
const DEFAULT_WINDOW_FRAMES: WindowFrame[] = [
  {
    id: "window-1",
    imageUrl: "/img/window-frame-1.png",
    name: "飞机窗口",
  },
  {
    id: "window-2",
    imageUrl: "/img/window-frame-2.png",
    name: "复古豪华窗口",
  }
];

export default function WindowPage() {
  return (
    <ImmersiveContainer
      showBackButton={true}
      backButtonPosition="top-left"
      showEmotionCharacter={false}
      backRoute="/"
    >
      <WindowTravelView
        videos={DEFAULT_VIDEOS}
        windowFrames={DEFAULT_WINDOW_FRAMES}
        autoPlay={true}
        loop={true}
      />
    </ImmersiveContainer>
  );
}

