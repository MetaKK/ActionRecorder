/**
 * 增强的 Tiptap 编辑器菜单栏
 * 包含粘性工具栏和选中文本快捷菜单
 * 基于 Apple 设计原则和 Notion 最佳实践
 */

'use client';

import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Link as LinkIcon,
  MoreHorizontal,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { validateFile, uploadFileToIndexedDB, MediaType } from '@/lib/utils/media-upload-simple';
import { toast } from 'sonner';

interface TiptapMenuEnhancedProps {
  editor: Editor | null;
}

const MenuButton = ({ 
  onClick, 
  isActive, 
  disabled, 
  children,
  title,
  variant = 'default'
}: { 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'bubble';
}) => {
  const baseClasses = cn(
    'p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0',
    'disabled:opacity-30 disabled:cursor-not-allowed',
    'active:scale-95 touch-manipulation'
  );

  if (variant === 'bubble') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        type="button"
        className={cn(
          baseClasses,
          'hover:bg-white/10',
          isActive && 'bg-white/20'
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      className={cn(
        baseClasses,
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isActive && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
      )}
    >
      {children}
    </button>
  );
};

const MenuDivider = ({ variant = 'default' }: { variant?: 'default' | 'bubble' }) => (
  <div className={cn(
    'w-px h-5 sm:h-6 flex-shrink-0',
    variant === 'bubble' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
  )} />
);

export function TiptapMenuEnhanced({ editor }: TiptapMenuEnhancedProps) {
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editor) {
      setIsEditorReady(true);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const colors = [
    { name: '默认', value: null },
    { name: '温暖', value: '#f59e0b' },
    { name: '喜悦', value: '#10b981' },
    { name: '平静', value: '#3b82f6' },
    { name: '浪漫', value: '#ec4899' },
    { name: '深沉', value: '#6366f1' },
  ];

  // 处理文件上传
  const handleFileUpload = async (files: FileList | null, type: MediaType) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 验证文件
    const validation = validateFile(file, type);
    if (!validation.valid) {
      toast.error(validation.error || '文件验证失败');
      return;
    }

    try {
      toast.loading('正在上传...');
      const dataUrl = await uploadFileToIndexedDB(file);
      
      if (type === 'image') {
        editor.chain().focus().setImage({ src: dataUrl }).run();
        toast.success('图片已插入');
      } else if (type === 'video') {
        editor.chain().focus().insertContent({
          type: 'paragraph',
          content: [{
            type: 'text',
            marks: [{ type: 'link', attrs: { href: dataUrl }}],
            text: `🎬 ${file.name}`
          }]
        }).run();
        toast.success('视频已插入');
      } else if (type === 'audio') {
        editor.chain().focus().insertContent({
          type: 'paragraph',
          content: [{
            type: 'text',
            marks: [{ type: 'link', attrs: { href: dataUrl }}],
            text: `🎵 ${file.name}`
          }]
        }).run();
        toast.success('音频已插入');
      } else if (type === 'file') {
        editor.chain().focus().insertContent({
          type: 'paragraph',
          content: [{
            type: 'text',
            marks: [{ type: 'link', attrs: { href: dataUrl }}],
            text: `📎 ${file.name}`
          }]
        }).run();
        toast.success('文件已插入');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败，请重试');
    }
  };

  return (
    <>
      {/* 顶部粘性工具栏 */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-2 sm:p-3 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap overflow-x-auto">
          {/* 基础格式 */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="粗体 (Ctrl+B)"
          >
            <Bold className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="下划线 (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="删除线"
          >
            <Strikethrough className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>

          <MenuDivider />

          {/* 段落格式 */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="标题"
          >
            <Heading3 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="无序列表"
          >
            <List className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="引用"
          >
            <Quote className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>

          <MenuDivider />

          {/* 颜色和高亮 */}
          <div className="relative group">
            <MenuButton
              onClick={() => setShowMoreTools(!showMoreTools)}
              isActive={showMoreTools}
              title="颜色"
            >
              <Palette className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </MenuButton>
            
            {showMoreTools && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 min-w-[200px]">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">文字颜色</div>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          if (color.value) {
                            editor.chain().focus().setColor(color.value).run();
                          } else {
                            editor.chain().focus().unsetColor().run();
                          }
                        }}
                        className={cn(
                          'w-7 h-7 rounded-lg border-2 transition-all hover:scale-110',
                          editor.isActive('textStyle', { color: color.value })
                            ? 'border-blue-500'
                            : 'border-gray-200 dark:border-gray-700'
                        )}
                        style={{ backgroundColor: color.value || '#ffffff' }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="高亮"
          >
            <Highlighter className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>

          <MenuDivider />

          {/* 媒体插入 - 隐藏的文件输入 */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files, 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileUpload(e.target.files, 'video')}
            className="hidden"
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileUpload(e.target.files, 'audio')}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={(e) => handleFileUpload(e.target.files, 'file')}
            className="hidden"
          />

          {/* 图片 */}
          <MenuButton
            onClick={() => imageInputRef.current?.click()}
            title="插入图片"
          >
            <ImageIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>

          {/* 视频 */}
          <MenuButton
            onClick={() => videoInputRef.current?.click()}
            title="插入视频"
          >
            <VideoIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>

          {/* 音频 */}
          <MenuButton
            onClick={() => audioInputRef.current?.click()}
            title="插入音频"
          >
            <Music className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>

          <MenuDivider />

          {/* 撤销/重做 */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </MenuButton>
        </div>
      </div>

      {/* Bubble Menu - 暂时禁用，等待正确的实现方式 */}
      {/* 顶部粘性工具栏已提供所有必要功能 */}
    </>
  );
}
