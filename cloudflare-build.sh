#!/bin/bash

# Cloudflare Pages 专用构建脚本
echo "🚀 开始 Cloudflare Pages 构建..."

# 设置环境变量
export CF_PAGES=1

# 清理缓存
echo "🧹 清理缓存..."
rm -rf .next out node_modules/.cache

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d "out" ]; then
    echo "✅ 构建成功！输出目录: out/"
    echo "📁 输出目录内容:"
    ls -la out/
else
    echo "❌ 构建失败！输出目录不存在"
    exit 1
fi
