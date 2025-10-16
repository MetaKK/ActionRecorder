"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { AIChatHeader } from "./ai-chat-header";
import { AIModelSelector } from "./ai-model-selector";
import { StorageStatus } from "./storage-status";
import { useStorageInit } from "@/lib/storage/init-storage";
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
  const [showSettings, setShowSettings] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{file: File, preview: string, type: 'image' | 'file'}[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化存储配置
  useStorageInit();

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

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-muted/50 px-4 py-3 space-y-4">
          <AIModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <StorageStatus className="max-w-md" />
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
                      <img
                        src={item.preview}
                        alt=""
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
