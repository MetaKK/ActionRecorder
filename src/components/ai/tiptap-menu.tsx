/**
 * Tiptap 编辑器菜单栏
 * 基于 Apple 设计原则的简洁美观菜单
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapMenuProps {
  editor: Editor | null;
}

const MenuButton = ({ 
  onClick, 
  isActive, 
  disabled, 
  children,
  title 
}: { 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'disabled:opacity-30 disabled:cursor-not-allowed',
      'active:scale-95 touch-manipulation',
      isActive && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    )}
  >
    {children}
  </button>
);

const MenuDivider = () => (
  <div className="w-px h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
);

export function TiptapMenu({ editor }: TiptapMenuProps) {
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

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center gap-1 px-2 sm:px-4 py-2 overflow-x-auto scrollbar-hide"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* 撤销重做 */}
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

        <MenuDivider />

        {/* 文本样式 */}
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

        <MenuDivider />

        {/* 标题 */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="标题 3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          isActive={editor.isActive('heading', { level: 4 })}
          title="标题 4"
        >
          <div className="text-xs font-bold">H4</div>
        </MenuButton>

        <MenuDivider />

        {/* 列表 */}
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

        <MenuDivider />

        {/* 引用和分隔线 */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分隔线"
        >
          <Minus className="w-4 h-4" />
        </MenuButton>

        <MenuDivider />

        {/* 颜色选择 */}
        <div className="flex items-center gap-1">
          <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
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
              title={color.name}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all duration-200',
                'hover:scale-110 active:scale-95',
                editor.isActive('textStyle', { color: color.value })
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-gray-300 dark:border-gray-600'
              )}
              style={{
                backgroundColor: color.value || '#d1d5db',
              }}
            />
          ))}
        </div>

        <MenuDivider />

        {/* 高亮 */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="高亮"
        >
          <Highlighter className="w-4 h-4" />
        </MenuButton>
      </div>
    </div>
  );
}

