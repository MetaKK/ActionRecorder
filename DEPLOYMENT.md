# Cloudflare Pages 部署指南

## 🚀 部署步骤

### 方法一：通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 登录你的账户

2. **创建 Pages 项目**
   - 点击左侧菜单 "Pages"
   - 点击 "Create a project"
   - 选择 "Connect to Git"

3. **连接 GitHub 仓库**
   - 选择你的 GitHub 仓库
   - 授权 Cloudflare 访问你的仓库

4. **配置构建设置**
   ```
   Framework preset: Next.js (Static HTML Export)
   Build command: npm run build
   Build output directory: out
   Root directory: /
   ```

5. **环境变量（可选）**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
   ```

6. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

### 方法二：通过 Wrangler CLI

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **部署到 Cloudflare Pages**
   ```bash
   wrangler pages deploy out --project-name=life-recorder
   ```

### 方法三：通过 GitHub Actions（自动化）

1. **创建 GitHub Actions 工作流**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Cloudflare Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm ci
         - run: npm run build
         - uses: cloudflare/pages-action@v1
           with:
             apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
             projectName: life-recorder
             directory: out
   ```

2. **设置 GitHub Secrets**
   - `CLOUDFLARE_API_TOKEN`: 你的 Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare Account ID

## 🔧 配置说明

### Next.js 配置
- `output: 'export'`: 启用静态导出
- `trailingSlash: true`: 支持尾部斜杠
- `distDir: 'out'`: 输出目录

### Cloudflare Pages 配置
- `_headers`: 安全头和缓存配置
- `_redirects`: 重定向规则
- `wrangler.toml`: Wrangler 配置

## 📊 性能优化

### 构建优化
- 自动压缩和优化
- 图片格式优化（AVIF, WebP）
- 代码分割和懒加载

### 缓存策略
- 静态资源：1年缓存
- HTML文件：实时更新
- 图片资源：长期缓存

### 安全配置
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

### 构建日志
- 在 Cloudflare Dashboard 中查看构建日志
- 使用 `wrangler pages deployment list` 查看部署历史

### 性能监控
- 使用 Cloudflare Analytics
- 监控 Core Web Vitals
- 查看访问统计

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
# 本地预览
npm run preview

# 检查构建输出
ls -la out/

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

部署完成后，你的应用将在 `https://your-project.pages.dev` 上可用！
