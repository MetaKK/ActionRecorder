'use client';

import { useState } from 'react';
import { DoubaoGenerator } from '@/components/ai/doubao-generator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Image, 
  Video, 
  Brain, 
  Zap,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DoubaoPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">豆包大模型</h1>
                <p className="text-gray-600">字节跳动多模态AI生成平台</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            设置
          </Button>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">API 配置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  豆包大模型 API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的豆包API密钥"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  获取API密钥：访问{' '}
                  <a 
                    href="https://www.volcengine.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    火山引擎官网
                  </a>
                  {' '}注册并申请豆包大模型服务
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 功能特性 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
              <Image className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">图片生成</h3>
            <p className="text-sm text-gray-600 mb-3">
              4K超高清图片生成，支持多种风格和尺寸
            </p>
            <Badge variant="secondary">豆包图像创作 4.0</Badge>
          </Card>

          <Card className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">视频生成</h3>
            <p className="text-sm text-gray-600 mb-3">
              文本/图片生成高质量视频，影视级效果
            </p>
            <Badge variant="secondary">豆包视频生成 1.0</Badge>
          </Card>

          <Card className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">多模态对话</h3>
            <p className="text-sm text-gray-600 mb-3">
              支持文本、图片、视频的智能理解和生成
            </p>
            <Badge variant="secondary">豆包大模型 1.6</Badge>
          </Card>
        </div>

        {/* 生成器组件 */}
        <DoubaoGenerator 
          apiKey={apiKey || undefined}
          onResult={(type, url) => {
            console.log(`生成的${type === 'image' ? '图片' : '视频'}:`, url);
          }}
        />

        {/* 使用说明 */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            使用说明
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                1
              </div>
              <div>
                <strong>获取API密钥：</strong>访问火山引擎官网注册账号，申请豆包大模型服务，获取API密钥
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                2
              </div>
              <div>
                <strong>配置密钥：</strong>在设置中输入你的豆包API密钥，或通过环境变量配置
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                3
              </div>
              <div>
                <strong>开始生成：</strong>选择图片或视频生成，输入描述内容，调整参数后点击生成
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                4
              </div>
              <div>
                <strong>下载使用：</strong>生成完成后可以预览、复制链接或下载到本地使用
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
