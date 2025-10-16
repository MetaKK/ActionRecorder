"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark.css";

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
          "max-w-[80%] rounded-2xl px-4 py-3 relative overflow-hidden",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        )}
      >
        {/* Message Text */}
        {isAssistant ? (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // 段落
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed">
                    {children}
                  </p>
                ),
                
                // 标题
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mb-3 mt-4 first:mt-0 border-b border-gray-300/20 dark:border-gray-600/20 pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">
                    {children}
                  </h3>
                ),
                
                // 列表
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-5 mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">
                    {children}
                  </li>
                ),
                
                // 代码块
                code: ({ inline, className, children, ...props }: {
                  inline?: boolean;
                  className?: string;
                  children?: React.ReactNode;
                }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  
                  if (!inline && match) {
                    const language = match[1];
                    return (
                      <div className="my-3 overflow-hidden rounded-lg border border-gray-300/30 dark:border-gray-600/30">
                        <div className="flex items-center justify-between bg-gray-200/50 dark:bg-gray-700/50 px-3 py-2 border-b border-gray-300/30 dark:border-gray-600/30">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                            {language}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                            }}
                            className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            复制
                          </button>
                        </div>
                        <div className="overflow-x-auto bg-gray-900">
                          <pre className="p-3 m-0">
                            <code className={cn("hljs", className)} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      </div>
                    );
                  }

                  // 行内代码
                  return (
                    <code 
                      className="bg-gray-200/60 dark:bg-gray-700/60 px-1.5 py-0.5 rounded text-[0.9em] font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                
                // 引用
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-400/50 dark:border-gray-500/50 pl-4 my-3 italic text-gray-700 dark:text-gray-300">
                    {children}
                  </blockquote>
                ),
                
                // 分隔线
                hr: () => (
                  <hr className="my-4 border-gray-300/30 dark:border-gray-600/30" />
                ),
                
                // 链接
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {children}
                  </a>
                ),
                
                // 强调
                strong: ({ children }) => (
                  <strong className="font-bold">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic">
                    {children}
                  </em>
                ),
                
                // 表格
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300/30 dark:border-gray-600/30">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-200/50 dark:bg-gray-700/50">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300/30 dark:border-gray-600/30 px-3 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300/30 dark:border-gray-600/30 px-3 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
        )}

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
