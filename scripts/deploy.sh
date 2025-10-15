#!/bin/bash

# Cloudflare Pages 部署脚本
# 使用方法: ./scripts/deploy.sh

set -e

echo "🚀 开始部署到 Cloudflare Pages..."

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装，正在安装..."
    npm install -g wrangler
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "❌ 请先登录 Cloudflare:"
    echo "运行: wrangler login"
    exit 1
fi

# 构建项目
echo "📦 构建项目..."
npm run build

# 检查构建输出
if [ ! -d "out" ]; then
    echo "❌ 构建失败，未找到输出目录 'out'"
    exit 1
fi

echo "✅ 构建成功！"

# 部署到 Cloudflare Pages
echo "🌐 部署到 Cloudflare Pages..."
wrangler pages deploy out --project-name=life-recorder

echo "🎉 部署完成！"
echo "访问你的应用: https://life-recorder.pages.dev"
