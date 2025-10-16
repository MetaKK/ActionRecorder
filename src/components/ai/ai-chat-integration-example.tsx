"use client";

import { useState } from "react";
import { AIChatEnhanced } from "./ai-chat-enhanced";
import { AIChatOptimized } from "./ai-chat-optimized";
import { ChatGPTEnhancedChat } from "./chatgpt-enhanced-chat";
import { AIChatMinimal } from "./ai-chat-minimal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * AI聊天组件集成示例
 * 展示如何在应用中使用更新后的AI聊天组件
 */
export function AIChatIntegrationExample() {
  const [selectedChat, setSelectedChat] = useState("enhanced");
  const [chatId] = useState("demo-chat-123");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI聊天组件集成示例
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            展示不同AI聊天组件的使用方式，所有组件都已集成优化的单行输入功能
          </p>
        </div>

        <Tabs value={selectedChat} onValueChange={setSelectedChat} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="enhanced">增强版</TabsTrigger>
            <TabsTrigger value="optimized">优化版</TabsTrigger>
            <TabsTrigger value="chatgpt">ChatGPT版</TabsTrigger>
            <TabsTrigger value="minimal">简洁版</TabsTrigger>
          </TabsList>

          <TabsContent value="enhanced" className="mt-4">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  AI聊天增强版
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  功能最完整的AI聊天界面，包含建议芯片、打字指示器等高级功能
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <AIChatEnhanced 
                  chatId={chatId} 
                  selectedModel="gpt-4o-mini"
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimized" className="mt-4">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  AI聊天优化版
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  平衡功能与性能的优化版本，适合大多数使用场景
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <AIChatOptimized 
                  chatId={chatId}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chatgpt" className="mt-4">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  ChatGPT风格版
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  模仿ChatGPT界面的设计风格，提供熟悉的用户体验
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <ChatGPTEnhancedChat 
                  chatId={chatId}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="minimal" className="mt-4">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  AI聊天简洁版
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  最简洁的AI聊天界面，专注于核心功能，适合轻量级应用
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <AIChatMinimal 
                  chatId={chatId}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 功能特性说明 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">单行输入</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                空间占用减少60%，提供更紧凑的界面体验
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">语音转文本</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                集成语音识别功能，支持语音输入和播放
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">精致设计</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                采用Apple设计原则，提供流畅的动画效果
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">智能功能</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                智能建议、状态指示、键盘快捷键等高级功能
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
