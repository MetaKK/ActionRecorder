"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AITypingIndicatorProps {
  isTyping?: boolean;
  message?: string;
  className?: string;
}

export function AITypingIndicator({ 
  isTyping = false, 
  message = "AI正在思考...",
  className 
}: AITypingIndicatorProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isTyping) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border/20",
      "shadow-sm backdrop-blur-sm",
      className
    )}>
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
      </div>
      
      {/* Typing Animation */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground font-medium">{message}</span>
          <span className="text-sm text-muted-foreground">{dots}</span>
        </div>
        
        {/* Animated dots */}
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
