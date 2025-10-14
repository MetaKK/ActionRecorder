/**
 * 时间线单条记录组件
 * 性能优化：使用 React.memo 避免不必要的重渲染
 */

'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Pencil, Trash2, Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { LazyAudioPlayer } from '@/components/lazy-audio-player';
import { ImageGrid } from '@/components/image-grid';
import { Record } from '@/lib/types';
import { formatShortDateTime } from '@/lib/utils/date';
import { formatLocation } from '@/lib/hooks/use-location';
import { useRecords } from '@/lib/hooks/use-records';
import { useIsDesktop } from '@/lib/hooks/use-device-type';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

interface TimelineItemProps {
  record: Record;
}

// 检测是否为移动端
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

const TimelineItemComponent = function TimelineItem({ record }: TimelineItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(record.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { updateRecord, deleteRecord } = useRecords();
  const isDesktop = useIsDesktop();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 检测移动端
  useEffect(() => {
    setIsMobileDevice(isMobile());
    
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // ⭐ 修复光标位置偏移问题
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // 使用 requestAnimationFrame 确保 DOM 完全渲染和样式应用完毕后再 focus
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          
          // Focus textarea
          textarea.focus();
          
          // 将光标移动到文本末尾
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
          
          // 滚动到光标位置
          textarea.scrollTop = textarea.scrollHeight;
        }
      });
    }
  }, [isEditing]);
  
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
          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="relative rounded-[28px] border border-border/40 bg-muted/50 backdrop-blur-sm shadow-lg transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-xl focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.1)] focus-within:bg-background/50 p-4">
                {/* Textarea 编辑区 */}
                <div className="mb-3">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[120px] text-[15px] leading-relaxed bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none placeholder:text-muted-foreground/60"
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
              <div className="space-y-3">
                {/* 文本内容 */}
                {record.content && (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-foreground/85">
                    {record.content}
                  </p>
                )}
                
                {/* 音频播放器 - 懒加载 */}
                {record.hasAudio && record.audioData && (
                  <div className="pt-1">
                    <LazyAudioPlayer 
                      audioData={record.audioData} 
                      duration={record.audioDuration || 0}
                    />
                  </div>
                )}
                
                {/* 图片展示 */}
                {record.hasImages && record.images && record.images.length > 0 && (
                  <div className="pt-1">
                    <ImageGrid
                      images={record.images}
                      readonly
                    />
                  </div>
                )}
                
                {/* 时间和位置信息同一行 */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                  {/* 时间 */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">
                      {formatShortDateTime(record.createdAt)}
                    </span>
                  </div>
                  
                  {/* 位置信息 */}
                  {record.location && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-500/60 flex-shrink-0" />
                        <span 
                          className="font-medium text-blue-600/80 dark:text-blue-400/80"
                          title={formatLocation(record.location)}
                        >
                          {record.location.city || '位置已记录'}
                          {record.location.district && `, ${record.location.district}`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
            
          {/* 操作菜单 - 三个点 */}
          {!isEditing && !isDeleting && (
            <div className={`flex-shrink-0 transition-all duration-200 ${
              isMobileDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg hover:bg-muted active:scale-95 transition-all duration-200"
                    title="更多操作"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleting(true)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
};

// 使用 memo 优化性能，仅当 record 变化时才重新渲染
export const TimelineItem = memo(TimelineItemComponent, (prevProps, nextProps) => {
  // 自定义比较函数：比较 record 的关键属性
  return (
    prevProps.record.id === nextProps.record.id &&
    prevProps.record.content === nextProps.record.content &&
    prevProps.record.updatedAt.getTime() === nextProps.record.updatedAt.getTime() &&
    prevProps.record.hasAudio === nextProps.record.hasAudio &&
    prevProps.record.hasImages === nextProps.record.hasImages
  );
});

