/**
 * 英文学习Prompt导出对话框
 * 融合新概念英语教材与日常记录，生成AI学习Prompt
 */

'use client';

import { useState, useMemo } from 'react';
import { BookOpen, Copy, Check, GraduationCap, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecords } from '@/lib/hooks/use-records';
import { copyToClipboard } from '@/lib/utils/export';
import { formatDate, formatTime } from '@/lib/utils/date';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 新概念英语教材配置
const NCE_BOOKS = [
  { id: 'nce1', name: '新概念英语 第1册', lessons: 144 },
  { id: 'nce2', name: '新概念英语 第2册', lessons: 96 },
  { id: 'nce3', name: '新概念英语 第3册', lessons: 60 },
  { id: 'nce4', name: '新概念英语 第4册', lessons: 48 },
];

// Prompt模板
const PROMPT_TEMPLATES = [
  {
    id: 'template1',
    name: '场景对话式（推荐）',
    description: '黄金对话 + 语调标注 + 文化差异',
    template: `【学习者信息】
- 年龄：35岁
- 英语水平：简单句到基础日常对话
- 母语：中文
- 日常环境：办公室、咖啡店、家
- 兴趣：电影、创业、学习

【今日活动】
时间：{date}
行程：
{activities}

【学习进度】
今天完成课程：{course}

【AI任务】

1️⃣ 选择最匹配的场景
从【今日活动】选择最适合的高频场景，设计地道对话自然融入【学习内容】的核心句型和词汇

2️⃣ 黄金对话（4-6句，美式地道表达）
格式：
【场景】[具体描述] 【任务】[要完成什么]
A: [句子] ↗↘ (标注语调和重音)
B: [句子] ↗↘ (标注语调和重音)
[继续4-6轮]
每句必须标注：
🔊 重音位置
↗↘ 语调
💡 肢体语言

3️⃣ 拓展核心句型要点
- 句型用法：[核心句型的使用场景和时机]
- 常见错误：[中式英语错误]；[正确表达]
- 文化差异：[美式文化关键点]

【AI输出检查】
☑ 场景高频（每周1次以上）且来自用户今日活动
☑ 100%地道美式表达，避免教科书式僵硬
☑ 对话4-6轮，30秒内完成
☑ 自然融入核心句型，词汇不超纲
☑ 每句标注：语调↗↘ + 重音 + 关键动作
☑ 中英思维对比2处
☑ 替换表达2-3个
☑ 文化差异1句`
  },
  {
    id: 'template2',
    name: '互动练习式',
    description: '实时反馈 + 即时纠错 + 评分总结',
    template: `【学习者信息】
• 年龄：35岁
• 英语水平：简单句到基础日常对话
• 母语：中文
• 日常环境：办公室、咖啡店、家
• 兴趣：电影、创业、学习

【今日活动】
时间：{date}
行程：
{activities}

【学习进度】
今天完成课程：{course}

【AI任务】

1️⃣ 场景匹配
从【今日活动】选择最适合的高频场景，自然融入【学习内容】的核心句型和词汇
输出：
场景：[名称]  
理由：[今日哪个活动 + 匹配哪些句型 + 使用频率]

2️⃣ 场景设定
【场景】[20字内描述]  
【角色】我是A（[需求]），你是B（[身份]）  
【目标】用今天句型完成[具体任务]

3️⃣ 互动对话（4-6轮）
你先说B的开场白，我接A的台词，依次进行

4️⃣ 即时反馈
每次我说完立即反馈：
🛑 语法错误：
暂停！ 你说：[原话] 问题：[错在哪] 正确：[正确版] ⭐ 重新说这句
⚠️ 不够地道：
可以更自然： 你说：[原话] 地道说法：[native版] ⭐ 原因：[1句] 选择：继续 / 改用地道版
✅ 表达完美：
💯 很好！[具体表扬] B继续...

5️⃣ 总结反馈
| 维度 | 评分 | 点评 |
|------|------|------|
| 语法 | ⭐⭐⭐⭐ | [说明] |
| 地道度 | ⭐⭐⭐ | [说明] |
| 流畅度 | ⭐⭐⭐⭐ | [说明] |

改进点：
1. [错误→正确⭐] 原因：[1句]
2. [错误→正确⭐] 原因：[1句]
3. [错误→正确⭐] 原因：[1句]

优点：
- [表扬]
- [表扬]
- [表扬]

开始！`
  },
];

