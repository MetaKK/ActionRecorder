/**
 * 调试上下文
 * 用于在页面和全局调试面板之间传递信息
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { isDebugEnabled } from '@/lib/utils/env';

interface DebugInfo {
  activeTab?: string;
  isLoading?: boolean;
  recordsCount?: number;
  transitionDirection?: string;
  customData?: Record<string, any>;
  [key: string]: any;
}

interface DebugContextType {
  debugInfo: DebugInfo;
  updateDebugInfo: (info: Partial<DebugInfo>) => void;
  clearDebugInfo: () => void;
}

const DebugContext = createContext<DebugContextType | null>(null);

interface DebugProviderProps {
  children: ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  const updateDebugInfo = useCallback((info: Partial<DebugInfo>) => {
    if (!isDebugEnabled()) return;
    
    setDebugInfo(prev => ({
      ...prev,
      ...info,
      lastUpdated: Date.now()
    }));
  }, []);

  const clearDebugInfo = useCallback(() => {
    if (!isDebugEnabled()) return;
    
    setDebugInfo({});
  }, []);

  // 如果不在调试模式，不提供上下文
  if (!isDebugEnabled()) {
    return <>{children}</>;
  }

  return (
    <DebugContext.Provider value={{ debugInfo, updateDebugInfo, clearDebugInfo }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugContext() {
  const context = useContext(DebugContext);
  
  if (!context) {
    // 如果不在调试模式或没有提供者，返回空函数
    return {
      debugInfo: {},
      updateDebugInfo: () => {},
      clearDebugInfo: () => {}
    };
  }
  
  return context;
}

