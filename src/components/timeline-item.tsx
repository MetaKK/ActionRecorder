/**
 * 时间线单条记录组件
 */

'use client';

import { useState, useCallback } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* 时间标签 */}
          <div className="flex-shrink-0">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
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
                  className="min-h-[80px] text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {record.content}
              </p>
            )}
          </div>
          
          {/* 操作按钮 */}
          {!isEditing && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 更新时间提示 */}
        {record.updatedAt.getTime() !== record.createdAt.getTime() && !isEditing && (
          <div className="mt-2 text-xs text-muted-foreground">
            已编辑
          </div>
        )}
      </CardContent>
    </Card>
  );
}

