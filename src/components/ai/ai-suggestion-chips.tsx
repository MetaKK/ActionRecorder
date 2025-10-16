"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, MessageSquare, Lightbulb, BookOpen } from "lucide-react";

interface SuggestionChip {
  id: string;
  text: string;
  icon?: React.ReactNode;
  category?: "conversation" | "learning" | "analysis" | "creative";
}

interface AISuggestionChipsProps {
  suggestions?: SuggestionChip[];
  onSuggestionClick?: (suggestion: SuggestionChip) => void;
  className?: string;
}

const defaultSuggestions: SuggestionChip[] = [
  {
    id: "analyze-patterns",
    text: "分析我的生活模式",
    icon: <Lightbulb className="h-4 w-4" />,
    category: "analysis"
  },
  {
    id: "learning-suggestions",
    text: "推荐学习内容",
    icon: <BookOpen className="h-4 w-4" />,
    category: "learning"
  },
  {
    id: "creative-writing",
    text: "帮我写一篇日记",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "creative"
  },
  {
    id: "chat-about-day",
    text: "聊聊今天发生的事情",
    icon: <Sparkles className="h-4 w-4" />,
    category: "conversation"
  }
];

export function AISuggestionChips({ 
  suggestions = defaultSuggestions,
  onSuggestionClick,
  className 
}: AISuggestionChipsProps) {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const handleChipClick = (suggestion: SuggestionChip) => {
    setSelectedChip(suggestion.id);
    onSuggestionClick?.(suggestion);
    
    // Reset selection after animation
    setTimeout(() => {
      setSelectedChip(null);
    }, 1000);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "analysis":
        return "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950/20 dark:hover:text-blue-300";
      case "learning":
        return "hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:text-green-300";
      case "creative":
        return "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 dark:hover:bg-purple-950/20 dark:hover:text-purple-300";
      case "conversation":
        return "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 dark:hover:bg-orange-950/20 dark:hover:text-orange-300";
      default:
        return "hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-300";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">建议尝试</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => handleChipClick(suggestion)}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30",
              "bg-background/50 backdrop-blur-sm transition-all duration-200",
              "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
              "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
              getCategoryColor(suggestion.category),
              selectedChip === suggestion.id && "scale-95 bg-primary/10 border-primary/30"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              "bg-muted/50 group-hover:bg-primary/10"
            )}>
              {suggestion.icon}
            </div>
            
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-foreground group-hover:text-current">
                {suggestion.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
