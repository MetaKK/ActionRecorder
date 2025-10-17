/**
 * 日记编辑/查看页面
 * 基于 Apple 设计原则，优化编辑区域
 */

'use client';

import '../styles.css';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DiaryEditor } from '@/components/ai/diary-editor';
import { generateDiary } from '@/lib/ai/diary/generator';
import { saveDiary, getDiaryById } from '@/lib/storage/diary-db';
import { useRecords } from '@/lib/hooks/use-records';
import {
  Diary,
  DiaryStyle,
  DiaryType,
  DiaryGenerationOptions,
  // DiaryGenerationProgress,
  TiptapDocument,
} from '@/lib/ai/diary/types';
import { Sparkles, Save, Download, ArrowLeft, Plus } from 'lucide-react';

export default function DiaryEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { records } = useRecords();
  
  const diaryId = params.id as string;
  const isNewDiary = searchParams?.get('mode') === 'new';
  
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedContent, setEditedContent] = useState<TiptapDocument | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<string>('😊');

  const loadDiary = useCallback(async () => {
    try {
      const loadedDiary = await getDiaryById(diaryId);
      if (loadedDiary) {
        setDiary(loadedDiary);
        setEditedContent(loadedDiary.content.document);
        setSelectedMood(loadedDiary.metadata.mood);
      }
    } catch (error) {
      console.error('加载日记失败:', error);
    }
  }, [diaryId]);

  // 加载日记数据
  useEffect(() => {
    if (isNewDiary) {
      // 创建新日记
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      const newDiary: Diary = {
        content: {
          format: 'tiptap-json',
          version: '1.0',
          document: { type: 'doc', content: [] }
        },
        metadata: {
          id: diaryId,
          date: dateStr,
          createdAt: today,
          generatedAt: today,
          style: DiaryStyle.NARRATIVE,
          mood: '😊',
          wordCount: 0,
          tags: [],
          sources: {
            recordsCount: 0,
            chatsCount: 0,
            filesCount: 0,
          },
          version: 1,
          type: DiaryType.MANUAL,
        },
        citations: [],
      };
      
      setDiary(newDiary);
      setEditedContent(newDiary.content.document);
    } else {
      // 加载已有日记
      loadDiary();
    }
  }, [diaryId, isNewDiary, loadDiary]);

  const handleSave = async () => {
    if (!diary || !editedContent) return;

    try {
      const updatedDiary: Diary = {
        ...diary,
        content: {
          format: 'tiptap-json',
          version: '1.0',
          document: editedContent
        },
        metadata: {
          ...diary.metadata,
          mood: selectedMood,
          wordCount: JSON.stringify(editedContent).length,
        },
      };

      await saveDiary(updatedDiary);
      setDiary(updatedDiary);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleExport = () => {
    if (!diary) return;
    
    const text = JSON.stringify(diary.content);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary_${diary.metadata.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = async () => {
    if (diary?.metadata.type !== DiaryType.AUTO_GENERATED) return;

    setIsGenerating(true);

    try {
      const options: DiaryGenerationOptions = {
        style: DiaryStyle.NARRATIVE,
        includeImages: true,
        includeCitations: true,
      };

      const newDiary = await generateDiary(records, options);
      
      if (newDiary) {
        const updatedDiary = {
          ...newDiary,
          metadata: {
            ...newDiary.metadata,
            id: diaryId,
          },
        };
        
        await saveDiary(updatedDiary);
        setDiary(updatedDiary);
        setEditedContent(updatedDiary.content.document);
      }
    } catch (error) {
      console.error('重新生成失败:', error);
      alert('重新生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    return mood || '😊';
  };

  if (!diary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/ai/diary')}
            className="hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>

        {/* 元信息栏 - 精简设计 */}
        <div className="flex items-center justify-between gap-3 py-3 mb-4 border-b border-gray-200 dark:border-gray-700">
          {/* 左侧：元信息 */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
            <span className="text-xl">{getMoodEmoji(diary.metadata.mood)}</span>
            <span className="text-xs truncate">{diary.metadata.date}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
            <span className="text-xs">{diary.metadata.wordCount} 字</span>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {diary.metadata.type === DiaryType.AUTO_GENERATED && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="重新生成"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="保存"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExport}
              className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="导出"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/ai/diary')}
              className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="新建日记"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 成功提示 */}
        {showSuccessMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
            ✅ 保存成功
          </div>
        )}

        {/* 编辑器 - 最大化空间 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <DiaryEditor
            content={editedContent || diary.content.document}
            onChange={setEditedContent}
          />
        </div>
      </div>
    </div>
  );
}
