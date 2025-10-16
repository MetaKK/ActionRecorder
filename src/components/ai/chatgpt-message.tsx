"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

interface ChatGPTMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  };
  isTyping?: boolean;
  isLast?: boolean;
}

export function ChatGPTMessage({ message, isTyping = false }: ChatGPTMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar - 使用情绪小人图片 */}
      {isAssistant && (
        <Image
          src="/img/9ade71d75a1c0e93.png"
          alt="AI助手"
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border/20 shadow-md"
        />
      )}
      
      {/* Message Content */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 relative",
          "[&_*]:!m-0 [&_p]:!m-0 [&_ul]:!m-0 [&_ol]:!m-0", // 强制移除所有margin
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        )}
      >
        {/* Message Text */}
        <div className="prose prose-sm max-w-none dark:prose-invert [&_*]:!m-0 [&_p]:!m-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Typing Indicator */}
        {isTyping && isAssistant && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
