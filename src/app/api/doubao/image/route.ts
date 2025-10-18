import { NextRequest, NextResponse } from 'next/server';
import { generateDoubaoImage, DoubaoImageRequest } from '@/lib/ai/doubao';

export async function POST(request: NextRequest) {
  try {
    const { prompt, width, height, quality, style, negative_prompt } = await request.json();
    const apiKey = request.headers.get('X-API-Key') || process.env.DOUBAO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: '豆包API密钥未配置' },
        { status: 401 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供图片描述' },
        { status: 400 }
      );
    }

    const imageRequest: DoubaoImageRequest = {
      prompt,
      width: width || 1024,
      height: height || 1024,
      quality: quality || 'standard',
      style,
      negative_prompt,
    };

    const result = await generateDoubaoImage(imageRequest, apiKey);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image_url: result.data?.image_url,
      image_id: result.data?.image_id,
    });

  } catch (error) {
    console.error('豆包图片生成错误:', error);
    return NextResponse.json(
      { error: '图片生成失败' },
      { status: 500 }
    );
  }
}
