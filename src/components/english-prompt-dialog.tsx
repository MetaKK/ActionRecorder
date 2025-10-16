/**
 * 英文学习Prompt导出对话框
 * 融合新概念英语教材与日常记录，生成AI学习Prompt
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, GraduationCap, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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

// 新概念英语教材配置 - 精简版
const NCE_BOOKS = [
  { id: 'nce1', name: '新概念1', lessons: 144 },
  { id: 'nce2', name: '新概念2', lessons: 96 },
  { id: 'nce3', name: '新概念3', lessons: 60 },
  { id: 'nce4', name: '新概念4', lessons: 48 },
];

// Prompt模板 - 精简版
const PROMPT_TEMPLATES = [
  {
    id: 'template1',
    name: '场景对话式',
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


export function EnglishPromptDialog() {
  const [open, setOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('nce1');
  const [lessonStart, setLessonStart] = useState<number>(1);
  const [lessonEnd, setLessonEnd] = useState<number>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template1');
  const [copied, setCopied] = useState(false);
  
  // 新增功能状态
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookLessons, setNewBookLessons] = useState('');
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptTemplate, setNewPromptTemplate] = useState('');
  
  // 自定义数据
  const [customBooks, setCustomBooks] = useState<Array<{id: string, name: string, lessons: number}>>([]);
  const [customPrompts, setCustomPrompts] = useState<Array<{id: string, name: string, template: string}>>([]);
  
  const { records } = useRecords();
  
  
  // 获取今天的记录
  const todayRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return records.filter(record => record.createdAt >= today);
  }, [records]);
  
  // 合并教材列表（自定义教材在前）
  const allBooks = useMemo(() => {
    return [...customBooks, ...NCE_BOOKS];
  }, [customBooks]);
  
  // 当前选中的教材
  const currentBook = useMemo(() => {
    return allBooks.find(book => book.id === selectedBook);
  }, [allBooks, selectedBook]);
  
  // 当教材改变时，重置课程范围
  useEffect(() => {
    if (currentBook) {
      const maxLessons = currentBook.lessons;
      if (lessonStart > maxLessons) {
        setLessonStart(1);
      }
      if (lessonEnd > maxLessons) {
        setLessonEnd(maxLessons);
      }
    }
  }, [currentBook, lessonStart, lessonEnd]);
  
  // 合并模板列表（自定义Prompt在前）
  const allTemplates = useMemo(() => {
    return [...customPrompts, ...PROMPT_TEMPLATES];
  }, [customPrompts]);
  
  // 当前选中的模板
  const currentTemplate = useMemo(() => {
    return allTemplates.find(t => t.id === selectedTemplate);
  }, [allTemplates, selectedTemplate]);
  
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
    
    const newBook = {
      id: `custom-${Date.now()}`,
      name: newBookName.trim(),
      lessons,
    };
    
    setCustomBooks(prev => [newBook, ...prev]);
    setSelectedBook(newBook.id);
    setNewBookName('');
    setNewBookLessons('');
    setIsAddingBook(false);
    toast.success('教材已添加');
  };
  
  // 添加自定义Prompt
  const handleAddCustomPrompt = () => {
    if (!newPromptName.trim() || !newPromptTemplate.trim()) {
      toast.error('请填写Prompt名称和内容');
      return;
    }
    
    const newPrompt = {
      id: `custom-prompt-${Date.now()}`,
      name: newPromptName.trim(),
      template: newPromptTemplate.trim(),
    };
    
    setCustomPrompts(prev => [newPrompt, ...prev]);
    setSelectedTemplate(newPrompt.id);
    setNewPromptName('');
    setNewPromptTemplate('');
    setIsAddingPrompt(false);
    toast.success('自定义Prompt已添加');
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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/10">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            英文学习 Prompt 生成器
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
          {/* 顶部选项区 - Apple风格优化 */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6 p-4 bg-muted/30 rounded-xl border border-border/20">
            {/* 教材选择 - Notion风格优化 */}
            <div className="flex items-center gap-3 relative z-10">
              <label className="text-sm font-semibold text-foreground/80 whitespace-nowrap">教材</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-none p-1">
                {allBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBook(book.id)}
                    className={cn(
                      "relative flex items-center justify-center rounded-xl px-4 py-2.5 transition-all duration-300",
                      "border backdrop-blur-sm shrink-0 shadow-sm",
                      selectedBook === book.id
                        ? [
                            "border-blue-400/50 bg-gradient-to-br from-blue-500/15 via-blue-400/15 to-blue-500/15",
                            "shadow-lg shadow-blue-500/20",
                            "scale-[1.05] ring-2 ring-blue-400/30",
                          ]
                        : [
                            "border-border/40 bg-background/80 hover:bg-background",
                            "hover:border-blue-300/50 hover:bg-gradient-to-br hover:from-blue-400/8 hover:to-blue-500/8",
                            "hover:scale-[1.02] hover:shadow-md",
                          ]
                    )}
                  >
                    <span className={cn(
                      "text-sm font-semibold transition-colors whitespace-nowrap",
                      selectedBook === book.id 
                        ? "text-blue-700 dark:text-blue-300" 
                        : "text-foreground/70"
                    )}>
                      {book.name}
                    </span>
                    
                    {/* 选中指示器 */}
                    {selectedBook === book.id && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* 新增教材按钮 - Apple风格优化 */}
              <button
                onClick={() => setIsAddingBook(!isAddingBook)}
                className={cn(
                  "relative flex items-center justify-center rounded-xl px-3 py-2.5 transition-all duration-300",
                  "border backdrop-blur-sm shrink-0 shadow-sm",
                  "border-dashed border-border/50 bg-background/60",
                  "hover:border-blue-300/50 hover:bg-gradient-to-br hover:from-blue-400/8 hover:to-blue-500/8",
                  "hover:scale-[1.02] hover:shadow-md",
                  isAddingBook && "border-blue-400/50 bg-blue-50 dark:bg-blue-950/20"
                )}
                title="添加自定义教材"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* 分隔线 - 桌面端显示 */}
            <div className="hidden md:block h-6 w-px bg-border/40" />
            
            {/* 课程范围选择 */}
            <div className="flex items-center gap-2 relative z-10">
              <label className="text-m font-medium text-muted-foreground whitespace-nowrap">范围</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={lessonStart}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLessonStart(value);
                    if (value > lessonEnd) {
                      setLessonEnd(value);
                    }
                  }}
                  className="w-14 h-8 px-2 text-sm font-semibold text-center rounded-lg border border-border/30 bg-background/80 appearance-none cursor-pointer focus:border-cyan-400/40 focus:outline-none transform scale-90 origin-center transition-all duration-200 hover:scale-95 hover:border-cyan-300/50 hover:shadow-sm"
                >
                  {Array.from({ length: currentBook?.lessons || 1 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground transform scale-90">-</span>
                <select
                  value={lessonEnd}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLessonEnd(value);
                    if (value < lessonStart) {
                      setLessonStart(value);
                    }
                  }}
                  className="w-14 h-8 px-2 text-sm font-semibold text-center rounded-lg border border-border/30 bg-background/80 appearance-none cursor-pointer focus:border-cyan-400/40 focus:outline-none transform scale-90 origin-center transition-all duration-200 hover:scale-95 hover:border-cyan-300/50 hover:shadow-sm"
                >
                  {Array.from({ length: currentBook?.lessons || 1 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 分隔线 - 桌面端显示 */}
            <div className="hidden md:block h-6 w-px bg-border/40" />
            
            {/* Prompt模板选择 */}
            <div className="flex items-center gap-2 relative z-10">
              <label className="text-m font-medium text-muted-foreground whitespace-nowrap">模板</label>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none p-1">
                {allTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "relative flex items-center justify-center rounded-lg px-3 py-1.5 transition-all duration-300",
                      "border backdrop-blur-sm shrink-0",
                      selectedTemplate === template.id
                        ? [
                            "border-cyan-400/40 bg-gradient-to-br from-sky-400/12 via-blue-400/12 to-cyan-400/12",
                            "shadow-md shadow-cyan-400/10",
                            "scale-[1.05]",
                          ]
                        : [
                            "border-border/30 bg-background/50",
                            "hover:border-cyan-300/40 hover:bg-gradient-to-br hover:from-sky-400/5 hover:to-cyan-400/5",
                            "hover:scale-[1.02]",
                          ]
                    )}
                  >
                    <span className={cn(
                      "text-xs font-semibold transition-colors whitespace-nowrap",
                      selectedTemplate === template.id 
                        ? "text-foreground" 
                        : "text-foreground/70"
                    )}>
                      {template.name}
                    </span>
                    
                    {/* 选中下划线 */}
                    {selectedTemplate === template.id && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* 新增模板按钮 - 移到外部，始终可见 */}
              <button
                onClick={() => setIsAddingPrompt(!isAddingPrompt)}
                className={cn(
                  "relative flex items-center justify-center rounded-lg px-2 py-1.5 transition-all duration-300",
                  "border backdrop-blur-sm shrink-0",
                  "border-dashed border-border/40 bg-background/30",
                  "hover:border-cyan-300/40 hover:bg-gradient-to-br hover:from-cyan-400/5 hover:to-cyan-400/5",
                  "hover:scale-[1.02]"
                )}
                title="添加自定义Prompt模板"
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* 新增教材表单 */}
          {isAddingBook && (
            <div className="mb-4 p-3 rounded-lg border border-border/30 bg-muted/10 space-y-2.5 transform scale-95 origin-top transition-all duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-foreground transform scale-90 origin-left">新增教材</h3>
                <button
                  onClick={() => setIsAddingBook(false)}
                  className="p-1 hover:bg-muted rounded transition-colors transform scale-90 hover:scale-95"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="教材名称"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-cyan-400/20 focus:border-cyan-400/40 transition-all transform scale-95 hover:scale-100"
                />
                <input
                  type="number"
                  placeholder="课程数量"
                  value={newBookLessons}
                  onChange={(e) => setNewBookLessons(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-cyan-400/20 focus:border-cyan-400/40 transition-all transform scale-95 hover:scale-100"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddCustomBook}
                  className="px-3 py-1.5 text-xs rounded-md bg-cyan-500 text-white hover:bg-cyan-600 transition-all font-medium transform scale-90 hover:scale-95"
                >
                  确认添加
                </button>
                <button
                  onClick={() => setIsAddingBook(false)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-all font-medium transform scale-90 hover:scale-95"
                >
                  取消
                </button>
              </div>
            </div>
          )}
          
          {/* 新增Prompt表单 */}
          {isAddingPrompt && (
            <div className="mb-4 p-3 rounded-lg border border-border/30 bg-muted/10 space-y-2.5 transform scale-95 origin-top transition-all duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-foreground transform scale-90 origin-left">新增Prompt模板</h3>
                <button
                  onClick={() => setIsAddingPrompt(false)}
                  className="p-1 hover:bg-muted rounded transition-colors transform scale-90 hover:scale-95"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Prompt名称"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-cyan-400/20 focus:border-cyan-400/40 transition-all transform scale-95 hover:scale-100"
              />
              <textarea
                placeholder="请输入你的自定义Prompt模板，可以使用 {date}、{activities}、{course} 等变量..."
                value={newPromptTemplate}
                onChange={(e) => setNewPromptTemplate(e.target.value)}
                rows={3}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400/20 focus:border-cyan-400/40 transition-all transform scale-95 hover:scale-100"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddCustomPrompt}
                  className="px-3 py-1.5 text-xs rounded-md bg-cyan-500 text-white hover:bg-cyan-600 transition-all font-medium transform scale-90 hover:scale-95"
                >
                  确认添加
                </button>
                <button
                  onClick={() => setIsAddingPrompt(false)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-all font-medium transform scale-90 hover:scale-95"
                >
                  取消
                </button>
              </div>
            </div>
          )}
          
          {/* Prompt预览 - 参考导出模态窗布局 */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2.5">
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
          
          {/* 操作按钮 - Apple风格优化 */}
          <div className="flex gap-3 pt-6 border-t border-border/20 mt-6">
            <Button
              onClick={handleCopy}
              className={cn(
                "group relative flex-1 h-12 rounded-2xl text-sm font-semibold transition-all duration-300",
                "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
                "hover:from-blue-600 hover:via-blue-700 hover:to-blue-800",
                "hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]",
                "active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/20",
                copied && "from-emerald-500 via-green-600 to-teal-700 hover:from-emerald-600 hover:via-green-700 hover:to-teal-800"
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" strokeWidth={2.5} />
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

