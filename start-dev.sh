#!/bin/bash

echo "🚀 启动Life Recorder开发环境"
echo "================================"

# 检查Node.js版本
echo "📋 检查环境..."
node --version
npm --version

echo ""
echo "🧹 清理旧进程..."
# 清理可能存在的旧进程
pkill -f "next dev" 2>/dev/null || true
sleep 1

echo ""
echo "📦 安装依赖..."
npm install

echo ""
echo "🔧 启动服务..."

# 启动Next.js开发服务器
echo "⚡ 启动Next.js开发服务器 (端口3000)..."
npm run dev &
NEXT_PID=$!

echo ""
echo "✅ 服务启动完成！"
echo "================================"
echo "⚡ Next.js应用: http://localhost:3000"
echo "🤖 AI聊天: http://localhost:3000/ai"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait

# 清理进程
echo ""
echo "🛑 正在停止服务..."
kill $NEXT_PID 2>/dev/null
echo "✅ 服务已停止"
