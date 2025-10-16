"use client";

import { ImmersiveContainer } from "@/components/immersive-container";
import { ImmersiveIframe } from "@/components/immersive-iframe";

/**
 * 示例：嵌入外部网页的沉浸式页面
 * 
 * 这个示例展示如何使用 ImmersiveContainer 和 ImmersiveIframe
 * 来创建一个完全沉浸式的外部内容体验
 * 
 * 使用方法：
 * 1. 修改下面的 src 为你想要嵌入的网址
 * 2. 调整 ImmersiveContainer 的配置
 * 3. 在 ai-chat-button.tsx 中添加这个页面到插件列表
 */
export default function ImmersiveExamplePage() {
  return (
    <ImmersiveContainer
      showBackButton={true}
      backButtonPosition="top-right"
      showEmotionCharacter={false}  // 外部页面通常不需要显示情绪小人
      fullImmersive={true}           // 完全沉浸模式，隐藏所有 UI
      backRoute="/"
    >
      <ImmersiveIframe
        // 示例：嵌入一个放松的自然场景网站
        // 你可以替换为任何支持 iframe 嵌入的网站
        src="https://asoftmurmur.com/"
        title="放松音效"
        allowFullscreen={true}
        sandbox="allow-scripts allow-same-origin allow-forms"
        loadingText="正在加载放松环境..."
      />
    </ImmersiveContainer>
  );
}

