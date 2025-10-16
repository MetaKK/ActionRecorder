"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { AIChatHeader } from "./ai-chat-header";
import { AIMessagesList } from "./ai-messages-list";
import { AIInputOptimized } from "./ai-input-optimized";
import { AIModelSelector } from "./ai-model-selector";
import { StorageStatus } from "./storage-status";
import { useStorageInit } from "@/lib/storage/init-storage";

interface AIChatOptimizedProps {
  chatId: string;
}

export function AIChatOptimized({ chatId }: AIChatOptimizedProps) {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState("");

  // 初始化存储配置
  useStorageInit();

  // 使用优化的AI聊天Hook
  const {
    messages,
    currentSession,
    isLoading,
    error,
    sendMessage,
    regenerateMessage,
    deleteMessage,
    editMessage,
    copyMessage,
    uploadImage,
    uploadFile,
    exportChat,
    shareChat,
    getLastAIMessage,
  } = useAIChat({ chatId, selectedModel });

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // 处理提交
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input;
    setInput("");
    await sendMessage(content);
  }, [input, isLoading, sendMessage]);

  // 处理语音结果
  const handleVoiceResult = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    console.error("Voice error:", error);
  }, []);

  // 处理聊天操作
  const handleSelectChat = useCallback((id: string) => {
    router.push(`/ai/chat/${id}`);
  }, [router]);

  const handleNewChat = useCallback(() => {
    router.push("/ai");
  }, [router]);

  const handleDeleteChat = useCallback((id: string) => {
    if (id === chatId) {
      router.push("/ai");
    }
  }, [chatId, router]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    // 这里可以添加重命名逻辑
    console.log("Rename chat:", id, newTitle);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <AIChatHeader
        chatId={chatId}
        currentSession={currentSession}
        selectedModel={selectedModel}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportChat={exportChat}
        onShareChat={shareChat}
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

      {/* Messages */}
      <AIMessagesList
        messages={messages}
        isLoading={isLoading}
        error={error}
        onCopy={copyMessage}
        onRegenerate={regenerateMessage}
        onDelete={deleteMessage}
        onEdit={editMessage}
      />

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <AIInputOptimized
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
            onVoiceResult={handleVoiceResult}
            onVoiceError={handleVoiceError}
            onImageUpload={uploadImage}
            onFileUpload={uploadFile}
            lastMessage={getLastAIMessage()}
          />
        </div>
      </div>
    </div>
  );
}
