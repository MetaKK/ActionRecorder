/**
 * 时间线单条记录组件
 */

'use client';

import { useState, useCallback } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Record } from '@/lib/types';
import { formatTime } from '@/lib/utils/date';
import { useRecords } from '@/lib/hooks/use-records';
import { toast } from 'sonner';

interface TimelineItemProps {
  record: Record;
}

export function TimelineItem({ record }: TimelineItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(record.content);
  const { updateRecord, deleteRecord } = useRecords();
  
  // 保存编辑
  const handleSave = useCallback(() => {
    const content = editContent.trim();
    
    if (!content) {
      toast.error('内容不能为空');
      return;
    }
    
    try {
      updateRecord(record.id, content);
      setIsEditing(false);
      toast.success('已更新');
    } catch {
      toast.error('更新失败');
    }
  }, [editContent, record.id, updateRecord]);
  
  // 取消编辑
  const handleCancel = useCallback(() => {
    setEditContent(record.content);
    setIsEditing(false);
  }, [record.content]);
  
  // 删除记录
  const handleDelete = useCallback(() => {
    if (window.confirm('确定要删除这条记录吗？')) {
      try {
        deleteRecord(record.id);
        toast.success('已删除');
      } catch {
        toast.error('删除失败');
      }
    }
  }, [record.id, deleteRecord]);
  
  return (
    <div className="group rounded-lg border border-border/30 bg-background hover:bg-accent/30 hover:border-border/50 transition-all duration-200 p-4">
      <div className="flex gap-3">
        {/* 时间标签 - Notion 风格精简 */}
        <div className="flex-shrink-0">
          <span className="text-xs text-muted-foreground/60 font-mono">
            {formatTime(record.createdAt)}
          </span>
        </div>
          
        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] text-[15px] rounded-lg border focus:border-foreground/20"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="h-7 text-xs rounded-md">
                  <Check className="h-3 w-3 mr-1" />
                  保存
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs rounded-md">
                  <X className="h-3 w-3 mr-1" />
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-foreground/80">
              {record.content}
            </p>
          )}
        </div>
          
        {/* 操作按钮 - Notion 风格更隐蔽 */}
        {!isEditing && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <div className="flex gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md hover:bg-accent"
                onClick={() => setIsEditing(true)}
                title="编辑"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                title="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* 更新时间提示 */}
      {record.updatedAt.getTime() !== record.createdAt.getTime() && !isEditing && (
        <div className="mt-2 ml-14">
          <span className="text-[11px] text-muted-foreground/50">已编辑</span>
        </div>
      )}
    </div>
  );
}

