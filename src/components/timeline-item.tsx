/**
 * 时间线单条记录组件
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { Record } from '@/lib/types';
import { formatTime } from '@/lib/utils/date';
import { useRecords } from '@/lib/hooks/use-records';
import { useIsDesktop } from '@/lib/hooks/use-device-type';
import { toast } from 'sonner';

interface TimelineItemProps {
  record: Record;
}

// 检测是否为移动端
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export function TimelineItem({ record }: TimelineItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(record.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { updateRecord, deleteRecord } = useRecords();
  const isDesktop = useIsDesktop();
  
  // 检测移动端
  useEffect(() => {
    setIsMobileDevice(isMobile());
    
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 保存编辑
  const handleSave = useCallback(() => {
    const content = editContent.trim();
    
    if (!content) {
      toast.error('内容不能为空');
      return;
    }
    
    if (content === record.content) {
      setIsEditing(false);
      return;
    }
    
    try {
      updateRecord(record.id, content);
      setIsEditing(false);
      toast.success('✅ 已更新');
    } catch {
      toast.error('❌ 更新失败');
    }
  }, [editContent, record.id, record.content, updateRecord]);
  
  // 取消编辑
  const handleCancel = useCallback(() => {
    setEditContent(record.content);
    setIsEditing(false);
  }, [record.content]);
  
  // 删除确认
  const handleDeleteConfirm = useCallback(() => {
    try {
      deleteRecord(record.id);
      toast.success('🗑️ 已删除');
    } catch {
      toast.error('❌ 删除失败');
    }
    setIsDeleting(false);
  }, [record.id, deleteRecord]);
  
  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  }, [handleCancel, handleSave]);
  
  return (
    <>
      {/* 全局删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleting(false)}
      />
      
      <div className={`group relative rounded-xl border bg-background transition-all duration-300 ${
        isEditing 
          ? 'border-primary/40 shadow-lg shadow-primary/5 ring-2 ring-primary/10' 
          : 'border-border/30 hover:border-border/50 hover:shadow-md'
      }`}>
        <div className="p-4">
        <div className="flex items-center gap-3">
          {/* 时间标签 */}
          <div className="flex-shrink-0">
            <span className="text-xs text-muted-foreground/60 font-mono">
              {formatTime(record.createdAt)}
            </span>
          </div>
            
          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="relative rounded-[28px] border border-border/40 bg-muted/50 backdrop-blur-sm shadow-lg transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-xl focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.1)] focus-within:bg-background/50 p-4">
                {/* Textarea 编辑区 */}
                <div className="mb-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full min-h-[120px] text-[15px] leading-relaxed bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none placeholder:text-muted-foreground/60"
                    autoFocus
                    placeholder="输入你想记录的内容..."
                  />
                </div>
                
                {/* 底部按钮栏 - Lovable 风格 */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  {/* 快捷键提示 - 左侧，仅桌面端显示 */}
                  {isDesktop && (
                    <span className="text-xs text-muted-foreground/40 font-mono">
                      ⌘Enter 保存
                    </span>
                  )}
                  
                  {/* 右侧按钮组 */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button 
                      size="sm"
                      onClick={handleCancel}
                      className="h-8 px-3 text-xs rounded-lg bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground border-0 transition-all duration-200"
                    >
                      取消
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSave}
                      disabled={!editContent.trim() || editContent === record.content}
                      className="h-8 w-8 p-0 rounded-full bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center"
                      title="保存 (⌘Enter)"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-foreground/85">
                {record.content}
              </p>
            )}
          </div>
            
          {/* 操作按钮 - 响应式交互 */}
          {!isEditing && !isDeleting && (
            <div className={`flex-shrink-0 transition-all duration-200 ${
              isMobileDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary active:scale-95 transition-all duration-200"
                  onClick={() => setIsEditing(true)}
                  title="编辑"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all duration-200"
                  onClick={() => setIsDeleting(true)}
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 更新时间提示 */}
        {record.updatedAt.getTime() !== record.createdAt.getTime() && !isEditing && (
          <div className="mt-3 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <div className="w-1 h-1 rounded-full bg-primary/40"></div>
              <span>已编辑</span>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

