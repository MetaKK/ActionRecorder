"use client";

import { initStorageConfig, getAutoStorageConfig } from "./storage-config";
import { useEffect } from "react";

/**
 * 初始化存储配置
 * 根据环境自动选择最适合的存储方案
 */
export function useStorageInit() {
  useEffect(() => {
    // 自动检测环境并初始化存储配置
    const config = getAutoStorageConfig();
    const storageConfig = initStorageConfig(config);
    
    console.log("Storage initialized with config:", config);
    
    // 清理函数
    return () => {
      storageConfig.destroy();
    };
  }, []);
}

/**
 * 手动初始化存储配置
 */
export function initStorageManually(config: {
  type: "local" | "cloud" | "hybrid";
  cloudApiUrl?: string;
  syncInterval?: number;
}) {
  return initStorageConfig(config);
}

/**
 * 获取当前存储状态
 */
export function getStorageStatus() {
  const config = getAutoStorageConfig();
  return {
    type: config.type,
    cloudEnabled: config.type === "cloud" || config.type === "hybrid",
    syncInterval: config.syncInterval,
    offlineMode: config.enableOfflineMode,
  };
}
