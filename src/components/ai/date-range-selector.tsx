/**
 * 日期范围选择器 - Apple 风格气泡弹窗
 * 支持今日、7天、30天选择
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronUp, Check } from 'lucide-react';

export interface DateRange {
  label: string;
  value: 'today' | '7days' | '30days';
  description: string;
}

const dateRanges: DateRange[] = [
  {
    label: '今日',
    value: 'today',
    description: ''
  },
  {
    label: '近7天',
    value: '7days', 
    description: ''
  },
  {
    label: '近30天',
    value: '30days',
    description: ''
  }
];

interface DateRangeSelectorProps {
  selectedRange: DateRange['value'];
  onRangeChange: (range: DateRange['value']) => void;
  recordCount: number;
  wordCount: number;
}

export function DateRangeSelector({ 
  selectedRange, 
  onRangeChange, 
  recordCount, 
  wordCount 
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentRange = dateRanges.find(r => r.value === selectedRange);
  
  return (
    <div className="relative">
      {/* 可点击的数据显示 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer flex items-center gap-1 group"
      >
        <span>
          {currentRange?.label}数据：{recordCount} 个片段，{wordCount} 字
        </span>
        <ChevronUp 
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } group-hover:scale-110`} 
        />
      </button>
      
      {/* 向上气泡弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 气泡弹窗 - 参考样板样式 */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute bottom-full left-0 mb-2 z-50 w-48 rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200/60 dark:border-gray-700/60 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl overflow-hidden"
              role="menu"
              aria-orientation="vertical"
              data-state="open"
            >
              <div className="p-1.5">
                {dateRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      onRangeChange(range.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-[12px] transition-all duration-150 flex items-center gap-2.5 text-sm font-medium cursor-pointer group ${
                      selectedRange === range.value
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-gray-100'
                    }`}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="text-[14px] font-medium">{range.label}</span>
                    {selectedRange === range.value && (
                      <Check className="w-4 h-4 text-blue-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
