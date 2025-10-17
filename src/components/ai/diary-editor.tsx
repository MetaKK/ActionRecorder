/**
 * 日记编辑器组件
 * 基于 Tiptap 的富文本编辑器
 */

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { diaryExtensions, diaryEditorProps } from '@/lib/ai/diary/tiptap-config';
import { TiptapDocument } from '@/lib/ai/diary/types';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { TiptapMenuEnhanced } from './tiptap-menu-enhanced';

interface DiaryEditorProps {
  content?: TiptapDocument;
  onChange?: (json: TiptapDocument) => void;
  editable?: boolean;
  className?: string;
}

export function DiaryEditor({
  content,
  onChange,
  editable = true,
  className,
}: DiaryEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: diaryExtensions,
    content: content,
    editable: editable,
    immediatelyRender: false, // 修复 SSR 问题
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      ...diaryEditorProps,
      attributes: {
        ...diaryEditorProps.attributes,
        class: cn(
          diaryEditorProps.attributes.class,
          className
        ),
      },
      // 处理拖拽和粘贴
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
          const files = Array.from(event.dataTransfer.files);
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          
          if (pos) {
            files.forEach(async (file) => {
              // 处理文件上传
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  view.dispatch(
                    view.state.tr.insert(pos.pos, view.state.schema.nodes.image.create({ src: dataUrl }))
                  );
                };
                reader.readAsDataURL(file);
              }
            });
          }
          
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              const file = items[i].getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  // const { selection } = view.state;
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({ src: dataUrl })
                    )
                  );
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  // 在客户端挂载之前显示加载状态
  if (!isMounted || !editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="diary-editor-wrapper relative">
      {editable && <TiptapMenuEnhanced editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

