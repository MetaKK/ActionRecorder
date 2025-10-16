"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Database, Cloud, HardDrive, Settings } from "lucide-react";
import { initStorageConfig } from "@/lib/storage/storage-config";
import { getStorageStatus } from "@/lib/storage/init-storage";
import { toast } from "sonner";

interface StorageConfigProps {
  className?: string;
  onConfigChange?: (config: {
    type: "local" | "cloud" | "hybrid";
    cloudApiUrl: string;
    syncInterval: number;
    enableOfflineMode: boolean;
  }) => void;
}

export function StorageConfig({ className, onConfigChange }: StorageConfigProps) {
  const [config, setConfig] = useState({
    type: "local" as "local" | "cloud" | "hybrid",
    cloudApiUrl: "/api/cloud",
    syncInterval: 0,
    enableOfflineMode: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const status = getStorageStatus();
    setConfig({
      type: status.type as "local" | "cloud" | "hybrid",
      cloudApiUrl: "/api/cloud",
      syncInterval: status.syncInterval || 0,
      enableOfflineMode: status.offlineMode ?? true,
    });
  }, []);

  const handleConfigChange = (newConfig: Partial<typeof config>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      initStorageConfig(config);
      toast.success("存储配置已更新");
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("配置保存失败");
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageIcon = (type: string) => {
    switch (type) {
      case "local":
        return <HardDrive className="h-4 w-4 text-orange-500" />;
      case "cloud":
        return <Cloud className="h-4 w-4 text-blue-500" />;
      case "hybrid":
        return <Database className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStorageDescription = (type: string) => {
    switch (type) {
      case "local":
        return "纯本地存储，数据仅保存在浏览器中";
      case "cloud":
        return "云端存储，数据同步到服务器";
      case "hybrid":
        return "混合存储，本地优先，云端备份";
      default:
        return "";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          存储配置
        </CardTitle>
        <CardDescription>
          配置AI聊天的数据存储方式
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 存储类型选择 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">存储类型</Label>
          <RadioGroup
            value={config.type}
            onValueChange={(value) => handleConfigChange({ type: value as "local" | "cloud" | "hybrid" })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                {getStorageIcon("local")}
                <div>
                  <div className="font-medium">本地存储</div>
                  <div className="text-xs text-muted-foreground">
                    {getStorageDescription("local")}
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="hybrid" id="hybrid" />
              <Label htmlFor="hybrid" className="flex items-center gap-2 cursor-pointer">
                {getStorageIcon("hybrid")}
                <div>
                  <div className="font-medium">混合存储</div>
                  <div className="text-xs text-muted-foreground">
                    {getStorageDescription("hybrid")}
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="cloud" id="cloud" />
              <Label htmlFor="cloud" className="flex items-center gap-2 cursor-pointer">
                {getStorageIcon("cloud")}
                <div>
                  <div className="font-medium">云端存储</div>
                  <div className="text-xs text-muted-foreground">
                    {getStorageDescription("cloud")}
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* 云端配置 */}
        {(config.type === "cloud" || config.type === "hybrid") && (
          <div className="space-y-3">
            <Label htmlFor="cloudApiUrl" className="text-sm font-medium">
              云端API地址
            </Label>
            <Input
              id="cloudApiUrl"
              value={config.cloudApiUrl}
              onChange={(e) => handleConfigChange({ cloudApiUrl: e.target.value })}
              placeholder="/api/cloud"
              className="w-full"
            />
          </div>
        )}

        {/* 同步配置 */}
        {(config.type === "cloud" || config.type === "hybrid") && (
          <div className="space-y-3">
            <Label htmlFor="syncInterval" className="text-sm font-medium">
              同步间隔 (毫秒)
            </Label>
            <Input
              id="syncInterval"
              type="number"
              value={config.syncInterval}
              onChange={(e) => handleConfigChange({ syncInterval: parseInt(e.target.value) || 0 })}
              placeholder="30000"
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              设置为0表示不自动同步
            </div>
          </div>
        )}

        {/* 离线模式 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">离线模式</Label>
            <div className="text-xs text-muted-foreground">
              允许在离线状态下使用本地存储
            </div>
          </div>
          <Switch
            checked={config.enableOfflineMode}
            onCheckedChange={(checked) => handleConfigChange({ enableOfflineMode: checked })}
          />
        </div>

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "保存中..." : "保存配置"}
        </Button>
      </CardContent>
    </Card>
  );
}
