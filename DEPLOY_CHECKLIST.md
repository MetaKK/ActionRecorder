# 🚀 Cloudflare Pages 部署检查清单

## ✅ 部署前检查

### 1. 项目配置
- [x] Next.js 配置已更新（`output: 'export'`）
- [x] 构建脚本已添加（`npm run build`）
- [x] 输出目录设置为 `out`
- [x] 静态导出配置正确

### 2. 构建测试
- [x] 本地构建成功（`npm run build`）
- [x] 输出目录 `out` 已生成
- [x] 静态文件完整
- [x] 无构建错误

### 3. 配置文件
- [x] `_headers` - 安全头和缓存配置
- [x] `_redirects` - 重定向规则
- [x] `wrangler.toml` - Cloudflare 配置
- [x] `.github/workflows/deploy.yml` - GitHub Actions

## 🎯 部署选项

### 选项 1: Cloudflare Dashboard（推荐新手）

1. **访问 Cloudflare Dashboard**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 点击 "Pages" → "Create a project"

2. **连接 GitHub 仓库**
   - 选择 "Connect to Git"
   - 授权并选择你的仓库

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

### 选项 2: Wrangler CLI（推荐开发者）

1. **安装和登录**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **部署**
   ```bash
   npm run deploy
   ```

### 选项 3: GitHub Actions（推荐团队）

1. **设置 GitHub Secrets**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **推送代码**
   ```bash
   git add .
   git commit -m "Add Cloudflare Pages deployment"
   git push origin main
   ```

## 🔧 部署后配置

### 1. 自定义域名（可选）
- 在 Cloudflare Dashboard 中添加自定义域名
- 配置 DNS 记录

### 2. 环境变量（可选）
```
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 3. 性能优化
- 启用 Cloudflare 代理
- 配置缓存规则
- 启用压缩

## 📊 验证部署

### 1. 功能测试
- [ ] 页面正常加载
- [ ] 路由正常工作
- [ ] 静态资源加载正常
- [ ] 移动端适配正常

### 2. 性能测试
- [ ] 页面加载速度
- [ ] Core Web Vitals 指标
- [ ] 移动端性能

### 3. 安全检查
- [ ] HTTPS 正常工作
- [ ] 安全头配置正确
- [ ] 无控制台错误

## 🚨 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本（推荐 20.x）
   - 确保所有依赖已安装
   - 查看构建日志

2. **路由问题**
   - 检查 `_redirects` 文件
   - 确保 SPA 路由配置正确

3. **静态资源404**
   - 检查 `_headers` 配置
   - 确保文件路径正确

### 调试命令
```bash
# 检查构建输出
ls -la out/

# 本地预览
npm run preview

# 查看部署状态
wrangler pages deployment list --project-name=life-recorder
```

## 📝 部署后维护

### 1. 监控
- 定期检查 Cloudflare Analytics
- 监控 Core Web Vitals
- 查看访问统计

### 2. 更新
- 定期更新依赖
- 监控安全更新
- 测试新功能

### 3. 备份
- 定期备份代码
- 保存配置文件
- 记录部署历史

## 🎉 部署完成

部署成功后，你的应用将在以下地址可用：
- **默认地址**: `https://life-recorder.pages.dev`
- **自定义域名**: `https://your-domain.com`

### 下一步
1. 测试所有功能
2. 配置自定义域名（可选）
3. 设置监控和告警
4. 准备生产环境配置

---

🎊 恭喜！你的应用已成功部署到 Cloudflare Pages！
