'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  Wand2, 
  Download, 
  Copy, 
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';

interface DoubaoGeneratorProps {
  apiKey?: string;
  onResult?: (type: 'image' | 'video', url: string) => void;
}

export function DoubaoGenerator({ apiKey, onResult }: DoubaoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [result, setResult] = useState<{
    type: 'image' | 'video';
    url: string;
    id: string;
    duration?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 图片生成参数
  const [imageParams, setImageParams] = useState({
    width: 1024,
    height: 1024,
    quality: 'standard' as 'standard' | 'hd',
    style: '',
    negative_prompt: '',
  });

  // 视频生成参数
  const [videoParams, setVideoParams] = useState({
    duration: 5,
    resolution: '1080p' as '720p' | '1080p' | '4k',
    style: '',
    reference_image: '',
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入描述内容');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const endpoint = generationType === 'image' 
        ? '/api/doubao/image' 
        : '/api/doubao/video';
      
      const requestBody = generationType === 'image' 
        ? {
            prompt,
            ...imageParams,
          }
        : {
            prompt,
            ...videoParams,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      const resultData = {
        type: generationType,
        url: data.image_url || data.video_url,
        id: data.image_id || data.video_id,
        duration: data.duration,
      };

      setResult(resultData);
      onResult?.(generationType, resultData.url);

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (result?.url) {
      await navigator.clipboard.writeText(result.url);
    }
  };

  const handleDownload = () => {
    if (result?.url) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = `doubao-${result.type}-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">豆包大模型生成器</h2>
        </div>
        <p className="text-gray-600">使用豆包大模型生成图片和视频</p>
      </div>

      {/* 类型选择 */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={generationType === 'image' ? 'default' : 'outline'}
          onClick={() => setGenerationType('image')}
          className="flex items-center gap-2"
        >
          <Image className="w-4 h-4" />
          图片生成
        </Button>
        <Button
          variant={generationType === 'video' ? 'default' : 'outline'}
          onClick={() => setGenerationType('video')}
          className="flex items-center gap-2"
        >
          <Video className="w-4 h-4" />
          视频生成
        </Button>
      </div>

      {/* 输入区域 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              描述内容 *
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`描述你想要生成的${generationType === 'image' ? '图片' : '视频'}内容...`}
              className="min-h-[100px]"
            />
          </div>

          {/* 图片生成参数 */}
          {generationType === 'image' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">尺寸</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={imageParams.width}
                    onChange={(e) => setImageParams(prev => ({ ...prev, width: parseInt(e.target.value) || 1024 }))}
                    placeholder="宽度"
                    className="w-20"
                  />
                  <span className="flex items-center">×</span>
                  <Input
                    type="number"
                    value={imageParams.height}
                    onChange={(e) => setImageParams(prev => ({ ...prev, height: parseInt(e.target.value) || 1024 }))}
                    placeholder="高度"
                    className="w-20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">质量</label>
                <select
                  value={imageParams.quality}
                  onChange={(e) => setImageParams(prev => ({ ...prev, quality: e.target.value as 'standard' | 'hd' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="standard">标准</option>
                  <option value="hd">高清</option>
                </select>
              </div>
            </div>
          )}

          {/* 视频生成参数 */}
          {generationType === 'video' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">时长（秒）</label>
                <Input
                  type="number"
                  value={videoParams.duration}
                  onChange={(e) => setVideoParams(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">分辨率</label>
                <select
                  value={videoParams.resolution}
                  onChange={(e) => setVideoParams(prev => ({ ...prev, resolution: e.target.value as '720p' | '1080p' | '4k' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4k">4K</option>
                </select>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                生成{generationType === 'image' ? '图片' : '视频'}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* 生成结果 */}
      {result && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">生成成功</span>
                <Badge variant="secondary">
                  {result.type === 'image' ? '图片' : '视频'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  复制链接
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  下载
                </Button>
              </div>
            </div>

            {result.type === 'image' ? (
              <div className="space-y-2">
                <img
                  src={result.url}
                  alt="豆包生成的图片"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-600 text-center">
                  图片ID: {result.id}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <video
                  src={result.url}
                  controls
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-600 text-center">
                  视频ID: {result.id} | 时长: {result.duration}秒
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
