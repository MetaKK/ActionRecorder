'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2,
  X,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CustomStyleCreatorProps {
  onStyleGenerated: (customPrompt: string) => void;
}

type AnalysisMode = 'text' | 'image' | null;

export function CustomStyleCreator({ onStyleGenerated }: CustomStyleCreatorProps) {
  const [mode, setMode] = useState<AnalysisMode>(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedStyle, setGeneratedStyle] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 分析并生成风格
  const handleAnalyze = async () => {
    if (mode === 'text' && !text.trim()) {
      toast.error('请输入一些文字');
      return;
    }
    if (mode === 'image' && !image) {
      toast.error('请上传图片');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 构建分析prompt (用于未来AI集成)
      let analysisPrompt = '';
      
      if (mode === 'text') {
        analysisPrompt = `请分析以下文字的写作风格，并生成一个详细的写作风格指导prompt：

【用户提供的文字】
${text}

【任务】
1. 分析这段文字的语言特点（词汇选择、句式结构、修辞手法）
2. 识别情感基调和表达方式
3. 提取独特的风格元素
4. 生成一个详细的写作风格prompt，让AI能够模仿这种风格写日记

请直接返回生成的风格prompt，格式如下：
"你是一位具有以下特点的日记写手：
1. [特点1]
2. [特点2]
3. [特点3]
...
请用这种风格改写今天的日记。"`;
      } else {
        analysisPrompt = `用户上传了一张图片作为风格灵感。请根据图片的视觉元素（色彩、氛围、构图）生成一个独特的写作风格prompt。

【任务】
1. 想象这张图片传达的情绪和氛围
2. 将视觉元素转化为文字风格特征
3. 生成一个能体现这种氛围的写作风格prompt

提示：可以从以下角度思考
- 色彩明暗 → 语言轻重
- 构图疏密 → 句式长短
- 画面动静 → 节奏快慢
- 整体氛围 → 情感基调

请直接返回生成的风格prompt。`;
      }

      // 调用AI分析（这里需要集成实际的AI API）
      // TODO: 使用 analysisPrompt 调用实际的AI API
      console.log('Analysis prompt prepared:', analysisPrompt.length > 0 ? 'Ready' : 'Empty');
      // 暂时模拟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockGeneratedStyle = mode === 'text'
        ? `你是一位具有独特个人风格的日记写手，请用以下特点改写今天的日记：

1. 语言特点：简洁明快，善用短句，节奏感强
2. 情感表达：真诚直接，不回避真实感受
3. 细节捕捉：注重生活细节，用小事件反映大情绪
4. 修辞手法：适度使用比喻，但不过分华丽
5. 叙事视角：第一人称，亲切自然，像对朋友倾诉

请保持这种风格的一致性，让日记读起来真实而有温度。`
        : `你是一位受视觉艺术启发的日记写手，请用以下风格改写今天的日记：

1. 色彩感知：用丰富的色彩词汇描写场景和情绪
2. 画面构图：像拍照一样框取生活片段，有远近景
3. 光影变化：注重光线、氛围、时间感的描写
4. 视觉节奏：短段落和长段落交替，像画面切换
5. 艺术气息：将日常生活提升到美学层面

让日记读起来像一幅幅流动的画面。`;

      setGeneratedStyle(mockGeneratedStyle);
      toast.success('风格分析完成！');
      
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 应用风格
  const handleApplyStyle = () => {
    if (!generatedStyle) return;
    onStyleGenerated(generatedStyle);
    toast.success('自定义风格已应用！');
  };

  // 重置
  const handleReset = () => {
    setMode(null);
    setText('');
    setImage(null);
    setGeneratedStyle('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      
      {/* 模式选择 */}
      {!mode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <button
            onClick={() => setMode('text')}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">文字分析</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                粘贴一段你喜欢的文字，AI 会分析其风格特点
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode('image')}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">图片灵感</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                上传一张图片，AI 会从视觉转化为文字风格
              </p>
            </div>
          </button>
        </motion.div>
      )}

      {/* 文字输入模式 */}
      <AnimatePresence mode="wait">
        {mode === 'text' && (
          <motion.div
            key="text-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                粘贴参考文字
              </h3>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="粘贴你喜欢的文字片段，可以是其他作家的作品、你以前写的日记、或任何你欣赏的文字风格..."
              className="min-h-[200px] resize-none"
            />

            {!generatedStyle ? (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !text.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI 正在分析风格...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    分析风格
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    生成的风格指导
                  </h4>
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {generatedStyle}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplyStyle} className="flex-1" size="lg">
                    <Sparkles className="w-4 h-4 mr-2" />
                    应用此风格
                  </Button>
                  <Button onClick={handleReset} variant="outline" size="lg">
                    重新分析
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 图片上传模式 */}
        {mode === 'image' && (
          <motion.div
            key="image-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                上传灵感图片
              </h3>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {!image ? (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full h-64 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-500"
              >
                <Upload className="w-12 h-12" />
                <div className="text-center">
                  <p className="font-medium">点击上传图片</p>
                  <p className="text-sm">支持 JPG、PNG、GIF 等格式</p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden">
                  <Image
                    src={image}
                    alt="Uploaded inspiration"
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!generatedStyle ? (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AI 正在分析图片...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        从图片生成风格
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        生成的风格指导
                      </h4>
                      <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {generatedStyle}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleApplyStyle} className="flex-1" size="lg">
                        <Sparkles className="w-4 h-4 mr-2" />
                        应用此风格
                      </Button>
                      <Button onClick={handleReset} variant="outline" size="lg">
                        重新分析
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

