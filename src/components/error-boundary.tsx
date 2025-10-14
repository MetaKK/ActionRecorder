/**
 * 错误边界组件
 * 捕获组件树中的JavaScript错误，优雅降级
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 错误日志（生产环境可发送到监控服务）
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 自定义错误处理
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 自定义fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-8">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">出错了</h2>
          </div>
          
          <p className="text-center text-sm text-muted-foreground max-w-md">
            {this.state.error?.message || '应用遇到了意外错误'}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full max-w-2xl rounded-md border border-border bg-muted/30 p-4">
              <summary className="cursor-pointer text-sm font-medium">
                错误详情（仅开发环境显示）
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <Button
            onClick={this.handleReset}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

