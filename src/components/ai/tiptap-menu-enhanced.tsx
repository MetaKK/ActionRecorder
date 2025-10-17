/**
 * 增强的 Tiptap 编辑器菜单栏
 * 基于 Apple 设计原则和 Notion 编辑器最佳实践
 * 
 * 设计理念：
 * 1. 按使用频率排序：文本格式 > 段落格式 > 颜色 > 媒体 > 撤销/重做
 * 2. 视觉分组：使用分隔符明确区分功能组
 * 3. 直观反馈：活跃状态清晰可见
 * 4. 响应式设计：移动端和桌面端都有良好体验
 */

'use client';

import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editor) {
      // Editor is ready
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  // 颜色配置 - 基于情感和场景的颜色选择
  const textColors = [
    { name: '默认', value: null, bg: '#ffffff', border: '#e5e7eb' },
    { name: '温暖橙', value: '#ea580c', bg: '#fed7aa', border: '#fdba74' },
    { name: '活力红', value: '#dc2626', bg: '#fecaca', border: '#fca5a5' },
    { name: '平静蓝', value: '#2563eb', bg: '#bfdbfe', border: '#93c5fd' },
    { name: '清新绿', value: '#16a34a', bg: '#bbf7d0', border: '#86efac' },
    { name: '优雅紫', value: '#9333ea', bg: '#e9d5ff', border: '#d8b4fe' },
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

    let loadingToastId: string | number | undefined;
    
    try {
      loadingToastId = toast.loading('正在处理...');
      const dataUrl = await uploadFileToIndexedDB(file);
      
      // 清除 loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      if (type === 'image') {
        editor.chain().focus().insertContent({
          type: 'image',
          attrs: { src: dataUrl }
        }).run();
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
      console.error('处理失败:', error);
      // 清除 loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error('处理失败，请重试');
    }
  };

  return (
    <>
      {/* 粘性工具栏 - 基于 Apple 和 Notion 设计原则 */}
      <div className="sticky top-0 z-10 bg-white/98 dark:bg-gray-900/98 backdrop-blur-lg border-b border-gray-200/80 dark:border-gray-700/80 shadow-sm">
        <div className="px-3 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-0.5 min-w-max">
            
            {/* 第一组：文本样式（最高频） */}
            <div className="flex items-center gap-0.5">
              <MenuButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="粗体 (⌘B)"
              >
                <Bold className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="斜体 (⌘I)"
              >
                <Italic className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="下划线 (⌘U)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="删除线"
              >
                <Strikethrough className="w-4 h-4" />
              </MenuButton>
            </div>

            <MenuDivider />

            {/* 第二组：段落格式 */}
            <div className="flex items-center gap-0.5">
              <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="大标题"
              >
                <Heading2 className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="小标题"
              >
                <Heading3 className="w-4 h-4" />
              </MenuButton>
            </div>

            <MenuDivider />

            {/* 第三组：列表 */}
            <div className="flex items-center gap-0.5">
              <MenuButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="无序列表"
              >
                <List className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="有序列表"
              >
                <ListOrdered className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="引用"
              >
                <Quote className="w-4 h-4" />
              </MenuButton>
            </div>

            <MenuDivider />

            {/* 第四组：文字颜色（精致的颜色选择器） */}
            <div className="flex items-center gap-1 px-1">
              {textColors.map((color) => (
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
                    'relative w-5 h-5 rounded-md transition-all hover:scale-110 flex-shrink-0',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400',
                    editor.isActive('textStyle', { color: color.value })
                      ? 'ring-2 ring-blue-500 ring-offset-1'
                      : 'hover:ring-1 hover:ring-gray-300'
                  )}
                  style={{ 
                    backgroundColor: color.bg,
                    borderWidth: '1.5px',
                    borderColor: color.border,
                  }}
                  title={color.name}
                  aria-label={color.name}
                >
                  {/* 默认颜色显示一个小斜线 */}
                  {!color.value && (
                    <Minus className="w-3 h-3 text-gray-400 absolute inset-0 m-auto rotate-45" strokeWidth={2} />
                  )}
                </button>
              ))}
              
              <MenuButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                title="高亮背景"
              >
                <Highlighter className="w-4 h-4" />
              </MenuButton>
            </div>

            <MenuDivider />

            {/* 第五组：媒体插入 */}
            <div className="flex items-center gap-0.5">
              {/* 隐藏的文件输入 */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'image')}
                className="hidden"
                aria-label="上传图片"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e.target.files, 'video')}
                className="hidden"
                aria-label="上传视频"
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileUpload(e.target.files, 'audio')}
                className="hidden"
                aria-label="上传音频"
              />

              <MenuButton
                onClick={() => imageInputRef.current?.click()}
                title="插入图片"
              >
                <ImageIcon className="w-4 h-4" />
              </MenuButton>

              <MenuButton
                onClick={() => videoInputRef.current?.click()}
                title="插入视频"
              >
                <VideoIcon className="w-4 h-4" />
              </MenuButton>

              <MenuButton
                onClick={() => audioInputRef.current?.click()}
                title="插入音频"
              >
                <Music className="w-4 h-4" />
              </MenuButton>
            </div>

            <MenuDivider />

            {/* 第六组：撤销/重做（最后，低频操作） */}
            <div className="flex items-center gap-0.5">
              <MenuButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="撤销 (⌘Z)"
              >
                <Undo className="w-4 h-4" />
              </MenuButton>
              
              <MenuButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="重做 (⌘⇧Z)"
              >
                <Redo className="w-4 h-4" />
              </MenuButton>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
