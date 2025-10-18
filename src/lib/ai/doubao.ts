/**
 * 豆包大模型 API 集成
 * 支持图片生成和视频生成功能
 */

export interface DoubaoImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  quality?: 'standard' | 'hd';
  style?: string;
  negative_prompt?: string;
}

export interface DoubaoImageResponse {
  success: boolean;
  data?: {
    image_url: string;
    image_id: string;
  };
  error?: string;
}

export interface DoubaoVideoRequest {
  prompt: string;
  duration?: number;
  resolution?: '720p' | '1080p' | '4k';
  style?: string;
  reference_image?: string;
}

export interface DoubaoVideoResponse {
  success: boolean;
  data?: {
    video_url: string;
    video_id: string;
    duration: number;
  };
  error?: string;
}

/**
 * 豆包图片生成API
 */
export async function generateDoubaoImage(
  request: DoubaoImageRequest,
  apiKey: string
): Promise<DoubaoImageResponse> {
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-image-4.0',
        prompt: request.prompt,
        n: 1,
        size: `${request.width || 1024}x${request.height || 1024}`,
        quality: request.quality || 'standard',
        style: request.style,
        negative_prompt: request.negative_prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: {
        image_url: data.data[0]?.url,
        image_id: data.data[0]?.id || Date.now().toString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * 豆包视频生成API
 */
export async function generateDoubaoVideo(
  request: DoubaoVideoRequest,
  apiKey: string
): Promise<DoubaoVideoResponse> {
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-video-1.0',
        prompt: request.prompt,
        duration: request.duration || 5,
        resolution: request.resolution || '1080p',
        style: request.style,
        reference_image: request.reference_image,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: {
        video_url: data.data[0]?.url,
        video_id: data.data[0]?.id || Date.now().toString(),
        duration: data.data[0]?.duration || request.duration || 5,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * 豆包多模态对话API
 */
export async function chatWithDoubao(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  model: string = 'doubao-1.6'
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      content: data.choices[0]?.message?.content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
