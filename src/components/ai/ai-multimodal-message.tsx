"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIMarkdown } from "./ai-markdown";
import { 
  Download, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageContent {
  type: "text" | "image" | "file";
  content: string;
  url?: string;
  name?: string;
  size?: number;
}

interface AIMultimodalMessageProps {
  content: string | MessageContent[];
  isLoading?: boolean;
  className?: string;
}

export function AIMultimodalMessage({ 
  content, 
  isLoading = false, 
  className 
}: AIMultimodalMessageProps) {
  const [expandedImages, setExpandedImages] = useState<Set<number>>(new Set());

  const toggleImageExpansion = (index: number) => {
    setExpandedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (type: string, name?: string) => {
    if (type === "image") return <ImageIcon className="h-4 w-4" />;
    if (type === "file") {
      const ext = name?.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
        return <Video className="h-4 w-4" />;
      }
      if (['mp3', 'wav', 'flac', 'aac'].includes(ext || '')) {
        return <Music className="h-4 w-4" />;
      }
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
        return <Archive className="h-4 w-4" />;
      }
      return <FileText className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = (url: string, name?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank');
  };

  // 如果是简单字符串内容
  if (typeof content === "string") {
    return (
      <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
        <AIMarkdown content={content} loading={isLoading} />
      </div>
    );
  }

  // 如果是多模态内容数组
  return (
    <div className={cn("space-y-3", className)}>
      {content.map((item, index) => (
        <div key={index} className="space-y-2">
          {item.type === "text" && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <AIMarkdown content={item.content} loading={isLoading} />
            </div>
          )}
          
          {item.type === "image" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>图片</span>
                {item.name && <span>• {item.name}</span>}
                {item.size && <span>• {formatFileSize(item.size)}</span>}
              </div>
              <div className="relative group">
                <img
                  src={item.url || item.content}
                  alt={item.name || "上传的图片"}
                  className={cn(
                    "rounded-lg border max-w-full h-auto cursor-pointer transition-all",
                    expandedImages.has(index) 
                      ? "max-h-none" 
                      : "max-h-64 object-cover"
                  )}
                  onClick={() => toggleImageExpansion(index)}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleImageExpansion(index)}
                  >
                    {expandedImages.has(index) ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  {item.url && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(item.url!, item.name)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenExternal(item.url!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {item.type === "file" && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              {getFileIcon(item.type, item.name)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.name || "未知文件"}
                </div>
                {item.size && (
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(item.size)}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {item.url && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownload(item.url!, item.name)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenExternal(item.url!)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
