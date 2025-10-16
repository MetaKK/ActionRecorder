"use client";

import { useCallback } from "react";
import type { ChatSession } from "@/lib/hooks/use-ai-chat";

// 防抖函数
function debounce(func: (sessions: ChatSession[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return (sessions: ChatSession[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(sessions), wait);
  };
}

// 安全的localStorage操作
export function safeLocalStorage() {
  const isAvailable = typeof window !== "undefined" && window.localStorage;
  
  const getItem = (key: string): string | null => {
    if (!isAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Failed to get item from localStorage:", error);
      return null;
    }
  };

  const setItem = (key: string, value: string): boolean => {
    if (!isAvailable) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("Failed to set item in localStorage:", error);
      return false;
    }
  };

  const removeItem = (key: string): boolean => {
    if (!isAvailable) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to remove item from localStorage:", error);
      return false;
    }
  };

  return { getItem, setItem, removeItem };
}

// 聊天会话存储管理
export function useChatStorage() {
  const storage = safeLocalStorage();

  // 防抖保存会话
  const debouncedSaveSession = useCallback(
    debounce((sessions: ChatSession[]) => {
      try {
        const success = storage.setItem("ai-chat-sessions", JSON.stringify(sessions));
        if (!success) {
          console.warn("Failed to save sessions to localStorage");
        }
      } catch (error) {
        console.error("Error saving sessions:", error);
      }
    }, 500),
    [storage]
  );

  // 加载会话
  const loadSessions = useCallback((): ChatSession[] => {
    try {
      const savedSessions = storage.getItem("ai-chat-sessions");
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions).map((session: ChatSession & { createdAt: string; updatedAt: string }) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }));
        return sessions;
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
    return [];
  }, [storage]);

  // 保存会话
  const saveSession = useCallback((session: ChatSession) => {
    try {
      const sessions = loadSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      // 限制会话数量，保留最新的50个
      if (sessions.length > 50) {
        sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        sessions.splice(50);
      }

      debouncedSaveSession(sessions);
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }, [loadSessions, debouncedSaveSession]);

  // 删除会话
  const deleteSession = useCallback((chatId: string) => {
    try {
      const sessions = loadSessions();
      const filteredSessions = sessions.filter(s => s.id !== chatId);
      debouncedSaveSession(filteredSessions);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }, [loadSessions, debouncedSaveSession]);

  // 清理过期会话（超过30天）
  const cleanupExpiredSessions = useCallback(() => {
    try {
      const sessions = loadSessions();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeSessions = sessions.filter(session => 
        session.updatedAt > thirtyDaysAgo
      );

      if (activeSessions.length !== sessions.length) {
        debouncedSaveSession(activeSessions);
        console.log(`Cleaned up ${sessions.length - activeSessions.length} expired sessions`);
      }
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }, [loadSessions, debouncedSaveSession]);

  return {
    loadSessions,
    saveSession,
    deleteSession,
    cleanupExpiredSessions,
  };
}