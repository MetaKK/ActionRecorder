/**
 * 全局删除确认对话框组件
 */

'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ isOpen, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 全屏遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onCancel}
      />
      
      {/* 模态框 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border/50 p-6 space-y-5 pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 警告图标 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
          </div>
          
          {/* 提示文字 */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">删除确认</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              确定要删除这条记录吗？<br />
              <span className="text-destructive/80 font-medium">此操作无法撤销</span>
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex flex-col gap-2">
            <Button 
              size="default"
              variant="destructive"
              onClick={onConfirm}
              className="w-full h-11 rounded-xl font-medium shadow-lg shadow-destructive/20 hover:shadow-destructive/30 transition-all"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              确认删除
            </Button>
            <Button 
              size="default"
              variant="outline"
              onClick={onCancel}
              className="w-full h-11 rounded-xl font-medium border-2 hover:bg-accent/50"
            >
              取消
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

