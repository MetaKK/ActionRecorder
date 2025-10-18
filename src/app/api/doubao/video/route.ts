import { NextRequest, NextResponse } from 'next/server';
import { generateDoubaoVideo, DoubaoVideoRequest } from '@/lib/ai/doubao';

export async function POST(request: NextRequest) {
  try {
    const { prompt, duration, resolution, style, reference_image } = await request.json();
    const apiKey = request.headers.get('X-API-Key') || process.env.DOUBAO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: '豆包API密钥未配置' },
        { status: 401 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供视频描述' },
        { status: 400 }
      );
    }

    const videoRequest: DoubaoVideoRequest = {
      prompt,
      duration: duration || 5,
      resolution: resolution || '1080p',
      style,
      reference_image,
    };

    const result = await generateDoubaoVideo(videoRequest, apiKey);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      video_url: result.data?.video_url,
      video_id: result.data?.video_id,
      duration: result.data?.duration,
    });

  } catch (error) {
    console.error('豆包视频生成错误:', error);
    return NextResponse.json(
      { error: '视频生成失败' },
      { status: 500 }
    );
  }
}
