"use client";

import { useCallback } from "react";
import type { ChatSession } from "@/lib/hooks/use-ai-chat";
import { getStorageAdapter } from "./storage-config";
import { hybridStorage } from "./hybrid-storage";

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
      console.error(`Error getting item from localStorage for key "${key}":`, error);
      return null;
    }
  };

  const setItem = (key: string, value: string): boolean => {
    if (!isAvailable) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting item to localStorage for key "${key}":`, error);
      return false;
    }
  };

  const removeItem = (key: string): boolean => {
    if (!isAvailable) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage for key "${key}":`, error);
      return false;
    }
  };

  return { getItem, setItem, removeItem };
}

// 增强版聊天会话存储管理 - 支持混合存储架构
export function useEnhancedChatStorage() {
  const storage = safeLocalStorage();
  const cloudAdapter = getStorageAdapter();

  // 防抖保存会话
  const debouncedSaveSession = useCallback(
    debounce(async (sessions: ChatSession[]) => {
      try {
        // 优先使用云端存储
        if (cloudAdapter) {
          for (const session of sessions) {
            await cloudAdapter.saveSession(session);
          }
        } else {
          // 使用混合存储
          await hybridStorage.setItem("ai-chat-sessions", JSON.stringify(sessions));
        }
      } catch (error) {
        console.error("Error saving sessions:", error);
        // 降级到本地存储
        try {
          storage.setItem("ai-chat-sessions", JSON.stringify(sessions));
        } catch (fallbackError) {
          console.error("Fallback storage also failed:", fallbackError);
        }
      }
    }, 500),
    [storage, cloudAdapter]
  );

  // 加载会话
  const loadSessions = useCallback(async (): Promise<ChatSession[]> => {
    try {
      // 优先使用云端存储
      if (cloudAdapter) {
        const cloudSessions = await cloudAdapter.loadSessions();
        if (cloudSessions.length > 0) {
          return cloudSessions;
        }
      }
      
      // 使用混合存储
      const savedSessions = await hybridStorage.getItem("ai-chat-sessions");
      if (savedSessions) {
        return JSON.parse(savedSessions).map((session: ChatSession & { createdAt: string; updatedAt: string }) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }));
      }
      
      // 降级到本地存储
      const localSessions = storage.getItem("ai-chat-sessions");
      if (localSessions) {
        return JSON.parse(localSessions).map((session: ChatSession & { createdAt: string; updatedAt: string }) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }));
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
    return [];
  }, [storage, cloudAdapter]);

  // 保存单个会话
  const saveSession = useCallback(async (sessionToSave: ChatSession) => {
    try {
      if (cloudAdapter) {
        // 使用云端存储
        await cloudAdapter.saveSession(sessionToSave);
      } else {
        // 使用混合存储
        const sessions = await loadSessions();
        const existingIndex = sessions.findIndex(s => s.id === sessionToSave.id);
        if (existingIndex >= 0) {
          sessions[existingIndex] = sessionToSave;
        } else {
          sessions.push(sessionToSave);
        }

        // 限制会话数量，保留最新的100个
        if (sessions.length > 100) {
          sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          sessions.splice(100);
        }

        debouncedSaveSession(sessions);
      }
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }, [loadSessions, debouncedSaveSession, cloudAdapter]);

  // 删除会话
  const deleteSession = useCallback(async (chatId: string) => {
    try {
      if (cloudAdapter) {
        // 使用云端存储
        await cloudAdapter.deleteSession(chatId);
      } else {
        // 使用混合存储
        const sessions = await loadSessions();
        const updatedSessions = sessions.filter(s => s.id !== chatId);
        debouncedSaveSession(updatedSessions);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }, [loadSessions, debouncedSaveSession, cloudAdapter]);

  // 清理过期会话（超过30天）
  const cleanupExpiredSessions = useCallback(async () => {
    try {
      const sessions = await loadSessions();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeSessions = sessions.filter(session => 
        session.updatedAt > thirtyDaysAgo
      );

      if (activeSessions.length !== sessions.length) {
        if (cloudAdapter) {
          // 云端存储：删除过期会话
          for (const session of sessions.filter(s => s.updatedAt <= thirtyDaysAgo)) {
            await cloudAdapter.deleteSession(session.id);
          }
        } else {
          // 混合存储：批量更新
          debouncedSaveSession(activeSessions);
        }
        console.log(`Cleaned up ${sessions.length - activeSessions.length} expired sessions`);
      }
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }, [loadSessions, debouncedSaveSession, cloudAdapter]);

  // 同步到云端
  const syncToCloud = useCallback(async () => {
    if (cloudAdapter) {
      try {
        return await cloudAdapter.syncToCloud();
      } catch (error) {
        console.error("Failed to sync to cloud:", error);
        return false;
      }
    }
    return true;
  }, [cloudAdapter]);

  // 从云端同步
  const syncFromCloud = useCallback(async () => {
    if (cloudAdapter) {
      try {
        const cloudSessions = await cloudAdapter.syncFromCloud();
        return cloudSessions;
      } catch (error) {
        console.error("Failed to sync from cloud:", error);
        return [];
      }
    }
    return [];
  }, [cloudAdapter]);

  // 获取存储信息
  const getStorageInfo = useCallback(async () => {
    try {
      const info = await hybridStorage.getStorageInfo();
      return {
        type: info.type,
        size: info.size,
        available: info.available,
        cloudEnabled: !!cloudAdapter,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        type: "localStorage" as const,
        size: 0,
        available: false,
        cloudEnabled: false,
      };
    }
  }, [cloudAdapter]);

  return {
    loadSessions,
    saveSession,
    deleteSession,
    cleanupExpiredSessions,
    syncToCloud,
    syncFromCloud,
    getStorageInfo,
  };
}

// 兼容性：保持原有接口
export function useChatStorage() {
  return useEnhancedChatStorage();
}
