# Cloudflare Pages 部署设置指南

## 🎯 快速开始

### 1. 准备工作

确保你已经：
- ✅ 有 Cloudflare 账户
- ✅ 项目已推送到 GitHub
- ✅ 本地构建成功

### 2. 部署方式选择

#### 方式一：Cloudflare Dashboard（最简单）

1. **访问 Cloudflare Dashboard**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 点击左侧 "Pages"

2. **创建新项目**
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 选择你的 GitHub 仓库

3. **配置构建设置**
   ```
   Framework preset: Next.js (Static HTML Export)
   Build command: npm run build
   Build output directory: out
   Root directory: /
   ```

4. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

#### 方式二：Wrangler CLI（开发者友好）

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **部署项目**
   ```bash
   npm run deploy
   ```

#### 方式三：GitHub Actions（自动化）

1. **设置 GitHub Secrets**
   在 GitHub 仓库设置中添加：
   - `CLOUDFLARE_API_TOKEN`: 你的 Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare Account ID

2. **获取 API Token**
   - 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - 创建自定义 token，权限包括：
     - `Cloudflare Pages:Edit`
     - `Account:Read`

3. **获取 Account ID**
   - 在 Cloudflare Dashboard 右侧边栏找到 Account ID

4. **推送代码**
   ```bash
   git add .
   git commit -m "Add Cloudflare Pages deployment"
   git push origin main
   ```

## 🔧 配置说明

### 项目配置文件

- `next.config.ts`: Next.js 静态导出配置
- `wrangler.toml`: Cloudflare Pages 配置
- `_headers`: 安全头和缓存配置
- `_redirects`: 重定向规则
- `.github/workflows/deploy.yml`: GitHub Actions 工作流

### 构建输出

项目构建后会生成 `out` 目录，包含：
- 静态 HTML 文件
- JavaScript 和 CSS 资源
- 图片和其他静态资源

## 🚀 部署命令

```bash
# 本地构建测试
npm run build

# 本地预览
npm run preview

# 部署到 Cloudflare Pages
npm run deploy

# 或使用脚本
./scripts/deploy.sh
```

## 📊 性能优化

### 已配置的优化

1. **构建优化**
   - 静态导出减少服务器负载
   - 代码分割和懒加载
   - 图片格式优化（AVIF, WebP）

2. **缓存策略**
   - 静态资源：1年缓存
   - HTML文件：实时更新
   - 图片：长期缓存

3. **安全配置**
   - CSP 内容安全策略
   - XSS 防护
   - 点击劫持防护

## 🌐 自定义域名

1. **在 Cloudflare Dashboard 中**
   - 进入 Pages 项目设置
   - 点击 "Custom domains"
   - 添加你的域名

2. **DNS 配置**
   - 添加 CNAME 记录指向 `your-project.pages.dev`
   - 或使用 Cloudflare 代理

## 🔍 监控和调试

### 查看部署状态
```bash
# 查看部署历史
wrangler pages deployment list --project-name=life-recorder

# 查看项目信息
wrangler pages project list
```

### 性能监控
- Cloudflare Analytics
- Core Web Vitals
- 访问统计

## 🚨 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本（推荐 20.x）
   - 确保所有依赖已安装
   - 查看构建日志

2. **路由问题**
   - 确保 `_redirects` 文件配置正确
   - 检查 SPA 路由配置

3. **静态资源404**
   - 检查 `_headers` 配置
   - 确保文件路径正确

### 调试命令
```bash
# 检查构建输出
ls -la out/

# 本地预览
npm run preview

# 验证配置
wrangler pages deployment list --project-name=life-recorder
```

## 📝 更新部署

### 自动部署
- 推送到 main 分支自动触发部署
- 预览分支自动创建预览部署

### 手动部署
```bash
npm run deploy
```

## 🎯 最佳实践

1. **使用环境变量管理配置**
2. **定期更新依赖**
3. **监控性能指标**
4. **使用 HTTPS**
5. **配置适当的缓存策略**

---

部署完成后，你的应用将在 `https://life-recorder.pages.dev` 上可用！

如果需要帮助，请查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)。
