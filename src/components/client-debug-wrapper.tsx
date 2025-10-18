/**
 * 客户端调试面板包装器
 * 解决 Next.js 15 中 Server Components 不能使用 ssr: false 的问题
 */

'use client';

import { isDebugEnabled } from '@/lib/utils/env';
import dynamic from 'next/dynamic';

// 动态导入调试面板，只在客户端加载
const GlobalDebugPanel = isDebugEnabled() 
  ? dynamic(
      () => import("@/components/global-debug-panel").then(mod => ({ default: mod.GlobalDebugPanel })),
      { ssr: false }
    )
  : () => null;

export function ClientDebugWrapper() {
  // 如果不在调试模式，不渲染
  if (!isDebugEnabled()) {
    return null;
  }

  return <GlobalDebugPanel />;
}
