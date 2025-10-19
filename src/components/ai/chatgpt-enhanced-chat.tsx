"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bot, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { AIChatHeader } from "./ai-chat-header";
import { ChatGPTMessage } from "./chatgpt-message";
import { AIInputMinimal } from "./ai-input-minimal";
import { getModelById, CAPABILITY_NAMES, AI_MODELS } from "@/lib/ai/config";
import { AdapterFactory } from "@/lib/ai/adapters/adapter-factory";
import { generateUserContext, formatUserContext } from "@/lib/ai/user-context";
import { useRecords } from "@/lib/hooks/use-records";
import { AppleSelect } from "@/components/ui/apple-select";
import { processSSEStream } from "@/lib/ai/sse-parser";

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
  const [apiKeyError, setApiKeyError] = useState("");
  const [apiKeySource, setApiKeySource] = useState<'env' | 'custom' | 'none'>('none');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 获取用户记录
  const { records } = useRecords();

  // 检查API Key状态和来源
  const checkApiKeyStatus = useCallback(() => {
    const modelConfig = getModelById(selectedModel);
    if (!modelConfig) return;

    console.log(`[API Key] 检查模型 ${selectedModel} (${modelConfig.provider}) 的API Key状态`);

    // 先清空当前显示的API Key，避免显示其他模型的Key
    setApiKey("");

    // 检查环境变量
    const envKey = process.env[`${modelConfig.provider.toUpperCase()}_API_KEY`];
    if (envKey) {
      console.log(`[API Key] 使用环境变量Key (${modelConfig.provider})`);
      setApiKeySource('env');
      return;
    }

    // 检查自定义Key
    const customKey = sessionStorage.getItem(`api_key_${modelConfig.provider}`);
    if (customKey) {
      console.log(`[API Key] 使用自定义Key (${modelConfig.provider})`);
      setApiKey(customKey);
      setApiKeySource('custom');
      return;
    }

    console.log(`[API Key] 未找到 ${modelConfig.provider} 的API Key`);
    setApiKeySource('none');
  }, [selectedModel]);

  // 从本地存储加载聊天历史
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${chatId}`);
    const savedModel = localStorage.getItem(`chat_model_${chatId}`);
    
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
  }, [chatId]);

  // 检查API Key状态
  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]);

  // 模型切换时的特殊处理
  useEffect(() => {
    // 当模型切换时，清除错误状态
    setApiKeyError("");
    
    // 重新检查API Key状态
    checkApiKeyStatus();
  }, [selectedModel, checkApiKeyStatus]);

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

  // 保存API Key到sessionStorage - 用户输入就默认记住
  useEffect(() => {
    if (apiKey) {
      const modelConfig = getModelById(selectedModel);
      if (modelConfig) {
        // 按提供商存储API Key
        sessionStorage.setItem(`api_key_${modelConfig.provider}`, apiKey);
        console.log(`[API Key] 保存 ${modelConfig.provider} 的API Key`);
      }
    }
  }, [apiKey, selectedModel]);


  // 使用现有的AI聊天Hook
  const {
    currentSession,
    uploadImage,
    uploadFile,
    exportChat,
    shareChat,
  } = useAIChat({ chatId, selectedModel });

  // 自动滚动到最新消息
  const scrollToBottom = useCallback((immediate = false) => {
    // 方法1: 使用容器的 scrollTop (更可靠)
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: immediate ? 'auto' : 'smooth'
      });
    }
    // 方法2: 备用方案
    messagesEndRef.current?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
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
      // 生成用户上下文
      const context = generateUserContext(records);
      const userContextStr = formatUserContext(context);
      
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
          userContext: userContextStr, // 传递用户上下文
        }),
      });

      if (!response.ok) {
        // 检查是否是API key错误
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('API key not configured')) {
              setApiKeyError("需要配置API Key才能使用AI功能");
              setShowSettings(true);
              return;
            }
          } catch {
            // 如果无法解析错误响应，继续抛出错误
          }
        }
        throw new Error('AI API request failed');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      let currentText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 使用通用SSE解析器处理流数据
          processSSEStream(
            value,
            (content: string) => {
              currentText += content;
              setCurrentAIMessage(currentText);
            },
            () => {
              console.log('[Chat] 流式响应完成');
            }
          );
        }
      }

      // 检查是否有内容，如果没有则提供兜底回答
      if (!currentText.trim()) {
        const fallbackMessages = [
          "抱歉，我暂时无法生成回复。不过没关系！😊 你可以尝试重新提问，或者换个方式表达你的问题。我在这里随时为你服务！",
          "哎呀，这次我有点卡壳了... 🤔 但别担心！你可以重新发送消息，或者换个角度提问，我一定能帮到你的！",
          "看起来我需要一点时间来思考... 💭 请稍等片刻再试，或者换个方式提问，我会努力给你最好的回答！",
          "抱歉让你久等了！😅 有时候我需要一点时间来组织语言。请重新发送消息，我会给你一个满意的回复！",
          "哎呀，这次我有点'短路'了... ⚡ 不过没关系！重新发送消息，我会给你一个更好的回答！"
        ];
        
        const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
        currentText = randomFallback;
        setCurrentAIMessage(randomFallback);
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
      // 显示通用错误消息
      setApiKeyError("发送消息时出现错误，请检查网络连接或API配置");
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [input, isSending, apiKey, messages, selectedModel, records]);

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
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900" style={{ height: '100dvh' }}>
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
              <AppleSelect
                value={selectedModel}
                onChange={setSelectedModel}
                options={AI_MODELS
                  .filter(model => {
                    // 只显示适配器工厂实际支持的模型
                    const supportedProviders = AdapterFactory.getSupportedProviders();
                    return supportedProviders.includes(model.provider);
                  })
                  .map(model => ({
                    value: model.id,
                    label: model.displayName,
                    group: model.category === 'standard' ? '标准对话' : 
                           model.category === 'reasoning' ? '深度思考' :
                           model.category === 'search' ? '联网搜索' :
                           model.category === 'multimodal' ? '豆包大模型' : '其他',
                    isRecommended: model.isRecommended,
                    isNew: model.isNew
                  }))}
                placeholder="请选择AI模型..."
                className="w-full"
              />
              
              {/* 模型信息显示 */}
              {(() => {
                const modelInfo = getModelById(selectedModel);
                if (!modelInfo) return null;
                
                return (
                  <div className="mt-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-1.5">{modelInfo.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {modelInfo.capabilities.map(cap => (
                        <span 
                          key={cap}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        >
                          {CAPABILITY_NAMES[cap]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

             {/* API Key 管理 - 开发环境完全隐藏 */}
             {/* 只有在没有环境变量Key且非开发环境时才显示配置区域 */}
             {apiKeySource !== 'env' && process.env.NODE_ENV !== 'development' && (
               <div className="space-y-3">
                 {/* API Key 状态指示器 */}
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-medium text-gray-800 dark:text-gray-200 tracking-wide">
                     API Key 配置
                   </label>
                   <div className="flex items-center gap-2">
                     {apiKeySource === 'custom' && (
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 rounded-md">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <span className="text-xs font-medium text-blue-700 dark:text-blue-300">自定义</span>
                       </div>
                     )}
                     {apiKeySource === 'none' && (
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 rounded-md">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <span className="text-xs font-medium text-blue-700 dark:text-blue-300">需要配置</span>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* 智能提示信息 - 统一蓝色风格 */}
                 {apiKeySource === 'none' && (
                   <div className="mt-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40 rounded-lg">
                     <p className="text-xs text-blue-800 dark:text-blue-200 mb-1.5">
                       需要配置 API Key 才能使用AI功能
                     </p>
                     <div className="flex flex-wrap gap-1.5">
                       <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                         配置API Key
                       </span>
                       <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                         环境变量
                       </span>
                     </div>
                   </div>
                 )}

                 {/* 自定义Key状态显示 - 统一蓝色风格 */}
                 {apiKeySource === 'custom' && (
                   <div className="mt-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40 rounded-lg">
                     <p className="text-xs text-blue-800 dark:text-blue-200 mb-1.5">
                       已配置自定义 API Key，可正常使用AI功能
                     </p>
                     <div className="flex flex-wrap gap-1.5">
                       <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                         自定义Key
                       </span>
                       <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                         已配置
                       </span>
                     </div>
                   </div>
                 )}

                 {/* API Key 输入框 */}
                 <div className="space-y-2">
                   <div className="relative">
                     <input
                       type="password"
                       value={apiKey}
                       onChange={(e) => {
                         setApiKey(e.target.value);
                         setApiKeyError("");
                         if (e.target.value) {
                           setApiKeySource('custom');
                         }
                       }}
                       placeholder="输入您的 API Key"
                       className={`w-full px-3 py-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md ${
                         apiKeyError ? 'border-red-300 dark:border-red-600' : 'border-gray-200/60 dark:border-gray-600/60'
                       }`}
                     />
                     {apiKey && (
                       <button
                         onClick={() => {
                           setApiKey("");
                           setApiKeyError("");
                           checkApiKeyStatus();
                         }}
                         className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200/80 dark:bg-gray-600/80 hover:bg-gray-300/90 dark:hover:bg-gray-500/90 flex items-center justify-center transition-all duration-200"
                       >
                         <svg className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                     )}
                   </div>

                   {/* API Key 错误提示 */}
                   {apiKeyError && (
                     <div className="flex items-start gap-2 p-3 bg-red-50/80 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/60 rounded-lg">
                       <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mt-0.5">
                         <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                         </svg>
                       </div>
                       <div className="flex-1">
                         <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                           API Key 错误
                         </p>
                         <p className="text-xs text-red-700 dark:text-red-300">
                           {apiKeyError}
                         </p>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}

            {/* 环境变量Key状态显示 - 简洁版本 */}
            {apiKeySource === 'env' && (
              <div className="flex items-center gap-2 p-3 bg-green-50/80 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/60 rounded-lg">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    已使用环境变量中的 API Key
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
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
            onVoiceError={(error) => console.error("Voice error:", error)}
            onInputFocus={scrollToBottom}
            onInputBlur={scrollToBottom}
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
