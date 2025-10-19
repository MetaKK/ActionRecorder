"use client";

import React from "react";
import { ChatGPTEnhancedChat } from "./chatgpt-enhanced-chat";
import { getModelById } from "@/lib/ai/config";
import { isDoubaoModel, isOpenAIModel, isAnthropicModel, isPerplexityModel } from "@/lib/ai/sse-parser";

interface SmartChatWrapperProps {
  chatId: string;
  selectedModel?: string;
}

/**
 * 智能聊天组件包装器
 * 根据模型类型选择最适合的聊天组件
 */
export function SmartChatWrapper({ chatId, selectedModel = "gpt-4o-mini" }: SmartChatWrapperProps) {
  const modelConfig = getModelById(selectedModel);
  
  // 根据模型类型选择组件
  const renderChatComponent = () => {
    if (isDoubaoModel(selectedModel)) {
      // 豆包模型使用增强版聊天组件
      console.log('[Smart Chat] 使用豆包专用聊天组件');
      return <ChatGPTEnhancedChat chatId={chatId} />;
    }
    
    if (isOpenAIModel(selectedModel)) {
      // OpenAI模型使用标准聊天组件
      console.log('[Smart Chat] 使用OpenAI标准聊天组件');
      return <ChatGPTEnhancedChat chatId={chatId} />;
    }
    
    if (isAnthropicModel(selectedModel)) {
      // Anthropic模型使用标准聊天组件
      console.log('[Smart Chat] 使用Anthropic标准聊天组件');
      return <ChatGPTEnhancedChat chatId={chatId} />;
    }
    
    if (isPerplexityModel(selectedModel)) {
      // Perplexity模型使用标准聊天组件
      console.log('[Smart Chat] 使用Perplexity标准聊天组件');
      return <ChatGPTEnhancedChat chatId={chatId} />;
    }
    
    // 默认使用增强版聊天组件
    console.log('[Smart Chat] 使用默认增强版聊天组件');
    return <ChatGPTEnhancedChat chatId={chatId} />;
  };

  return (
    <div className="smart-chat-wrapper">
      {renderChatComponent()}
    </div>
  );
}
