"use client";

import { hybridStorage } from "./hybrid-storage";
import type { ChatSession, Message } from "@/lib/hooks/use-ai-chat";

/**
 * 云存储接口 - 为未来上云做准备
 * 设计为可插拔的存储适配器
 */
export interface CloudStorageAdapter {
  // 会话管理
  saveSession(session: ChatSession): Promise<boolean>;
  loadSessions(): Promise<ChatSession[]>;
  deleteSession(sessionId: string): Promise<boolean>;
  
  // 消息管理
  saveMessage(sessionId: string, message: Message): Promise<boolean>;
  loadMessages(sessionId: string): Promise<Message[]>;
  
  // 同步管理
  syncToCloud(): Promise<boolean>;
  syncFromCloud(): Promise<ChatSession[]>;
  
  // 用户管理
  setUserId(userId: string): void;
  getUserId(): string | null;
}

/**
 * 本地存储适配器 - 当前实现
 */
export class LocalStorageAdapter implements CloudStorageAdapter {
  private userId: string | null = null;

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  async saveSession(session: ChatSession): Promise<boolean> {
    try {
      const sessions = await this.loadSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      // 限制会话数量
      if (sessions.length > 100) {
        sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        sessions.splice(100);
      }

      const success = await hybridStorage.setItem(
        "ai-chat-sessions",
        JSON.stringify(sessions)
      );
      
      return success;
    } catch (error) {
      console.error("Failed to save session:", error);
      return false;
    }
  }

