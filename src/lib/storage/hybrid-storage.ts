"use client";

import { get, set, del, clear } from "idb-keyval";
import { safeLocalStorage } from "@/lib/utils/storage";

/**
 * 混合存储架构 - 借鉴NextChat方案
 * IndexedDB (主存储) + localStorage (降级方案)
 */
class HybridStorage {
  private localStorage = safeLocalStorage();
  private isIndexedDBSupported = false;

  constructor() {
    this.checkIndexedDBSupport();
  }

  private async checkIndexedDBSupport() {
    try {
      if (typeof window !== "undefined" && "indexedDB" in window) {
        // 测试IndexedDB是否可用
        await set("test", "test");
        await del("test");
        this.isIndexedDBSupported = true;
      }
    } catch {
      console.warn("IndexedDB not supported, falling back to localStorage");
      this.isIndexedDBSupported = false;
    }
  }

  /**
   * 获取数据 - 优先IndexedDB，降级到localStorage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isIndexedDBSupported) {
        const value = await get(key);
        if (value) return value;
      }
      
      // 降级到localStorage
      return this.localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return this.localStorage.getItem(key);
    }
  }

  /**
   * 设置数据 - 优先IndexedDB，降级到localStorage
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (this.isIndexedDBSupported) {
        await set(key, value);
        return true;
      }
      
      // 降级到localStorage
      return this.localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      return this.localStorage.setItem(key, value);
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      if (this.isIndexedDBSupported) {
        await del(key);
      }
      
      // 同时清理localStorage
      return this.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return this.localStorage.removeItem(key);
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<boolean> {
    try {
      if (this.isIndexedDBSupported) {
        await clear();
      }
      
      // 同时清理localStorage
      this.localStorage.removeItem("ai-chat-sessions");
      return true;
    } catch (error) {
      console.error("Failed to clear storage:", error);
      return false;
    }
  }

  /**
   * 获取存储信息
   */
  async getStorageInfo(): Promise<{
    type: "indexeddb" | "localStorage";
    size: number;
    available: boolean;
  }> {
    try {
      if (this.isIndexedDBSupported) {
        // IndexedDB通常有更大容量
        return {
          type: "indexeddb",
          size: 0, // IndexedDB大小难以准确获取
          available: true,
        };
      }
      
      // localStorage容量检查
      const testKey = "storage-test";
      let size = 0;
      try {
        const testData = "x".repeat(1024); // 1KB测试数据
        this.localStorage.setItem(testKey, testData);
        size = testData.length;
        this.localStorage.removeItem(testKey);
      } catch {
        // 存储已满
      }
      
      return {
        type: "localStorage",
        size,
        available: size > 0,
      };
    } catch {
      return {
        type: "localStorage",
        size: 0,
        available: false,
      };
    }
  }
}

export const hybridStorage = new HybridStorage();
