/**
 * 调试面板组件
 * 仅在开发环境或启用调试模式时显示
 */

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Minimize2, Maximize2, Move } from 'lucide-react';
import { isDebugEnabled } from '@/lib/utils/env';

interface DebugPanelProps {
  /** 面板标题 */
  title?: string;
  /** 初始位置 */
  initialPosition?: { x: number; y: number };
  /** 初始是否折叠 */
  initialCollapsed?: boolean;
  /** 子元素 */
  children?: React.ReactNode;
  /** 是否可以最小化 */
  canMinimize?: boolean;
  /** 是否可以关闭 */
  canClose?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

export function DebugPanel({
  title = '调试面板',
  initialPosition,
  initialCollapsed = false,
  children,
  canMinimize = true,
  canClose = true,
  onClose
}: DebugPanelProps) {
  // 计算初始位置
  const defaultPosition = useMemo(() => {
    if (initialPosition) return initialPosition;
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - 320 : 100,
      y: 80
    };
  }, [initialPosition]);

  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isClosed, setIsClosed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);

  // 处理关闭
  const handleClose = useCallback(() => {
    setIsClosed(true);
    onClose?.();
  }, [onClose]);

  // 切换折叠状态
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // 处理拖动开始
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  }, []);

  // 处理拖动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 使用 useMemo 来决定是否渲染，避免 hooks 顺序问题
  const shouldRender = useMemo(() => {
    return isDebugEnabled() && !isClosed;
  }, [isClosed]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div className="min-w-[280px] max-w-[400px] rounded-lg border border-zinc-700 bg-black/90 text-white shadow-2xl backdrop-blur-sm">
        {/* 头部 - 可拖动 */}
        <div
          className="flex items-center justify-between border-b border-zinc-700 px-3 py-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Move className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-semibold">{title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {canMinimize && (
              <button
                onClick={toggleCollapse}
                className="rounded p-1 hover:bg-zinc-800 transition-colors"
                title={isCollapsed ? '展开' : '折叠'}
              >
                {isCollapsed ? (
                  <Maximize2 className="h-3.5 w-3.5" />
                ) : (
                  <Minimize2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            
            {canClose && (
              <button
                onClick={handleClose}
                className="rounded p-1 hover:bg-red-600/20 hover:text-red-500 transition-colors"
                title="关闭"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        {!isCollapsed && (
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 性能监控调试面板
 */
interface PerformanceDebugPanelProps {
  activeTab?: string;
  isLoading?: boolean;
  additionalInfo?: Record<string, any>;
}

export function PerformanceDebugPanel({
  activeTab,
  isLoading,
  additionalInfo = {}
}: PerformanceDebugPanelProps) {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0
  });

  const startTimeRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // 监控加载时间
  useEffect(() => {
    if (isLoading && !isTrackingRef.current) {
      startTimeRef.current = performance.now();
      isTrackingRef.current = true;
    } else if (!isLoading && isTrackingRef.current) {
      const loadTime = performance.now() - startTimeRef.current;
      setMetrics(prev => ({ ...prev, loadTime }));
      isTrackingRef.current = false;
    }
  }, [isLoading]);

  // 监控FPS和内存
  useEffect(() => {
    const updateMetrics = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: 'memory' in performance 
            ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
            : 0
        }));
      }
      
      frameCountRef.current++;
      requestAnimationFrame(updateMetrics);
    };

    const animationId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // 使用 useMemo 来决定是否渲染
  const shouldRender = useMemo(() => {
    return isDebugEnabled();
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <DebugPanel title="性能监控" initialCollapsed={false}>
      <div className="space-y-2 font-mono text-xs">
        {/* 基本信息 */}
        <div className="rounded bg-zinc-800/50 p-2">
          <div className="mb-1 text-[10px] font-semibold text-zinc-400">系统信息</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">环境:</span>
              <span className="text-green-400">{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">时间:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* 性能指标 */}
        <div className="rounded bg-zinc-800/50 p-2">
          <div className="mb-1 text-[10px] font-semibold text-zinc-400">性能指标</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">FPS:</span>
              <span className={metrics.fps >= 50 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
                {metrics.fps}
              </span>
            </div>
            {metrics.memoryUsage > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-400">内存:</span>
                <span className={metrics.memoryUsage < 100 ? 'text-green-400' : 'text-yellow-400'}>
                  {metrics.memoryUsage} MB
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-400">加载:</span>
              <span className={metrics.loadTime < 100 ? 'text-green-400' : metrics.loadTime < 300 ? 'text-yellow-400' : 'text-red-400'}>
                {metrics.loadTime.toFixed(2)} ms
              </span>
            </div>
          </div>
        </div>

        {/* Tab信息 */}
        {activeTab && (
          <div className="rounded bg-zinc-800/50 p-2">
            <div className="mb-1 text-[10px] font-semibold text-zinc-400">Tab状态</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">当前Tab:</span>
                <span className="text-blue-400">{activeTab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">加载中:</span>
                <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
                  {isLoading ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 额外信息 */}
        {Object.keys(additionalInfo).length > 0 && (
          <div className="rounded bg-zinc-800/50 p-2">
            <div className="mb-1 text-[10px] font-semibold text-zinc-400">额外信息</div>
            <div className="space-y-1">
              {Object.entries(additionalInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-zinc-400">{key}:</span>
                  <span className="text-blue-400">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DebugPanel>
  );
}
