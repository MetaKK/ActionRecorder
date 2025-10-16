"use client";

import { useSearchParams } from "next/navigation";
import { ImmersiveContainer } from "@/components/immersive-container";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function IframePage() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title');
  const [decodedUrl, setDecodedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (url) {
      setDecodedUrl(decodeURIComponent(url));
    }
  }, [url]);

  if (!decodedUrl) {
    return (
      <ImmersiveContainer
        showBackButton={true}
        backButtonPosition="top-left"
        showEmotionCharacter={true}
        backRoute="/"
      >
        <div className="flex flex-col items-center justify-center h-screen text-gray-400">
          <div className="text-6xl mb-4">🔗</div>
          <p className="text-lg">未提供有效的链接</p>
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
      <div className="relative w-full h-screen bg-gray-50 dark:bg-gray-900">
        {/* 加载状态 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 z-10"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-6xl mb-4"
            >
              🌐
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-600 dark:text-gray-400"
            >
              正在加载 {title || '外部内容'}...
            </motion.p>
          </motion.div>
        )}

        {/* iframe */}
        <iframe
          src={decodedUrl}
          className="w-full h-full border-0"
          title={title || "External Content"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </ImmersiveContainer>
  );
}

