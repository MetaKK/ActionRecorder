/**
 * 科技感背景组件
 * 参考 Lovable.dev 的温暖科技感设计
 */

'use client';

export function TechBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 基础渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* 光晕效果 1 - 左上橙色（温暖） */}
      <div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-400/20 dark:bg-orange-400/10 rounded-full blur-[120px] animate-pulse-slow"
        style={{ animationDuration: '10s' }}
      />
      
      {/* 光晕效果 2 - 右上紫罗兰（科技） */}
      <div 
        className="absolute -top-20 -right-20 w-[550px] h-[550px] bg-violet-500/15 dark:bg-violet-500/8 rounded-full blur-[110px] animate-pulse-slow"
        style={{ animationDuration: '12s', animationDelay: '3s' }}
      />
      
      {/* 光晕效果 3 - 中央玫瑰金（温暖科技融合） */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-rose-400/12 dark:bg-rose-400/6 rounded-full blur-[130px] animate-pulse-slow"
        style={{ animationDuration: '15s', animationDelay: '5s' }}
      />
      
      {/* 光晕效果 4 - 左下琥珀色（温暖） */}
      <div 
        className="absolute -bottom-40 -left-32 w-[500px] h-[500px] bg-amber-500/18 dark:bg-amber-500/9 rounded-full blur-[115px] animate-pulse-slow"
        style={{ animationDuration: '11s', animationDelay: '2s' }}
      />
      
      {/* 光晕效果 5 - 右下品红（科技感点缀） */}
      <div 
        className="absolute -bottom-20 -right-40 w-[450px] h-[450px] bg-fuchsia-500/14 dark:bg-fuchsia-500/7 rounded-full blur-[105px] animate-pulse-slow"
        style={{ animationDuration: '13s', animationDelay: '1s' }}
      />
      
      {/* 渐变遮罩 - 确保内容可读性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
    </div>
  );
}

