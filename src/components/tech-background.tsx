/**
 * 背景组件
 * 支持图片背景或CSS渐变
 */

'use client';

export function TechBackground() {
  // 检测是否有背景图片
  const useImageBackground = false; // 设置为 true 使用图片背景
  
  if (useImageBackground) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* 图片背景 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* 可选：添加遮罩提升内容可读性 */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/30" />
      </div>
    );
  }
  
  // CSS渐变背景（默认）
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 精确复制附件图片的渐变 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, 
            #f8f8f5 0%,
            #e8ecf0 10%,
            #d5e3f0 20%,
            #b8d4f0 30%,
            #9bc5f0 40%,
            #a5b8e8 50%,
            #b5a8e8 60%,
            #c8a8e0 65%,
            #d8b0d8 70%,
            #e8b8d0 75%,
            #f0c0c8 80%,
            #f5c8c0 85%,
            #f8d0b8 90%,
            #f5c8b8 95%,
            #f0b8b0 100%
          )`,
        }}
      />
    </div>
  );
}

