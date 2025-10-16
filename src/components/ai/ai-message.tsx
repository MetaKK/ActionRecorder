"use client";

import { useState } from "react";
import { formatMessageTime } from "@/lib/ai/utils";
import { cn } from "@/lib/utils";
import { User, Copy, RotateCcw, Trash2, Edit3, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        "group flex gap-3 hover:bg-muted/30 p-3 rounded-xl transition-all duration-200",
        "hover:shadow-sm hover:scale-[1.01]",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar - 使用情绪小人图片 */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200">
        {isUser ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md border border-border/20">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <img
            src="/img/9ade71d75a1c0e93.png"
            alt="AI助手"
            className="h-9 w-9 rounded-full object-cover border border-border/20 shadow-md"
          />
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
            "rounded-2xl px-4 py-3 text-sm relative group/message transition-all duration-200",
            "shadow-sm border border-border/10",
            "[&_*]:!m-0 [&_p]:!m-0", // 强制移除所有元素的margin
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20"
              : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-foreground shadow-gray-500/10"
          )}
        >
          {isLoading && isAssistant ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">
              {typeof message.content === 'string' ? (
                message.content
              ) : (
                <div className="space-y-2">
                  {message.content.map((item, index) => (
                    <div key={index}>
                      {item.type === 'text' && (
                        <span className="whitespace-pre-wrap">{item.content}</span>
                      )}
                      {item.type === 'image' && (
                        <img src={item.url || item.content} alt="Image" className="max-w-full rounded" />
                      )}
                      {item.type === 'file' && (
                        <div className={cn(
                          "flex items-center gap-2 p-2 rounded",
                          isUser ? "bg-blue-400/20" : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          <span className="text-sm">📎 {item.content}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message Actions - Notion风格优化 */}
          <div className="absolute -right-2 -top-2 opacity-0 group-hover/message:opacity-100 transition-all duration-200 transform scale-95 group-hover/message:scale-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "h-8 w-8 p-0 rounded-full shadow-lg border border-border/20",
                    "bg-background/90 backdrop-blur-sm",
                    "hover:bg-background hover:shadow-xl hover:scale-105",
                    "transition-all duration-200"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-xl border border-border/20 bg-background/95 backdrop-blur-sm">
                <DropdownMenuItem 
                  onClick={handleCopy}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span className="font-medium">{copied ? "已复制" : "复制"}</span>
                </DropdownMenuItem>
                {isAssistant && onRegenerate && (
                  <DropdownMenuItem 
                    onClick={handleRegenerate}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="font-medium">重新生成</span>
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={handleEdit}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="font-medium">编辑</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="flex items-center gap-3 px-3 py-2.5 text-destructive hover:bg-destructive/10 focus:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">删除</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Timestamp - Apple风格优化 */}
        <div className="text-xs text-muted-foreground/60 font-medium">
          {formatMessageTime(new Date())}
        </div>
      </div>
    </div>
  );
}
