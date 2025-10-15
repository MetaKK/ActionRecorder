"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AIChatButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push("/ai");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
              "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
              "hover:scale-105 active:scale-95"
            )}
            size="lg"
          >
            <div className="relative">
              <Bot className="h-6 w-6 text-white" />
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="h-3 w-3 text-yellow-300" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Button>
        </motion.div>
      </AnimatePresence>
      
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
          >
            <div className="text-center">
              <div className="font-medium">AI 助手</div>
              <div className="text-xs text-muted-foreground">
                点击开始聊天
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-popover" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
