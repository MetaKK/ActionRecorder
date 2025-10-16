"use client";

import React, { memo } from "react";
import { Copy, RotateCcw, Trash2, Edit3, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Message, MessageContent } from "@/lib/hooks/use-ai-chat";

interface AIMessageActionsProps {
  message: Message;
  onCopy?: (content: string | MessageContent[]) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
}

export const AIMessageActions = memo(function AIMessageActions({
  message,
  onCopy,
  onRegenerate,
  onDelete,
  onEdit,
}: AIMessageActionsProps) {
  const isUser = message.role === "user";

  const handleCopy = () => {
    const textContent = typeof message.content === 'string'
      ? message.content
      : message.content.find(c => c.type === 'text')?.content || '';
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
    <div className="absolute -right-2 -top-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isUser ? "end" : "start"}>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-3 w-3" /> 复制
          </DropdownMenuItem>
          {!isUser && (
            <DropdownMenuItem onClick={handleRegenerate}>
              <RotateCcw className="mr-2 h-3 w-3" /> 重新生成
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleEdit}>
            <Edit3 className="mr-2 h-3 w-3" /> 编辑
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Trash2 className="mr-2 h-3 w-3" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
