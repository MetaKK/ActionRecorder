'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppleSelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
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
          "w-full px-4 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl",
          "border-0 rounded-2xl text-gray-900 dark:text-gray-100",
          "focus:ring-4 focus:ring-blue-500/20 focus:outline-none",
          "transition-all duration-300 shadow-lg hover:shadow-xl",
          "cursor-pointer font-medium text-sm",
          "flex items-center justify-between",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "shadow-xl ring-4 ring-blue-500/20"
        )}
        style={{
          boxShadow: isOpen 
            ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)' 
            : '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-2",
            "bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl",
            "rounded-2xl shadow-2xl border border-gray-200/20 dark:border-gray-700/20",
            "max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/60 dark:scrollbar-thumb-gray-600/60 scrollbar-track-transparent",
            "animate-in slide-in-from-top-2 duration-200"
          )}
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
            <div key={groupName}>
              {groupName !== 'default' && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                      "px-4 py-3 cursor-pointer transition-all duration-150",
                      "flex items-center justify-between",
                      "hover:bg-gray-50/80 dark:hover:bg-gray-700/50",
                      isSelected && "bg-blue-50/80 dark:bg-blue-900/20",
                      isFocused && "bg-gray-100/80 dark:bg-gray-700/80",
                      option.disabled && "opacity-50 cursor-not-allowed",
                      "first:rounded-t-2xl last:rounded-b-2xl"
                    )}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </span>
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