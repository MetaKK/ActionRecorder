"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  MoreHorizontal,
  MessageSquare,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMessageDate, truncateText } from "@/lib/ai/utils";

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatHistoryProps {
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export function AIChatHistory({
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}: AIChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 从localStorage加载聊天历史
  useEffect(() => {
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
  }, []);

  // 保存聊天历史到localStorage
  const saveSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    localStorage.setItem("ai-chat-sessions", JSON.stringify(newSessions));
  };

  // 过滤会话
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    setIsOpen(false);
  };

  const handleDeleteChat = (chatId: string) => {
    const newSessions = sessions.filter(s => s.id !== chatId);
    saveSessions(newSessions);
    onDeleteChat(chatId);
  };

  const handleRenameChat = (chatId: string) => {
    const session = sessions.find(s => s.id === chatId);
    if (session) {
      setEditingId(chatId);
      setEditTitle(session.title);
    }
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          聊天历史
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            聊天历史
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索聊天记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 新建聊天按钮 */}
          <Button onClick={handleNewChat} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            新建聊天
          </Button>

          {/* 聊天列表 */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "没有找到匹配的聊天记录" : "还没有聊天记录"}
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      currentChatId === session.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleSelectChat(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename();
                              if (e.key === "Escape") handleCancelRename();
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveRename}>
                            保存
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelRename}>
                            取消
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium truncate">
                            {session.title}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {truncateText(
                              session.messages.find(m => m.role === "user")?.content || "",
                              50
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {session.messages.length} 条消息
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRenameChat(session.id)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            重命名
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteChat(session.id)}
                            className="text-destructive focus:text-destructive"
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
  );
}
