"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Database, HardDrive, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { getStorageAdapter } from "@/lib/storage/storage-config";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { toast } from "sonner";

interface StorageStatusProps {
  className?: string;
}

export function StorageStatus({ className }: StorageStatusProps) {
  const [storageInfo, setStorageInfo] = useState<{
    type: "indexeddb" | "localStorage";
    size: number;
    available: boolean;
    cloudEnabled: boolean;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await hybridStorage.getStorageInfo();
        const adapter = getStorageAdapter();
        
        setStorageInfo({
          type: info.type,
          size: info.size,
          available: info.available,
          cloudEnabled: !!adapter,
        });
      } catch (error) {
        console.error("Failed to load storage info:", error);
      }
    };

    loadStorageInfo();

    // 监听网络状态
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!storageInfo?.cloudEnabled) {
      toast.error("云端存储未启用");
      return;
    }

    setIsLoading(true);
    try {
      const adapter = getStorageAdapter();
      if (adapter) {
        const success = await adapter.syncToCloud();
        if (success) {
          toast.success("同步成功");
        } else {
          toast.error("同步失败");
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("同步失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (!storageInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">加载存储信息中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">存储状态</CardTitle>
        <CardDescription className="text-xs">
          当前存储配置和状态信息
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 存储类型 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {storageInfo.type === "indexeddb" ? (
              <Database className="h-4 w-4 text-blue-500" />
            ) : (
              <HardDrive className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm">
              {storageInfo.type === "indexeddb" ? "IndexedDB" : "LocalStorage"}
            </span>
          </div>
          <Badge variant={storageInfo.available ? "default" : "destructive"}>
            {storageInfo.available ? "可用" : "不可用"}
          </Badge>
        </div>

        {/* 云端状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-purple-500" />
            <span className="text-sm">云端存储</span>
          </div>
          <Badge variant={storageInfo.cloudEnabled ? "default" : "secondary"}>
            {storageInfo.cloudEnabled ? "已启用" : "未启用"}
          </Badge>
        </div>

        {/* 网络状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">网络连接</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "在线" : "离线"}
          </Badge>
        </div>

        {/* 存储大小 */}
        {storageInfo.size > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">存储大小</span>
            <span className="text-sm font-mono">
              {(storageInfo.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {/* 同步按钮 */}
        {storageInfo.cloudEnabled && (
          <Button
            onClick={handleSync}
            disabled={!isOnline || isLoading}
            size="sm"
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3 mr-2" />
                同步到云端
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
