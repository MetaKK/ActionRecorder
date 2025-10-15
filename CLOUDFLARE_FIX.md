# Cloudflare Pages 部署问题修复指南

## 🚨 问题分析

根据部署日志分析，问题在于：

1. ✅ **构建成功** - Next.js 构建完成，无错误
2. ✅ **输出目录存在** - `out` 目录已生成
3. ❌ **Cloudflare Pages 找不到输出目录** - 配置问题

## 🔧 解决方案

### 方案一：修复 Cloudflare Pages 构建设置

在 Cloudflare Dashboard 中，确保构建设置正确：

```
Framework preset: Next.js (Static HTML Export)
Build command: npm run build
Build output directory: out
Root directory: /
```

### 方案二：使用正确的 Next.js 配置

确保 `next.config.ts` 配置正确：

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // 不要设置 distDir，使用默认的 'out'
};
```

### 方案三：手动验证构建

1. **本地测试构建**
   ```bash
   npm run build
   ls -la out/
   ```

2. **检查输出目录内容**
   ```bash
   ls -la out/
   # 应该看到 index.html, _next/, 404.html 等文件
   ```

## 🛠️ 修复步骤

### 步骤 1: 更新 Cloudflare Pages 设置

1. 进入 Cloudflare Dashboard
2. 选择你的 Pages 项目
3. 进入 "Settings" → "Builds & deployments"
4. 更新构建设置：

```
Framework preset: Next.js (Static HTML Export)
Build command: npm run build
Build output directory: out
Root directory: /
```

### 步骤 2: 验证配置文件

确保以下文件存在且配置正确：

- ✅ `next.config.ts` - Next.js 配置
- ✅ `_headers` - 安全头配置
- ✅ `_redirects` - 重定向规则
- ✅ `wrangler.toml` - Cloudflare 配置

### 步骤 3: 重新部署

1. **触发重新部署**
   - 在 Cloudflare Dashboard 中点击 "Retry deployment"
   - 或推送新的 commit 到 GitHub

2. **检查构建日志**
   - 确保构建成功
   - 检查输出目录是否正确

## 🔍 调试命令

### 本地验证
```bash
# 构建项目
npm run build

# 检查输出目录
ls -la out/

# 检查关键文件
ls -la out/index.html
ls -la out/_next/
```

### 检查构建输出
```bash
# 查看构建输出结构
find out -type f -name "*.html" | head -10
find out -type f -name "*.js" | head -10
```

## 📋 常见问题解决

### 问题 1: 输出目录不存在
**原因**: Next.js 配置错误
**解决**: 确保 `output: 'export'` 配置正确

### 问题 2: 构建成功但部署失败
**原因**: Cloudflare Pages 构建设置错误
**解决**: 检查 "Build output directory" 设置

### 问题 3: 静态资源 404
**原因**: 路由配置问题
**解决**: 检查 `_redirects` 文件配置

## 🎯 最终检查清单

- [ ] Next.js 配置正确 (`output: 'export'`)
- [ ] 本地构建成功 (`npm run build`)
- [ ] 输出目录存在 (`ls out/`)
- [ ] Cloudflare Pages 构建设置正确
- [ ] 重新部署成功

## 🚀 部署成功后

部署成功后，你的应用将在以下地址可用：
- **默认地址**: `https://life-recorder.pages.dev`
- **自定义域名**: `https://your-domain.com`

---

如果问题仍然存在，请检查 Cloudflare Pages 的构建日志，确保：
1. 构建命令执行成功
2. 输出目录 `out` 存在
3. 输出目录包含必要的文件（index.html, _next/ 等）
