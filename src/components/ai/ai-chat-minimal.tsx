"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AIInputMinimal } from "./ai-input-minimal";
import { AIMessage } from "./ai-message";
import { AITypingIndicator } from "./ai-typing-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIChatMinimalProps {
  chatId: string;
  className?: string;
}

export function AIChatMinimal({ 
  chatId, 
  className 
}: AIChatMinimalProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Typing indicator
  useEffect(() => {
    if (isLoading) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: value,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // 模拟AI响应
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `我收到了你的消息："${value}"。这是一个模拟的AI响应。`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleVoiceResult = (text: string) => {
    setInput(prev => prev + text);
  };

  const handleVoiceError = (error: string) => {
    console.error("Voice error:", error);
  };

  const lastMessage = messages[messages.length - 1]?.content;

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header - 简洁设计 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI助手</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">智能对话</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            className="h-7 px-2 text-xs rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            清空
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-3 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-3">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                开始对话
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                我可以帮你回答问题、提供建议或进行有趣的对话。
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <AIMessage
                  key={message.id}
                  message={message}
                  onCopy={(content) => navigator.clipboard.writeText(content)}
                />
              ))}
              
              {/* Typing Indicator */}
              <AITypingIndicator isTyping={isTyping} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* 精致的单行输入 */}
      <AIInputMinimal
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onVoiceResult={handleVoiceResult}
        onVoiceError={handleVoiceError}
        lastMessage={lastMessage}
        placeholder="询问任何问题..."
      />
    </div>
  );
}
