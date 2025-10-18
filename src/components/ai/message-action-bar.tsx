/**
 * 消息操作栏组件 - 参考ChatGPT设计
 * 包含：复制、点赞、点踩、分享、重试等功能
 */

"use client";

import { useState } from "react";
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  RotateCcw,
  MoreHorizontal,
  CheckCheck,
  Globe,
  Zap,
  ArrowDown,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageActionBarProps {
  messageId: string;
  content: string;
  isAssistant: boolean;
  onCopy?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onShare?: () => void;
  onRegenerate?: () => void;
  onRegenerateWith?: (instruction: string) => void;
  className?: string;
}

export function MessageActionBar({
  messageId,
  content,
  isAssistant,
  onCopy,
  onLike,
  onDislike,
  onShare,
  onRegenerate,
  onRegenerateWith,
  className,
}: MessageActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [retryInstruction, setRetryInstruction] = useState("");
  const [showRetryMenu, setShowRetryMenu] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
    onLike?.();
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
    onDislike?.();
  };

  const handleShare = () => {
    onShare?.();
  };

  const handleRetry = () => {
    onRegenerate?.();
    setShowRetryMenu(false);
  };

  const handleRetryWithInstruction = () => {
    if (retryInstruction.trim()) {
      onRegenerateWith?.(retryInstruction);
      setRetryInstruction("");
      setShowRetryMenu(false);
    }
  };

  return (
    <div 
      className={cn(
        "z-0 flex min-h-[46px] justify-start",
        className
      )}
    >
      <div className={cn(
        "flex flex-wrap items-center gap-y-4 p-1 select-none duration-[1.5s]",
        "-mt-1 -ms-2.5 -me-1 w-[calc(100%+theme(spacing.2.5))]",
        // 移动端直接显示，桌面端hover显示
        "pointer-events-auto md:pointer-events-none",
        // 移动端不使用mask，桌面端使用
        "md:[mask-image:linear-gradient(to_right,black_33%,transparent_66%)]",
        "md:[mask-size:300%_100%] md:[mask-position:100%_0%]",
        "motion-safe:transition-[mask-position]",
        // 桌面端hover效果
        "md:group-hover/turn-messages:pointer-events-auto md:group-hover/turn-messages:[mask-position:0_0]",
        "md:group-focus-within/turn-messages:pointer-events-auto md:group-focus-within/turn-messages:[mask-position:0_0]",
        "has-[[data-state=open]]:pointer-events-auto has-[[data-state=open]]:[mask-position:0_0]"
      )}
      style={{ maskPosition: "0% 0%" }}
      >
        {/* 复制按钮 */}
        <button
          onClick={handleCopy}
          className={cn(
            "text-token-text-secondary hover:bg-token-bg-secondary active:bg-token-bg-secondary rounded-lg",
            "flex items-center justify-center",
            // 移动端更大的触摸区域
            "h-10 w-10 touch:h-12 touch:w-12 md:h-8 md:w-8",
            "transition-colors duration-200",
            "touch-manipulation" // 优化触摸响应
          )}
          aria-label="复制"
          aria-pressed="false"
          data-testid="copy-turn-action-button"
          data-state="closed"
        >
          <span className="flex items-center justify-center h-full w-full">
            {copied ? (
              <CheckCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </span>
        </button>

        {/* 点赞按钮 - 仅AI消息 */}
        {isAssistant && (
          <button
            onClick={handleLike}
            className={cn(
              "text-token-text-secondary hover:bg-token-bg-secondary active:bg-token-bg-secondary rounded-lg",
              "flex items-center justify-center",
              "h-10 w-10 touch:h-12 touch:w-12 md:h-8 md:w-8",
              "transition-colors duration-200",
              "touch-manipulation",
              liked && "text-blue-600"
            )}
            aria-label="最佳回复"
            aria-pressed={liked}
            data-testid="good-response-turn-action-button"
            data-state="closed"
          >
            <span className="flex items-center justify-center h-full w-full">
              <ThumbsUp className={cn("h-5 w-5", liked && "fill-current")} />
            </span>
          </button>
        )}

        {/* 点踩按钮 - 仅AI消息 */}
        {isAssistant && (
          <button
            onClick={handleDislike}
            className={cn(
              "text-token-text-secondary hover:bg-token-bg-secondary active:bg-token-bg-secondary rounded-lg",
              "flex items-center justify-center",
              "h-10 w-10 touch:h-12 touch:w-12 md:h-8 md:w-8",
              "transition-colors duration-200",
              "touch-manipulation",
              disliked && "text-red-600"
            )}
            aria-label="错误回复"
            aria-pressed={disliked}
            data-testid="bad-response-turn-action-button"
            data-state="closed"
          >
            <span className="flex items-center justify-center h-full w-full">
              <ThumbsDown className={cn("h-5 w-5", disliked && "fill-current")} />
            </span>
          </button>
        )}

        {/* 分享按钮 */}
        <button
          onClick={handleShare}
          className={cn(
            "text-token-text-secondary hover:bg-token-bg-secondary active:bg-token-bg-secondary rounded-lg",
            "flex items-center justify-center",
            "h-10 w-10 touch:h-12 touch:w-12 md:h-8 md:w-8",
            "transition-colors duration-200",
            "touch-manipulation"
          )}
          aria-label="共享"
          aria-pressed="false"
          data-state="closed"
        >
          <span className="flex items-center justify-center h-full w-full">
            <Share2 className="h-5 w-5" />
          </span>
        </button>

        {/* 重试菜单 - 仅AI消息 */}
        {isAssistant && (
          <DropdownMenu open={showRetryMenu} onOpenChange={setShowRetryMenu}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary active:bg-token-bg-secondary",
                  "rounded-md px-1.5",
                  "flex items-center",
                  "h-10 w-10 touch:h-12 touch:w-12 md:h-[30px] md:w-auto",
                  "transition-colors duration-200",
                  "touch-manipulation"
                )}
                aria-label="重试选项"
              >
                <div className="flex items-center h-full w-full justify-center">
                  <RotateCcw className="h-5 w-5" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className={cn(
                "z-50 max-w-xs rounded-2xl popover",
                "bg-white dark:bg-[#353535]",
                "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
                "will-change-[opacity,transform]",
                "py-1.5 min-w-[210px]",
                // 移动端优化
                "touch:min-w-[280px] touch:max-w-[90vw]",
                "touch:py-2"
              )}
            >
              {/* 要求更改输入框 */}
              <div className="relative mx-1.5 mb-1 w-[calc(100%-theme(spacing.3))]">
                <div className="absolute end-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center">
                  <button
                    onClick={handleRetryWithInstruction}
                    disabled={!retryInstruction.trim()}
                    className={cn(
                      "size-5 flex items-center justify-center",
                      "transition-opacity duration-200",
                      !retryInstruction.trim() && "opacity-30 cursor-not-allowed"
                    )}
                    aria-label="提交"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  value={retryInstruction}
                  onChange={(e) => setRetryInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRetryWithInstruction();
                    }
                  }}
                  className={cn(
                    "text-token-text-primary bg-token-bg-primary",
                    "m-[-1px] w-full min-w-[200px] rounded-[10px]",
                    "border-transparent px-2.5 py-2 text-sm",
                    "focus:ring-0 focus:ring-offset-0 focus:outline-hidden",
                    "disabled:opacity-50",
                    "ps-2.5 pe-9 dark:bg-transparent",
                    // 移动端优化
                    "touch:min-w-[240px] touch:py-3 touch:text-base",
                    "touch:placeholder:text-base"
                  )}
                  autoComplete="off"
                  placeholder="要求更改回复"
                  type="text"
                />
              </div>

              <DropdownMenuSeparator className="bg-token-border-default h-px mx-4 my-1" />

              {/* 重试选项 */}
              <DropdownMenuItem
                onClick={handleRetry}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5",
                  "rounded-lg cursor-pointer",
                  "hover:bg-token-bg-secondary active:bg-token-bg-secondary transition-colors",
                  // 移动端优化
                  "touch:py-4 touch:px-4 touch:gap-2"
                )}
              >
                <div className="flex items-center justify-center icon">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 grow items-center gap-2.5">
                  <div className="truncate touch:text-base">重试</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5",
                  "rounded-lg cursor-pointer",
                  "hover:bg-token-bg-secondary active:bg-token-bg-secondary transition-colors",
                  "touch:py-4 touch:px-4 touch:gap-2"
                )}
              >
                <div className="flex items-center justify-center icon">
                  <ArrowDown className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 grow items-center gap-2.5">
                  <div className="truncate touch:text-base">添加详细信息</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5",
                  "rounded-lg cursor-pointer",
                  "hover:bg-token-bg-secondary active:bg-token-bg-secondary transition-colors",
                  "touch:py-4 touch:px-4 touch:gap-2"
                )}
              >
                <div className="flex items-center justify-center icon">
                  <ArrowUp className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 grow items-center gap-2.5">
                  <div className="truncate touch:text-base">更加简洁</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-token-border-default h-px mx-4 my-1" />

              <DropdownMenuItem
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5",
                  "rounded-lg cursor-pointer",
                  "hover:bg-token-bg-secondary active:bg-token-bg-secondary transition-colors",
                  "touch:py-4 touch:px-4 touch:gap-2"
                )}
              >
                <div className="flex items-center justify-center icon">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 grow items-center gap-2.5">
                  <div className="truncate touch:text-base">搜索网页</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5",
                  "rounded-lg cursor-pointer",
                  "hover:bg-token-bg-secondary active:bg-token-bg-secondary transition-colors",
                  "touch:py-4 touch:px-4 touch:gap-2"
                )}
              >
                <div className="flex items-center justify-center icon">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 grow items-center gap-2.5">
                  <div className="truncate touch:text-base">思考时间更长</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 更多操作按钮 */}
        <button
          className={cn(
            "text-token-text-secondary hover:bg-token-bg-secondary active:bg-token-bg-secondary",
            "flex items-center justify-center rounded-lg",
            "h-10 w-10 touch:h-12 touch:w-12 md:h-8 md:w-8",
            "transition-colors duration-200",
            "touch-manipulation"
          )}
          aria-label="更多操作"
          type="button"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
