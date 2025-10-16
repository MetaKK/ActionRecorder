"use client";

import { useState } from "react";
import { formatMessageTime } from "@/lib/ai/utils";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, RotateCcw, Trash2, Edit3, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIMultimodalMessage } from "./ai-multimodal-message";

// 定义消息内容类型
interface MessageContent {
  type: "text" | "image" | "file";
  content: string;
  url?: string;
  name?: string;
  size?: number;
}

// 定义消息类型
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | MessageContent[];
  timestamp?: Date;
}

interface AIMessageProps {
  message: Message;
  isLoading?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
}

export function AIMessage({ 
  message, 
  isLoading = false, 
  onCopy,
  onRegenerate,
  onDelete,
  onEdit 
}: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleCopy = async () => {
    const textContent = typeof message.content === 'string' 
      ? message.content 
      : message.content.find(c => c.type === 'text')?.content || '';
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(textContent);
  };

  const handleRegenerate = () => {
    onRegenerate?.(message.id);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
  };

  const handleEdit = () => {
    const textContent = typeof message.content === 'string' 
      ? message.content 
      : message.content.find(c => c.type === 'text')?.content || '';
    onEdit?.(message.id, textContent);
  };

  return (
    <div
      className={cn(
        "group flex gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

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
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : isAssistant ? (
            <AIMultimodalMessage content={message.content} />
          ) : (
            <AIMultimodalMessage content={message.content} />
          )}

          {/* Message Actions */}
          <div className="absolute -right-2 -top-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-full shadow-md"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "已复制" : "复制"}
                </DropdownMenuItem>
                {isAssistant && onRegenerate && (
                  <DropdownMenuItem onClick={handleRegenerate}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重新生成
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {formatMessageTime(new Date())}
        </div>
      </div>
    </div>
  );
}
