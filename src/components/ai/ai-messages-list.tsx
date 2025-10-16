"use client";

import React, { memo, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIMessageOptimized } from "./ai-message-optimized";
import { AI_WELCOME_MESSAGE, AI_ERROR_MESSAGES } from "@/lib/ai/prompts";
import type { Message, MessageContent } from "@/lib/hooks/use-ai-chat";

interface AIMessagesListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onCopy: (content: string | MessageContent[]) => void;
  onRegenerate: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
}

export const AIMessagesList = memo(function AIMessagesList({
  messages,
  isLoading,
  error,
  onCopy,
  onRegenerate,
  onDelete,
  onEdit,
}: AIMessagesListProps) {
  // 使用useMemo优化显示消息的计算
  const displayMessages = useMemo(() => {
    return messages.length === 0 
      ? [{ id: "welcome", role: "assistant" as const, content: AI_WELCOME_MESSAGE }]
      : messages;
  }, [messages]);

  // 获取最后一条消息的ID用于加载状态
  const lastMessageId = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1].id : null;
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {displayMessages.map((message) => (
          <AIMessageOptimized
            key={message.id}
            message={message}
            isLoading={isLoading && message.id === lastMessageId}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onEdit={onEdit}
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
  );
});
