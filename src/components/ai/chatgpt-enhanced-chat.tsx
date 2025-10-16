"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bot, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { AIChatHeader } from "./ai-chat-header";
import { ChatGPTMessage } from "./chatgpt-message";
import { AIInputMinimal } from "./ai-input-minimal";

interface ChatGPTEnhancedChatProps {
  chatId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatGPTEnhancedChat({ chatId }: ChatGPTEnhancedChatProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAIMessage, setCurrentAIMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{file: File, preview: string, type: 'image' | 'file'}[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从本地存储加载聊天历史
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${chatId}`);
    const savedModel = localStorage.getItem(`chat_model_${chatId}`);
    const savedApiKey = sessionStorage.getItem(`api_key`);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
    
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [chatId]);

  // 保存聊天历史到本地存储
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  // 保存模型选择
  useEffect(() => {
    localStorage.setItem(`chat_model_${chatId}`, selectedModel);
  }, [selectedModel, chatId]);

  // 保存API Key到sessionStorage
  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem(`api_key`, apiKey);
    }
  }, [apiKey]);


  // 使用现有的AI聊天Hook
  const {
    currentSession,
    uploadImage,
    uploadFile,
    exportChat,
    shareChat,
  } = useAIChat({ chatId, selectedModel });

  // 自动滚动到最新消息
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAIMessage, scrollToBottom]);




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
      // 调用真实的AI API
      const response = await fetch('/ai/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }), // 如果有自定义API Key，添加到header
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('AI API request failed');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let currentText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // 直接累加文本内容
          currentText += chunk;
          setCurrentAIMessage(currentText);
        }
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
  }, [input, isSending, apiKey, messages, selectedModel]);

  // 处理文件上传
  const handleFileUpload = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      uploadImage?.(file);
    } else {
      uploadFile?.(file);
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setPreviewFiles(prev => [...prev, {
        file,
        preview,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      }]);
    };
    reader.readAsDataURL(file);
  }, [uploadImage, uploadFile]);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // 移除预览文件
  const removePreview = useCallback((index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Header相关处理函数
  const handleExportChat = useCallback(() => {
    exportChat?.();
  }, [exportChat]);

  const handleShareChat = useCallback(() => {
    shareChat?.();
  }, [shareChat]);

  const handleNewChat = useCallback(() => {
    window.location.href = "/ai";
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    window.location.href = `/ai/chat/${id}`;
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    // 实现删除聊天逻辑
    console.log("Delete chat:", id);
  }, []);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    // 实现重命名聊天逻辑
    console.log("Rename chat:", id, newTitle);
  }, []);


  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <AIChatHeader
        chatId={chatId}
        currentSession={currentSession}
        selectedModel={selectedModel}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportChat={handleExportChat}
        onShareChat={handleShareChat}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        hasMessages={messages.length > 0}
      />

      {/* Settings Panel - Apple Design */}
      {showSettings && (
        <div className="border-b bg-gradient-to-b from-gray-50/80 to-gray-100/40 dark:from-gray-900/80 dark:to-gray-800/40 backdrop-blur-xl px-4 py-3">
          {/* 关闭按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200/60 dark:bg-gray-700/60 hover:bg-gray-300/80 dark:hover:bg-gray-600/80 transition-all duration-200 group"
            >
              <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="space-y-4">
            {/* 模型选择 - Apple风格 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800 dark:text-gray-200 tracking-wide">
                选择模型
              </label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 10px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="gpt-4o">GPT-4o (最新)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (推荐)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            </div>

            {/* API Key 输入 - Apple风格 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800 dark:text-gray-200 tracking-wide">
                自定义 API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="留空则使用环境变量中的key"
                  className="w-full px-3 py-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                />
                {apiKey && (
                  <button
                    onClick={() => setApiKey("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200/80 dark:bg-gray-600/80 hover:bg-gray-300/90 dark:hover:bg-gray-500/90 flex items-center justify-center transition-all duration-200"
                  >
                    <svg className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                仅保存在浏览器会话中，刷新后需重新输入
              </p>
            </div>
          </div>
        </div>
      )}

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
      <div className="flex-shrink-0 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* 文件预览 */}
          {previewFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {previewFiles.map((item, index) => (
                <div key={index} className="relative group">
                  {item.type === 'image' ? (
                    <div className="relative">
                      <Image
                        src={item.preview}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePreview(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded border">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm truncate max-w-20">{item.file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => removePreview(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 使用优化的单行输入组件 */}
          <AIInputMinimal
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isSending}
            onVoiceResult={(text) => setInput(prev => prev + text)}
            onVoiceError={(error) => console.error("Voice error:", error)}
            placeholder="询问任何问题..."
          />
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isSending}
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isSending}
      />
    </div>
  );
}
