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
import { TiptapMenu } from './tiptap-menu';

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
      {editable && <TiptapMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