  async loadSessions(): Promise<ChatSession[]> {
    try {
      const savedSessions = await hybridStorage.getItem("ai-chat-sessions");
      if (savedSessions) {
        return JSON.parse(savedSessions).map((session: ChatSession & { 
          createdAt: string; 
          updatedAt: string; 
        }) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load sessions:", error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessions = await this.loadSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      
      return await hybridStorage.setItem(
        "ai-chat-sessions",
        JSON.stringify(filteredSessions)
      );
    } catch (error) {
      console.error("Failed to delete session:", error);
      return false;
    }
  }

  async saveMessage(sessionId: string, message: Message): Promise<boolean> {
    // 本地存储中，消息是会话的一部分
    const sessions = await this.loadSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
      const messageIndex = session.messages.findIndex(m => m.id === message.id);
      if (messageIndex >= 0) {
        session.messages[messageIndex] = message;
      } else {
        session.messages.push(message);
      }
      session.updatedAt = new Date();
      
      return await this.saveSession(session);
    }
    
    return false;
  }

  async loadMessages(sessionId: string): Promise<Message[]> {
    const sessions = await this.loadSessions();
    const session = sessions.find(s => s.id === sessionId);
    return session?.messages || [];
  }

  async syncToCloud(): Promise<boolean> {
    // 本地存储不需要同步到云端
    return true;
  }

  async syncFromCloud(): Promise<ChatSession[]> {
    // 本地存储不需要从云端同步
    return await this.loadSessions();
  }
}

/**
 * 云端存储适配器 - 未来实现
 * 参考ai-chatbot的PostgreSQL + Redis架构
 */
export class CloudStorageAdapterImpl implements CloudStorageAdapter {
  private userId: string | null = null;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api/cloud") {
    this.apiBaseUrl = apiBaseUrl;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  async saveSession(session: ChatSession): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(session),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to save session to cloud:", error);
      return false;
    }
  }

  async loadSessions(): Promise<ChatSession[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions`, {
        headers: {
          "Authorization": `Bearer ${this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Failed to load sessions from cloud:", error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.getAuthToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to delete session from cloud:", error);
      return false;
    }
  }

  async saveMessage(sessionId: string, message: Message): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to save message to cloud:", error);
      return false;
    }
  }

  async loadMessages(sessionId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/messages`, {
        headers: {
          "Authorization": `Bearer ${this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Failed to load messages from cloud:", error);
      return [];
    }
  }

  async syncToCloud(): Promise<boolean> {
    try {
      // 获取本地所有会话
      const localSessions = await hybridStorage.getItem("ai-chat-sessions");
      if (!localSessions) return true;

      const sessions = JSON.parse(localSessions);
      
      // 批量同步到云端
      const response = await fetch(`${this.apiBaseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ sessions }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to sync to cloud:", error);
      return false;
    }
  }

  async syncFromCloud(): Promise<ChatSession[]> {
    try {
      const sessions = await this.loadSessions();
      
      // 同时保存到本地存储
      await hybridStorage.setItem("ai-chat-sessions", JSON.stringify(sessions));
      
      return sessions;
    } catch (error) {
      console.error("Failed to sync from cloud:", error);
      return [];
    }
  }

  private getAuthToken(): string {
    // 从localStorage或cookie获取认证token
    return localStorage.getItem("auth-token") || "";
  }
}

/**
 * 存储工厂 - 根据配置选择存储适配器
 */
export class StorageFactory {
  static createAdapter(config: {
    type: "local" | "cloud" | "hybrid";
    cloudApiUrl?: string;
  }): CloudStorageAdapter {
    switch (config.type) {
      case "local":
        return new LocalStorageAdapter();
      case "cloud":
        return new CloudStorageAdapterImpl(config.cloudApiUrl);
      case "hybrid":
        // 混合模式：本地优先，云端备份
        return new HybridStorageAdapter();
      default:
        return new LocalStorageAdapter();
    }
  }
}

/**
 * 混合存储适配器 - 本地优先，云端备份
 */
class HybridStorageAdapter implements CloudStorageAdapter {
  private localAdapter = new LocalStorageAdapter();
  private cloudAdapter: CloudStorageAdapter;
  private isCloudAvailable = false;

  constructor() {
    this.cloudAdapter = new CloudStorageAdapterImpl();
    this.checkCloudAvailability();
  }

  private async checkCloudAvailability() {
    try {
      // 检查云端连接
      const response = await fetch("/api/health");
      this.isCloudAvailable = response.ok;
    } catch {
      this.isCloudAvailable = false;
    }
  }

  setUserId(userId: string): void {
    this.localAdapter.setUserId(userId);
    this.cloudAdapter.setUserId(userId);
  }

  getUserId(): string | null {
    return this.localAdapter.getUserId();
  }

  async saveSession(session: ChatSession): Promise<boolean> {
    // 优先保存到本地
    const localSuccess = await this.localAdapter.saveSession(session);
    
    // 如果云端可用，异步同步到云端
    if (this.isCloudAvailable) {
      this.cloudAdapter.saveSession(session).catch(console.error);
    }
    
    return localSuccess;
  }

  async loadSessions(): Promise<ChatSession[]> {
    // 优先从本地加载
    const localSessions = await this.localAdapter.loadSessions();
    
    // 如果本地没有数据且云端可用，从云端同步
    if (localSessions.length === 0 && this.isCloudAvailable) {
      const cloudSessions = await this.cloudAdapter.loadSessions();
      if (cloudSessions.length > 0) {
        // 保存到本地
        for (const session of cloudSessions) {
          await this.localAdapter.saveSession(session);
        }
        return cloudSessions;
      }
    }
    
    return localSessions;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const localSuccess = await this.localAdapter.deleteSession(sessionId);
    
    if (this.isCloudAvailable) {
      this.cloudAdapter.deleteSession(sessionId).catch(console.error);
    }
    
    return localSuccess;
  }

  async saveMessage(sessionId: string, message: Message): Promise<boolean> {
    const localSuccess = await this.localAdapter.saveMessage(sessionId, message);
    
    if (this.isCloudAvailable) {
      this.cloudAdapter.saveMessage(sessionId, message).catch(console.error);
    }
    
    return localSuccess;
  }

  async loadMessages(sessionId: string): Promise<Message[]> {
    return await this.localAdapter.loadMessages(sessionId);
  }

  async syncToCloud(): Promise<boolean> {
    if (!this.isCloudAvailable) return false;
    
    const localSessions = await this.localAdapter.loadSessions();
    for (const session of localSessions) {
      await this.cloudAdapter.saveSession(session);
    }
    
    return true;
  }

  async syncFromCloud(): Promise<ChatSession[]> {
    if (!this.isCloudAvailable) return await this.localAdapter.loadSessions();
    
    return await this.cloudAdapter.syncFromCloud();
  }
}
