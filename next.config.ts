import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化
  compiler: {
    // 移除console（生产环境）
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 压缩优化
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // 生产优化
  productionBrowserSourceMaps: false,
  
  // React严格模式
  reactStrictMode: true,
  
  // Cloudflare Pages 支持 - 条件性静态导出
  ...(process.env.CF_PAGES === '1' ? {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
    // 排除有问题的动态路由
    experimental: {
      ...(process.env.CF_PAGES === '1' ? {
        skipTrailingSlashRedirect: true,
      } : {}),
    },
  } : {}),
  
  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react', 'date-fns', 'zustand'],
  },
};

export default nextConfig;
