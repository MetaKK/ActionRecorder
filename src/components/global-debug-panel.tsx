/**
 * 全局调试面板组件
 * 在所有页面显示，通过上下文接收页面信息
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PerformanceDebugPanel } from './debug-panel';
import { useDebugContext } from '@/lib/contexts/debug-context';
import { isDebugEnabled } from '@/lib/utils/env';

export function GlobalDebugPanel() {
  const [currentPath, setCurrentPath] = useState('');
  const pathname = usePathname();
  const { debugInfo } = useDebugContext();

  // 更新当前路径
  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  // 如果不在调试模式，不渲染
  if (!isDebugEnabled()) {
    return null;
  }

  // 合并页面信息
  const additionalInfo = {
    currentPath,
    timestamp: new Date().toISOString(),
    ...debugInfo
  };

  return (
    <PerformanceDebugPanel
      activeTab={debugInfo.activeTab}
      isLoading={debugInfo.isLoading}
      additionalInfo={additionalInfo}
    />
  );
}