interface CustomBook {
  id: string;
  name: string;
  lessons: number;
}

export function EnglishPromptDialog() {
  const [open, setOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('nce1');
  const [lessonStart, setLessonStart] = useState<number>(1);
  const [lessonEnd, setLessonEnd] = useState<number>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template1');
  const [customBooks, setCustomBooks] = useState<CustomBook[]>([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookLessons, setNewBookLessons] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { records } = useRecords();
  
  // 获取今天的记录
  const todayRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return records.filter(record => record.createdAt >= today);
  }, [records]);
  
  // 合并教材列表
  const allBooks = useMemo(() => {
    return [...NCE_BOOKS, ...customBooks];
  }, [customBooks]);
  
  // 当前选中的教材
  const currentBook = useMemo(() => {
    return allBooks.find(book => book.id === selectedBook);
  }, [allBooks, selectedBook]);
  
  // 当前选中的模板
  const currentTemplate = useMemo(() => {
    return PROMPT_TEMPLATES.find(t => t.id === selectedTemplate);
  }, [selectedTemplate]);
  
  // 生成活动列表文本
  const activitiesText = useMemo(() => {
    if (todayRecords.length === 0) {
      return '- 暂无今日记录';
    }
    
    return todayRecords
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(record => {
        const time = formatTime(record.createdAt);
        const content = record.content || '(无文字记录)';
        const location = record.location?.city || record.location?.district || '';
        return `- ${time} - ${content}${location ? ` @ ${location}` : ''}`;
      })
      .join('\n');
  }, [todayRecords]);
  
  // 生成最终Prompt
  const finalPrompt = useMemo(() => {
    if (!currentTemplate || !currentBook) return '';
    
    const courseInfo = lessonStart === lessonEnd 
      ? `${currentBook.name} Lesson ${lessonStart}`
      : `${currentBook.name} Lesson ${lessonStart}-${lessonEnd}`;
    const dateStr = formatDate(new Date());
    
    return currentTemplate.template
      .replace('{date}', dateStr)
      .replace('{activities}', activitiesText)
      .replace('{course}', courseInfo);
  }, [currentTemplate, currentBook, lessonStart, lessonEnd, activitiesText]);
  
  // 添加自定义教材
  const handleAddCustomBook = () => {
    if (!newBookName.trim() || !newBookLessons.trim()) {
      toast.error('请填写教材名称和课程数量');
      return;
    }
    
    const lessons = parseInt(newBookLessons);
    if (isNaN(lessons) || lessons < 1) {
      toast.error('课程数量必须是正整数');
      return;
    }
    
    const newBook: CustomBook = {
      id: `custom-${Date.now()}`,
      name: newBookName.trim(),
      lessons,
    };
    
    setCustomBooks(prev => [...prev, newBook]);
    setSelectedBook(newBook.id);
    setNewBookName('');
    setNewBookLessons('');
    setIsAddingBook(false);
    toast.success('教材已添加');
  };
  
  // 删除自定义教材
  const handleRemoveCustomBook = (bookId: string) => {
    setCustomBooks(prev => prev.filter(book => book.id !== bookId));
    if (selectedBook === bookId) {
      setSelectedBook('nce1');
    }
    toast.success('教材已删除');
  };
  
  // 复制Prompt
  const handleCopy = async () => {
    try {
      await copyToClipboard(finalPrompt);
      setCopied(true);
      toast.success('已复制到剪贴板');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error('复制失败，请重试');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "group relative flex items-center justify-center",
            "h-9 w-9 rounded-full",
            "transition-all duration-200 ease-out",
            "bg-black/[0.03] dark:bg-white/[0.06]",
            "hover:bg-black/[0.06] dark:hover:bg-white/[0.09]",
            "active:bg-black/[0.08] dark:active:bg-white/[0.12]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/20",
            "active:scale-95"
          )}
          aria-label="导出英文学习Prompt"
        >
          <GraduationCap 
            className="h-[18px] w-[18px] text-foreground/70 transition-transform duration-200 group-hover:scale-105" 
            strokeWidth={2}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            英文学习 Prompt 生成器
          </DialogTitle>
          <DialogDescription className="text-xs">
            融合教材内容与今日活动，生成个性化AI学习Prompt
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
          {/* 配置区域 */}
          <div className="space-y-4 mb-4">
            {/* 教材选择 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">选择教材</label>
                <button
                  onClick={() => setIsAddingBook(!isAddingBook)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  添加自定义教材
                </button>
              </div>
              
              {/* 添加自定义教材表单 */}
              {isAddingBook && (
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-2">
                  <input
                    type="text"
                    placeholder="教材名称（如：剑桥英语）"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  />
                  <input
                    type="number"
                    placeholder="课程数量"
                    value={newBookLessons}
                    onChange={(e) => setNewBookLessons(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomBook}
                      className="px-3 py-1.5 text-xs rounded-md bg-cyan-500 text-white hover:bg-cyan-600"
                    >
                      确认添加
                    </button>
                    <button
                      onClick={() => setIsAddingBook(false)}
                      className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {allBooks.map((book) => (
                  <div key={book.id} className="relative">
                    <button
                      onClick={() => setSelectedBook(book.id)}
                      className={cn(
                        "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "border",
                        selectedBook === book.id
                          ? "border-cyan-400/40 bg-gradient-to-br from-sky-400/12 to-cyan-400/12 text-foreground"
                          : "border-border/30 bg-background/50 text-foreground/70 hover:border-cyan-300/40"
                      )}
                    >
                      <BookOpen className="inline-block h-3.5 w-3.5 mr-1.5" />
                      {book.name}
                    </button>
                    {/* 删除按钮（仅自定义教材） */}
                    {book.id.startsWith('custom-') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomBook(book.id);
                        }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 课程范围选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">选择课程范围</label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">从</span>
                  <input
                    type="number"
                    min="1"
                    max={currentBook?.lessons || 1}
                    value={lessonStart}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setLessonStart(1);
                        return;
                      }
                      const val = parseInt(inputValue);
                      if (!isNaN(val)) {
                        const clampedVal = Math.max(1, Math.min(val, currentBook?.lessons || 1));
                        setLessonStart(clampedVal);
                        if (clampedVal > lessonEnd) setLessonEnd(clampedVal);
                      }
                    }}
                    className="w-20 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  />
                  <span className="text-sm text-muted-foreground">课</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">到</span>
                  <input
                    type="number"
                    min={lessonStart}
                    max={currentBook?.lessons || 1}
                    value={lessonEnd}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setLessonEnd(lessonStart);
                        return;
                      }
                      const val = parseInt(inputValue);
                      if (!isNaN(val)) {
                        const clampedVal = Math.max(lessonStart, Math.min(val, currentBook?.lessons || 1));
                        setLessonEnd(clampedVal);
                      }
                    }}
                    className="w-20 px-3 py-2 text-sm rounded-md border border-border bg-background"
                  />
                  <span className="text-sm text-muted-foreground">课</span>
                </div>
                <span className="text-xs text-muted-foreground/70">
                  （共 {currentBook?.lessons || 0} 课，已选 {lessonEnd - lessonStart + 1} 课）
                </span>
              </div>
            </div>
            
            {/* Prompt模板选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">选择Prompt模板</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PROMPT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-3 rounded-lg text-left transition-all duration-200",
                      "border",
                      selectedTemplate === template.id
                        ? "border-cyan-400/40 bg-gradient-to-br from-sky-400/12 to-cyan-400/12"
                        : "border-border/30 bg-background/50 hover:border-cyan-300/40"
                    )}
                  >
                    <div className="font-medium text-sm mb-1">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Prompt预览 */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">
                  Prompt 预览（{finalPrompt.length} 字符）
                </span>
              </div>
            </div>
            <Card className="flex-1 overflow-hidden min-h-0 border-border/30 bg-gradient-to-br from-muted/20 to-muted/40 backdrop-blur-sm shadow-inner">
              <CardContent className="p-0 h-full overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed p-4 text-foreground/80">
                  {finalPrompt}
                </pre>
              </CardContent>
            </Card>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2.5 pt-4 border-t border-border/30 mt-4">
            <Button
              onClick={handleCopy}
              className={cn(
                "group relative flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-300",
                "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500",
                "hover:from-sky-600 hover:via-blue-600 hover:to-cyan-600",
                "hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.01]",
                "active:scale-[0.99]",
                copied && "from-emerald-500 via-green-500 to-teal-500"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                  复制 Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

