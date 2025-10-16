"use client";

import React, { memo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatHistory } from "./ai-chat-history";
import { AI_MODELS } from "@/lib/ai/providers";
import type { ChatSession } from "@/lib/hooks/use-ai-chat";

interface AIChatHeaderProps {
  chatId: string;
  currentSession: ChatSession | null;
  selectedModel: string;
  showSettings: boolean;
  onToggleSettings: () => void;
  onExportChat: () => void;
  onShareChat: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  hasMessages: boolean;
}

export const AIChatHeader = memo(function AIChatHeader({
  chatId,
  currentSession,
  selectedModel,
  onToggleSettings,
  onExportChat,
  onShareChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  hasMessages,
}: AIChatHeaderProps) {
  const router = useRouter();

  return (
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
          currentChatId={chatId}
          onSelectChat={onSelectChat}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
          onRenameChat={onRenameChat}
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportChat}
          disabled={!hasMessages}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onShareChat}
          disabled={!hasMessages}
          className="h-8 w-8 p-0"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSettings}
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
