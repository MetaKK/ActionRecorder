"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { AIInputMinimal } from "./ai-input-minimal";
import { AIMessage } from "./ai-message";
import { AITypingIndicator } from "./ai-typing-indicator";
import { AISuggestionChips } from "./ai-suggestion-chips";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Settings,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Zap
} from "lucide-react";

interface AIChatEnhancedProps {
  chatId: string;
  selectedModel?: string;
  className?: string;
}

export function AIChatEnhanced({ 
  chatId, 
  selectedModel = "gpt-4o-mini",
  className 
}: AIChatEnhancedProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    regenerateMessage,
    deleteMessage,
    editMessage,
    clearMessages
  } = useAIChat({ chatId, selectedModel });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setInput(suggestion.text);
  };

  const handleVoiceResult = (text: string) => {
    setInput(prev => prev + text);
  };

  const handleVoiceError = (error: string) => {
    console.error("Voice error:", error);
  };

  const lastMessage = messages[messages.length - 1]?.content as string;

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header - Apple风格 */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI助手</h2>
            <p className="text-sm text-muted-foreground">智能生活记录助手</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-8 px-3 rounded-full hover:bg-muted/50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            清空
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full hover:bg-muted/50"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Notion风格 */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-4">
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                开始与AI助手对话
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                我可以帮你记录生活、分析模式、提供建议，或者聊聊任何你想分享的事情。
              </p>
              
              {/* 建议芯片 */}
              <AISuggestionChips onSuggestionClick={handleSuggestionClick} />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <AIMessage
                  key={message.id}
                  message={message}
                  onCopy={(content) => navigator.clipboard.writeText(content)}
                  onRegenerate={regenerateMessage}
                  onDelete={deleteMessage}
                  onEdit={editMessage}
                />
              ))}
              
              {/* Typing Indicator */}
              <AITypingIndicator isTyping={isTyping} />
              
              {/* Error Display */}
              {error && (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">出现错误</span>
                    </div>
                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - 使用优化的单行输入组件 */}
      <AIInputMinimal
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onVoiceResult={handleVoiceResult}
        onVoiceError={handleVoiceError}
        lastMessage={lastMessage}
        placeholder="询问任何问题..."
        className="border-t border-border/20 bg-background/95 backdrop-blur-sm"
      />
    </div>
  );
}
