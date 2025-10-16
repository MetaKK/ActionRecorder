"use client";

import React, { memo } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIMultimodalMessage } from "./ai-multimodal-message";
import { AIMessageActions } from "./ai-message-actions";
import { formatMessageTime } from "@/lib/ai/utils";
import type { Message, MessageContent } from "@/lib/hooks/use-ai-chat";

interface AIMessageOptimizedProps {
  message: Message;
  isLoading?: boolean;
  onCopy?: (content: string | MessageContent[]) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
}

export const AIMessageOptimized = memo(function AIMessageOptimized({
  message,
  isLoading = false,
  onCopy,
  onRegenerate,
  onDelete,
  onEdit,
}: AIMessageOptimizedProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "group flex gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar - 只显示AI头像，用户消息不显示头像 */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm relative group/message",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isLoading && isAssistant ? (
            <div className="space-y-2">
              <div className="animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <AIMultimodalMessage content={message.content} />
          )}

          {/* Message Actions */}
          <AIMessageActions
            message={message}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
        
        {message.timestamp && (
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
});
