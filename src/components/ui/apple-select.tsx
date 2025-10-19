'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppleSelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
}

interface AppleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AppleSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AppleSelect({
  value,
  onChange,
  options,
  placeholder = "请选择...",
  className,
  disabled = false
}: AppleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);

  // 获取当前选中的选项
  const selectedOption = options.find(option => option.value === value);

  // 按组分类选项
  const groupedOptions = options.reduce((acc, option) => {
    const group = option.group || 'default';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(option);
    return acc;
  }, {} as Record<string, AppleSelectOption[]>);

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= options.length ? 0 : nextIndex;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => {
            const prevIndex = prev - 1;
            return prevIndex < 0 ? options.length - 1 : prevIndex;
          });
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
            setFocusedIndex(-1);
          }
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={selectRef}
      className={cn("relative", className)}
      onKeyDown={handleKeyDown}
    >
      {/* 触发器 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2.5 bg-white dark:bg-gray-800",
          "border border-gray-200 dark:border-gray-700 rounded-lg",
          "focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
          "transition-all duration-200 shadow-sm hover:shadow-md",
          "cursor-pointer font-medium text-sm",
          "flex items-center justify-between",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500/20 shadow-md"
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1",
            "bg-white dark:bg-gray-800",
            "rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            "max-h-64 overflow-y-auto",
            "animate-in slide-in-from-top-1 duration-150"
          )}
        >
          {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
            <div key={groupName}>
              {groupName !== 'default' && (
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                  {groupName}
                </div>
              )}
              {groupOptions.map((option, index) => {
                const globalIndex = options.indexOf(option);
                const isSelected = option.value === value;
                const isFocused = globalIndex === focusedIndex;
                
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                        setFocusedIndex(-1);
                      }
                    }}
                    className={cn(
                      "px-3 py-2.5 cursor-pointer transition-colors duration-150",
                      "flex items-center justify-between",
                      "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20",
                      isFocused && "bg-gray-100 dark:bg-gray-700/80",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {option.isRecommended && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            推荐
                          </span>
                        )}
                        {option.isNew && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            新
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}