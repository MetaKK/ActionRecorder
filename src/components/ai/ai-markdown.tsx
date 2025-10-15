"use client";

import { useRef, useState } from "react";
import { Copy, Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIMarkdownProps {
  content: string;
  loading?: boolean;
  className?: string;
}

export function AIMarkdown({ content, loading = false, className }: AIMarkdownProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (codeRef.current) {
      await navigator.clipboard.writeText(codeRef.current.textContent || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Chat",
          text: content,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span>AI正在思考中...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
        >
          <Download className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleShare}
          className="h-8 w-8 p-0"
        >
          <Share2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div ref={codeRef} className="prose prose-sm max-w-none dark:prose-invert">
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    </div>
  );
}
