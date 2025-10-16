"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot } from "lucide-react";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { ChatGPTInput } from "./chatgpt-input";
import { ChatGPTMessage } from "./chatgpt-message";

interface ChatGPTMobileChatProps {
  chatId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatGPTMobileChat({ chatId }: ChatGPTMobileChatProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAIMessage, setCurrentAIMessage] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用现有的AI聊天Hook
  const {
    currentSession,
  } = useAIChat({ chatId, selectedModel: "gpt-4o-mini" });

  // 自动滚动到最新消息
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAIMessage, scrollToBottom]);

  // 处理输入变化
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  // 处理提交
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setIsTyping(true);
    setCurrentAIMessage("");

    try {
      // 模拟AI响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 流式输出模拟
      const aiResponse = "这是一个模拟的AI响应。在实际应用中，这里会连接到真实的AI API。";
      let currentText = "";
      
      for (let i = 0; i < aiResponse.length; i++) {
        currentText += aiResponse[i];
        setCurrentAIMessage(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // 完成AI响应
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: currentText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentAIMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [input, isSending]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentSession?.title || "AI 助手"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isTyping ? "正在输入..." : "在线"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              你好！我是AI助手
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              有什么我可以帮助你的吗？你可以问我任何问题。
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatGPTMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
              />
            ))}

            {/* 正在输入的AI消息 */}
            {isTyping && currentAIMessage && (
              <ChatGPTMessage
                message={{
                  id: "typing",
                  role: "assistant",
                  content: currentAIMessage,
                  timestamp: new Date(),
                }}
                isTyping={true}
                isLast={true}
              />
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <ChatGPTInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isSending}
          disabled={isSending}
          placeholder="询问任何问题..."
        />
      </div>
    </div>
  );
}
