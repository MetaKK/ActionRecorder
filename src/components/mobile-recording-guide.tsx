/**
 * 移动端录音功能指南
 */

'use client';

import { AlertCircle, Smartphone, Chrome, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MobileRecordingGuide() {
  return (
    <div className="space-y-3">
      <Alert className="border-amber-400/40 bg-gradient-to-r from-amber-400/10 to-orange-400/10">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-700 dark:text-amber-300">
          移动端录音功能说明
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Chrome className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-foreground/90">推荐浏览器</p>
                <p className="text-xs">
                  Chrome、Edge、Safari 浏览器对录音功能支持最佳
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-foreground/90">需要 HTTPS</p>
                <p className="text-xs">
                  录音功能需要安全连接（HTTPS）才能使用
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-foreground/90">权限授予</p>
                <p className="text-xs">
                  首次使用时，请允许浏览器访问麦克风权限
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-amber-400/20">
            <p className="text-xs text-muted-foreground/80">
              💡 提示：如果录音功能无法使用，请检查：
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground/80 list-disc list-inside">
              <li>是否已授予麦克风权限</li>
              <li>是否使用 HTTPS 访问</li>
              <li>浏览器是否支持录音API</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

