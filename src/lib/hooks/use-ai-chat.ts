"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useEnhancedChatStorage } from "@/lib/storage/enhanced-storage";
import { processSSEStream } from "@/lib/ai/sse-parser";

// 类型定义
export interface MessageContent {
  type: "text" | "image" | "file";
  content: string;
  url?: string;
  name?: string;
  size?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | MessageContent[];
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface UseAIChatOptions {
  chatId: string;
  selectedModel: string;
}

interface UseAIChatReturn {
  // 状态
  messages: Message[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // 操作
  sendMessage: (content: string) => Promise<void>;
  regenerateMessage: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, content: string) => void;
  copyMessage: (content: string | MessageContent[]) => void;
  uploadImage: (file: File) => void;
  uploadFile: (file: File) => void;
  exportChat: () => void;
  shareChat: () => Promise<void>;
  
  // 工具函数
  getLastAIMessage: () => string | undefined;
}

export function useAIChat({ chatId, selectedModel }: UseAIChatOptions): UseAIChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { loadSessions, saveSession: saveSessionToStorage } = useEnhancedChatStorage();

  // 加载会话
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessions = await loadSessions();
        const session = sessions.find(s => s.id === chatId);
        if (session) {
          setCurrentSession(session);
          setMessages(session.messages);
        }
      } catch (error) {
        console.error("Failed to load chat session:", error);
      }
    };

    loadSession();
  }, [chatId, loadSessions]);

  // 保存会话到存储
  const saveSession = useCallback(async (newMessages: Message[], title?: string) => {
    const session: ChatSession = {
      id: chatId,
      title: title || currentSession?.title || "新对话",
      messages: newMessages,
      createdAt: currentSession?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentSession(session);
    await saveSessionToStorage(session);
  }, [chatId, currentSession, saveSessionToStorage]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    // 如果是第一条消息，生成标题
    if (messages.length === 0) {
      const title = content.length > 20 ? content.slice(0, 20) + "..." : content;
      await saveSession(newMessages, title);
    }

    try {
      const response = await fetch("/ai/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let assistantContent = "";
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // 流式处理响应
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 使用通用SSE解析器处理流数据
        processSSEStream(
          value,
          (content: string) => {
            assistantContent += content;
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: assistantContent }
                : msg
            ));
          },
          () => {
            console.log('[AI Chat] 流式响应完成');
          }
        );
      }

      // 保存最终消息
      const finalMessagesWithContent = finalMessages.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: assistantContent }
          : msg
      );
      await saveSession(finalMessagesWithContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("发送消息失败，请检查网络连接");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, selectedModel, saveSession]);

  // 重新生成消息
  const regenerateMessage = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === "user") {
        const content = typeof userMessage.content === 'string' 
          ? userMessage.content 
          : userMessage.content.find(c => c.type === 'text')?.content || '';
        sendMessage(content);
        setMessages(prev => prev.slice(0, messageIndex));
      }
    }
  }, [messages, sendMessage]);

  // 删除消息
  const deleteMessage = useCallback(async (messageId: string) => {
    const newMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(newMessages);
    await saveSession(newMessages);
  }, [messages, saveSession]);

  // 编辑消息
  const editMessage = useCallback((messageId: string) => {
    deleteMessage(messageId);
    // 这里可以触发重新发送，但需要父组件处理
  }, [deleteMessage]);

  // 复制消息
  const copyMessage = useCallback((content: string | MessageContent[]) => {
    const textContent = typeof content === 'string' 
      ? content 
      : content.find(c => c.type === 'text')?.content || '';
    navigator.clipboard.writeText(textContent);
    toast.success("已复制到剪贴板");
  }, []);

  // 上传图片
  const uploadImage = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      const imageContent: MessageContent = {
        type: "image",
        content: imageUrl,
        url: imageUrl,
        name: file.name,
        size: file.size,
      };
      
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: [imageContent],
        timestamp: new Date(),
      };
      
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);
      await saveSession(newMessages);
    };
    reader.readAsDataURL(file);
    toast.success("图片已上传");
  }, [messages, saveSession]);

  // 上传文件
  const uploadFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileUrl = e.target?.result as string;
      const fileContent: MessageContent = {
        type: "file",
        content: fileUrl,
        url: fileUrl,
        name: file.name,
        size: file.size,
      };
      
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: [fileContent],
        timestamp: new Date(),
      };
      
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);
      await saveSession(newMessages);
    };
    reader.readAsDataURL(file);
    toast.success("文件已上传");
  }, [messages, saveSession]);

  // 导出聊天
  const exportChat = useCallback(() => {
    const chatContent = messages.map(msg => 
      `**${msg.role === "user" ? "用户" : "AI"}**: ${
        typeof msg.content === 'string'
          ? msg.content
          : msg.content.map(c => c.type === 'text' ? c.content : `[${c.type}: ${c.name || c.url}]`).join(' ')
      }`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-${chatId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("聊天记录已导出");
  }, [messages, chatId]);

  // 分享聊天
  const shareChat = useCallback(async () => {
    const chatContent = messages.map(msg => 
      `**${msg.role === "user" ? "用户" : "AI"}**: ${
        typeof msg.content === 'string'
          ? msg.content
          : msg.content.map(c => c.type === 'text' ? c.content : `[${c.type}: ${c.name || c.url}]`).join(' ')
      }`
    ).join('\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI聊天记录",
          text: chatContent,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(chatContent);
      toast.success("聊天记录已复制到剪贴板");
    }
  }, [messages]);

  // 获取最后一条AI消息
  const getLastAIMessage = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      return typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : lastMessage.content.find(c => c.type === 'text')?.content || '';
    }
    return undefined;
  }, [messages]);

  return {
    // 状态
    messages,
    currentSession,
    isLoading,
    error,
    
    // 操作
    sendMessage,
    regenerateMessage,
    deleteMessage,
    editMessage,
    copyMessage,
    uploadImage,
    uploadFile,
    exportChat,
    shareChat,
    
    // 工具函数
    getLastAIMessage,
  };
}
