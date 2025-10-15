"use client";

import { AI_MODELS } from "@/lib/ai/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function AIModelSelector({
  selectedModel,
  onModelChange,
}: AIModelSelectorProps) {
  const selectedModelInfo = AI_MODELS.find((model) => model.id === selectedModel);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">模型:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {selectedModelInfo?.name || "选择模型"}
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {AI_MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
              className="flex flex-col items-start gap-1 p-3"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-medium">{model.name}</span>
                {selectedModel === model.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {model.description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
