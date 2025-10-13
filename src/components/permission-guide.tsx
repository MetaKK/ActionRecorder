/**
 * 麦克风权限引导组件
 */

'use client';

import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PermissionGuideProps {
  error: string | null;
  isSupported: boolean;
  isListening: boolean;
}

export function PermissionGuide({ error, isSupported, isListening }: PermissionGuideProps) {
  // 不支持语音识别
  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                您的浏览器不支持语音识别
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                建议使用 Chrome 或 Edge 浏览器以获得最佳体验，或直接使用文本输入
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 有错误提示
  if (error) {
    const isPermissionError = error.includes('权限') || error.includes('not-allowed');
    
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
              {isPermissionError && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    如何允许麦克风权限：
                  </p>
                  <ol className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4 list-decimal">
                    <li>点击地址栏左侧的 🔒 图标</li>
                    <li>找到 &ldquo;麦克风&rdquo; 选项</li>
                    <li>选择 &ldquo;允许&rdquo;</li>
                    <li>刷新页面（按 F5）</li>
                  </ol>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    💡 提示：您也可以直接使用文本输入功能
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 正在录音
  if (isListening) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                正在录音中...
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                请对着麦克风清晰说话，识别结果将实时显示在输入框中
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 首次使用提示
  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              首次使用提示
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              点击 &ldquo;开始录音&rdquo; 时，浏览器会请求麦克风权限，请点击 &ldquo;允许&rdquo; 以使用语音识别功能
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

