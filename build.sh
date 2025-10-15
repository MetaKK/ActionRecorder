#!/bin/bash

# Cloudflare Pages 构建脚本
set -e

echo "🚀 开始构建项目..."

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf out .next

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建项目
echo "🔨 构建项目..."
npm run build

# 验证输出目录
echo "✅ 验证构建输出..."
if [ ! -d "out" ]; then
    echo "❌ 错误: 输出目录 'out' 不存在"
    exit 1
fi

# 检查关键文件
if [ ! -f "out/index.html" ]; then
    echo "❌ 错误: index.html 不存在"
    exit 1
fi

echo "🎉 构建成功！"
echo "📁 输出目录内容:"
ls -la out/

echo "📄 关键文件:"
ls -la out/index.html
ls -la out/_next/ | head -5
