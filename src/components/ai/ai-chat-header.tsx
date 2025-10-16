"use client";

import React, { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  MoreHorizontal,
  Sparkles,
  Trash2,
  Copy,
  Archive,
  MessageSquare,
  Plus,
  Edit3,
  Clock,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AI_MODELS } from "@/lib/ai/providers";
import type { ChatSession } from "@/lib/hooks/use-ai-chat";
import { cn } from "@/lib/utils";
import { formatMessageDate, truncateText } from "@/lib/ai/utils";

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
  onRenameChat?: (chatId: string, newTitle: string) => void;
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
  const modelName = AI_MODELS.find(m => m.id === selectedModel)?.name || "AI 助手";
  
  // 聊天历史对话框状态
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 从localStorage加载聊天历史
  React.useEffect(() => {
    if (showHistory) {
      const savedSessions = localStorage.getItem("ai-chat-sessions");
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          setSessions(parsed.map((session: ChatSession & { createdAt: string; updatedAt: string }) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
          })));
        } catch (error) {
          console.error("Failed to load chat sessions:", error);
        }
      }
    }
  }, [showHistory]);

  // 保存聊天历史到localStorage
  const saveSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    localStorage.setItem("ai-chat-sessions", JSON.stringify(newSessions));
  };

  // 过滤会话
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => {
      const content = typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.map(c => 
          typeof c === 'string' ? c : c.content || ''
        ).join(' ') : '';
      return content.toLowerCase().includes(searchQuery.toLowerCase());
    })
  );

  const handleNewChat = () => {
    onNewChat();
    setShowHistory(false);
  };

  const handleSelectChat = (id: string) => {
    onSelectChat(id);
    setShowHistory(false);
  };

  const handleDeleteChat = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    saveSessions(newSessions);
    onDeleteChat(id);
  };

  const handleRenameChat = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setEditingId(id);
      setEditTitle(session.title);
    }
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim() && onRenameChat) {
      const newSessions = sessions.map(session =>
        session.id === editingId
          ? { ...session, title: editTitle.trim(), updatedAt: new Date() }
          : session
      );
      saveSessions(newSessions);
      onRenameChat(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <>
      <header className="flex-shrink-0 border-b border-gray-200/80 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section */}
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-all duration-200",
                "active:scale-95"
              )}
              aria-label="返回首页"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {/* Title Section */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {currentSession?.title || "新对话"}
                  </h1>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section - Single Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-all duration-200",
                  "active:scale-95"
                )}
                aria-label="菜单"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className={cn(
                "w-56 rounded-2xl shadow-2xl",
                "border border-gray-200/80 dark:border-gray-700/50",
                "bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl",
                "p-1.5"
              )}
              sideOffset={8}
            >
              {/* Chat Management */}
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={onNewChat}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Plus className="mr-2.5 h-4 w-4" />
                  <span>新建对话</span>
                  <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowHistory(true)}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Clock className="mr-2.5 h-4 w-4" />
                  <span>聊天历史</span>
                  <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1.5" />

              {/* Chat Actions */}
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={onExportChat}
                  disabled={!hasMessages}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Download className="mr-2.5 h-4 w-4" />
                  <span>导出对话</span>
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onShareChat}
                  disabled={!hasMessages}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Share2 className="mr-2.5 h-4 w-4" />
                  <span>分享对话</span>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled={!hasMessages}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Copy className="mr-2.5 h-4 w-4" />
                  <span>复制内容</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1.5" />

              {/* Settings and Management */}
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={onToggleSettings}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Sliders className="mr-2.5 h-4 w-4" />
                  <span>设置</span>
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled={!hasMessages}
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Archive className="mr-2.5 h-4 w-4" />
                  <span>归档对话</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteChat(chatId)}
                  disabled={!hasMessages}
                  variant="destructive"
                  className="rounded-lg py-2.5 px-3 cursor-pointer"
                >
                  <Trash2 className="mr-2.5 h-4 w-4" />
                  <span>删除对话</span>
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 聊天历史对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[85vh] p-0",
          "rounded-2xl border border-gray-200/80 dark:border-gray-700/50",
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
        )}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              聊天历史
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full border border-gray-400 dark:border-gray-500" />
                </div>
              </div>
              <Input
                placeholder="搜索对话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 h-10 rounded-xl",
                  "border-gray-200/80 dark:border-gray-700/50",
                  "bg-gray-50/50 dark:bg-gray-800/50",
                  "focus-visible:ring-1 focus-visible:ring-blue-500/50"
                )}
              />
            </div>

            {/* 新建聊天按钮 */}
            <Button 
              onClick={handleNewChat} 
              className={cn(
                "w-full h-10 rounded-xl gap-2",
                "bg-gradient-to-r from-blue-500 to-purple-600",
                "hover:from-blue-600 hover:to-purple-700",
                "shadow-sm hover:shadow-md transition-all"
              )}
            >
              <Plus className="h-4 w-4" />
              新建对话
            </Button>

            {/* 聊天列表 */}
            <ScrollArea className="h-[400px] pr-4 -mr-4">
              <div className="space-y-2">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery ? "没有找到匹配的对话" : "还没有聊天记录"}
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer",
                        "border border-gray-200/50 dark:border-gray-700/50",
                        "hover:border-gray-300 dark:hover:border-gray-600",
                        "hover:shadow-sm",
                        chatId === session.id && [
                          "bg-blue-50/50 dark:bg-blue-950/20",
                          "border-blue-200 dark:border-blue-800",
                          "shadow-sm"
                        ]
                      )}
                      onClick={() => handleSelectChat(session.id)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-8 rounded-lg"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename();
                                if (e.key === "Escape") handleCancelRename();
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRename();
                              }}
                              className="h-8 rounded-lg"
                            >
                              保存
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRename();
                              }}
                              className="h-8 rounded-lg"
                            >
                              取消
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate mb-1">
                              {session.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                              {truncateText(
                                (() => {
                                  const userMessage = session.messages.find(m => m.role === "user");
                                  if (!userMessage) return "";
                                  return typeof userMessage.content === 'string' 
                                    ? userMessage.content 
                                    : userMessage.content.map(c => 
                                        typeof c === 'string' ? c : c.content || ''
                                      ).join(' ');
                                })(),
                                60
                              )}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              >
                                {session.messages.length} 条
                              </Badge>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatMessageDate(session.updatedAt)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {editingId !== session.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "absolute top-3 right-3 h-8 w-8 p-0 rounded-lg",
                                "opacity-0 group-hover:opacity-100 transition-opacity"
                              )}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end"
                            className="rounded-xl"
                          >
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameChat(session.id);
                              }}
                              className="rounded-lg cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(session.id);
                              }}
                              variant="destructive"
                              className="rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
