/**
 * 科技感背景组件
 * 参考 Lovable.dev 的设计
 */

'use client';

export function TechBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 基础渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* 网格图案 */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* 光晕效果 1 - 左上紫色 */}
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"
        style={{ animationDuration: '8s' }}
      />
      
      {/* 光晕效果 2 - 右上蓝色 */}
      <div 
        className="absolute -top-20 right-10 w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-500/8 rounded-full blur-[100px] animate-pulse-slow"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
      
      {/* 光晕效果 3 - 左下青色 */}
      <div 
        className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-[110px] animate-pulse-slow"
        style={{ animationDuration: '12s', animationDelay: '4s' }}
      />
      
      {/* 光晕效果 4 - 右下粉色 */}
      <div 
        className="absolute -bottom-32 -right-32 w-80 h-80 bg-pink-500/15 dark:bg-pink-500/8 rounded-full blur-[100px] animate-pulse-slow"
        style={{ animationDuration: '9s', animationDelay: '1s' }}
      />
      
      {/* 点阵装饰 - 中心区域 */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* 渐变遮罩 - 确保内容可读性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
    </div>
  );
}

