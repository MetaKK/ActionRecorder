"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AIChatButton() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleClick = () => {
    router.push("/ai");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end gap-3">
        
        {/* AI聊天按钮 */}
        <Button
          onClick={handleClick}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
            "hover:scale-105 active:scale-95",
            "shadow-blue-500/25 hover:shadow-blue-500/40"
          )}
          aria-label="打开AI聊天"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}
