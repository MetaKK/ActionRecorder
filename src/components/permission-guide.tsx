/**
 * 麦克风权限引导组件
 */

'use client';

interface PermissionGuideProps {
  error: string | null;
  isSupported: boolean;
  isListening: boolean;
}

export function PermissionGuide({ error, isSupported }: PermissionGuideProps) {
  // 不支持语音识别 - Notion 风格极简提示
  if (!isSupported) {
    return (
      <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 px-3 py-2">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          浏览器不支持语音识别，建议使用 Chrome 或 Edge
        </p>
      </div>
    );
  }

  // 有错误提示 - Notion 风格精简
  if (error) {
    const isPermissionError = error.includes('权限') || error.includes('not-allowed');
    
    return (
      <div className="rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 px-3 py-2">
        <p className="text-xs text-red-700 dark:text-red-400">
          {isPermissionError ? '麦克风权限被拒绝 - 点击地址栏 🔒 → 麦克风 → 允许' : error}
        </p>
      </div>
    );
  }

  // 正在录音或首次使用 - 不显示大卡片，状态已在输入框底部显示
  return null;
}

