"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AIMessage } from "./ai-message";
import { AIInput } from "./ai-input";
import { AIModelSelector } from "./ai-model-selector";
import { AIChatHistory } from "./ai-chat-history";
import { AI_WELCOME_MESSAGE, AI_ERROR_MESSAGES } from "@/lib/ai/prompts";
import { AI_MODELS } from "@/lib/ai/providers";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Settings, 
  Download, 
  Share2
} from "lucide-react";
import { toast } from "sonner";

// 定义消息类型
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// 定义聊天会话类型
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatProps {
  chatId: string;
}

export function AIChat({ chatId: _chatId }: AIChatProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 加载聊天会话
  useEffect(() => {
    const savedSessions = localStorage.getItem("ai-chat-sessions");
    if (savedSessions) {
      try {
        const sessions: ChatSession[] = JSON.parse(savedSessions).map((session: ChatSession & { createdAt: string; updatedAt: string }) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }));
        const session = sessions.find(s => s.id === _chatId);
        if (session) {
          setCurrentSession(session);
          setMessages(session.messages);
        }
      } catch (error) {
        console.error("Failed to load chat session:", error);
      }
    }
  }, [_chatId]);

  // 保存聊天会话
  const saveSession = (newMessages: Message[], title?: string) => {
    const session: ChatSession = {
      id: _chatId,
      title: title || currentSession?.title || "新对话",
      messages: newMessages,
      createdAt: currentSession?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentSession(session);
    
    // 保存到localStorage
    const savedSessions = localStorage.getItem("ai-chat-sessions");
    let sessions: ChatSession[] = [];
    if (savedSessions) {
      try {
        sessions = JSON.parse(savedSessions).map((s: ChatSession & { createdAt: string; updatedAt: string }) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      } catch (error) {
        console.error("Failed to parse saved sessions:", error);
      }
    }
    
    const existingIndex = sessions.findIndex(s => s.id === _chatId);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem("ai-chat-sessions", JSON.stringify(sessions));
  };

  // 如果没有消息，显示欢迎消息
  const displayMessages = messages.length === 0 
    ? [{ id: "welcome", role: "assistant" as const, content: AI_WELCOME_MESSAGE }]
    : messages;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    // 如果是第一条消息，生成标题
    if (messages.length === 0) {
      const title = input.length > 20 ? input.slice(0, 20) + "..." : input;
      saveSession(newMessages, title);
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                const updatedMessages = finalMessages.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantContent }
                    : msg
                );
                setMessages(updatedMessages);
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }

      // 保存最终消息
      const finalMessagesWithContent = finalMessages.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: assistantContent }
          : msg
      );
      saveSession(finalMessagesWithContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("发送消息失败，请检查网络连接");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === "user") {
        setInput(userMessage.content);
        setMessages(prev => prev.slice(0, messageIndex));
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    saveSession(messages.filter(msg => msg.id !== messageId));
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setInput(content);
    handleDeleteMessage(messageId);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板");
  };

  // 语音处理函数
  const handleVoiceResult = (text: string) => {
    setInput(text);
  };

  const handleVoiceError = (error: string) => {
    toast.error(error);
  };

  const handleVoiceStart = () => {
    // 语音开始处理
  };

  const handleVoiceStop = () => {
    // 语音停止处理
  };

  // 获取最后一条AI消息用于语音播放
  const getLastAIMessage = () => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === "assistant" ? lastMessage.content : undefined;
  };

  const handleExportChat = () => {
    const chatContent = messages.map(msg => 
      `**${msg.role === "user" ? "用户" : "AI"}**: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-${_chatId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("聊天记录已导出");
  };

  const handleShareChat = async () => {
    const chatContent = messages.map(msg => 
      `**${msg.role === "user" ? "用户" : "AI"}**: ${msg.content}`
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
  };

  const handleNewChat = () => {
    router.push("/ai");
  };

  const handleSelectChat = (chatId: string) => {
    router.push(`/ai/chat/${chatId}`);
  };

  const handleDeleteChat = (chatId: string) => {
    if (chatId === _chatId) {
      router.push("/ai");
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    if (chatId === _chatId) {
      setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };


  const handleImageUpload = () => {
    toast.info("图片上传功能开发中...");
  };

  const handleFileUpload = () => {
    toast.info("文件上传功能开发中...");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {currentSession?.title || "AI 助手"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {AI_MODELS.find(m => m.id === selectedModel)?.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <AIChatHistory
            currentChatId={_chatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportChat}
            disabled={messages.length === 0}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareChat}
            disabled={messages.length === 0}
            className="h-8 w-8 p-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-muted/50 px-4 py-3">
          <AIModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {displayMessages.map((message) => (
            <AIMessage
              key={message.id}
              message={message}
              isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
              onCopy={handleCopyMessage}
              onRegenerate={handleRegenerate}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
            />
          ))}
          
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {AI_ERROR_MESSAGES.UNKNOWN_ERROR}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <AIInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
            onVoiceStart={handleVoiceStart}
            onVoiceStop={handleVoiceStop}
            onVoiceResult={handleVoiceResult}
            onVoiceError={handleVoiceError}
            onImageUpload={handleImageUpload}
            onFileUpload={handleFileUpload}
            lastMessage={getLastAIMessage()}
          />
        </div>
      </div>
    </div>
  );
}
