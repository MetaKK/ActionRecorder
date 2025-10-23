# 🚀 Life Recorder Backend - 最佳部署方案指南

本指南将帮助你选择最适合的部署方案，并提供详细的部署步骤。

---

## 📊 部署方案对比矩阵

| 方案 | 难度 | 成本 | 性能 | 适用场景 | 推荐指数 |
|------|------|------|------|---------|---------|
| **Railway** | ⭐ | $5/月起 | ⭐⭐⭐⭐⭐ | 快速上线、生产环境 | ⭐⭐⭐⭐⭐ |
| **Render** | ⭐ | 免费-$7/月 | ⭐⭐⭐ | 测试、小项目 | ⭐⭐⭐⭐ |
| **Vercel Serverless** | ⭐⭐ | 免费-$20/月 | ⭐⭐⭐ | 与前端同平台 | ⭐⭐⭐ |
| **Docker + VPS** | ⭐⭐⭐⭐ | $5-50/月 | ⭐⭐⭐⭐⭐ | 完全控制、高流量 | ⭐⭐⭐⭐ |
| **Fly.io** | ⭐⭐ | 免费-$10/月 | ⭐⭐⭐⭐⭐ | 全球部署、低延迟 | ⭐⭐⭐⭐ |

---

## 🏆 方案一：Railway (最推荐)

### 为什么选择 Railway？

✅ **优点**:
- 最简单的部署流程（3分钟上线）
- 自动配置 PostgreSQL
- 内置环境变量管理
- 自动 HTTPS 证书
- 优秀的日志和监控
- 支持多环境部署

❌ **缺点**:
- 相对稍贵（$5/月起）
- 免费层限制较多

### 详细部署步骤

#### 步骤1: 准备代码

```bash
# 确保 railway.json 存在
cat backend/railway.json

# 推送代码到 GitHub
git add .
git commit -m "准备部署到 Railway"
git push origin main
```

#### 步骤2: 创建 Railway 项目

1. 访问 [railway.app](https://railway.app)
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择你的仓库
5. 选择 `backend` 目录作为根目录

#### 步骤3: 添加 PostgreSQL 服务

1. 在项目页面点击 "+ New"
2. 选择 "Database" → "PostgreSQL"
3. Railway 会自动创建数据库并注入 `DATABASE_URL`

#### 步骤4: 配置环境变量

在 "Variables" 标签页添加：

```bash
# JWT
JWT_SECRET=<生成一个32字符的随机字符串>
JWT_EXPIRES_IN=7d

# Cloudflare R2 (从 Cloudflare Dashboard 获取)
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=life-recorder
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<your-bucket>.r2.dev

# Redis (可选 - 使用 Upstash)
REDIS_URL=<upstash-redis-url>

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# 其他
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
```

**生成 JWT_SECRET**:
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 或在线生成
https://generate-secret.vercel.app/32
```

#### 步骤5: 部署

1. Railway 会自动检测 `railway.json` 配置
2. 自动运行构建命令: `npm install && npm run prisma:generate && npm run build`
3. 自动运行启动命令: `npm run prisma:deploy && npm start`
4. 等待部署完成 (约2-3分钟)

#### 步骤6: 配置自定义域名 (可选)

1. 点击 "Settings" → "Domains"
2. 点击 "Generate Domain" 获取免费域名
   - 示例: `life-recorder-api-production.up.railway.app`
3. 或添加自定义域名:
   - 输入你的域名: `api.yourdomain.com`
   - 添加 CNAME 记录到你的 DNS
   - Railway 会自动配置 SSL

#### 步骤7: 验证部署

```bash
# 健康检查
curl https://your-app.up.railway.app/health

# 应该返回:
# {"status":"ok","timestamp":"...","uptime":123,"environment":"production"}

# 测试注册
curl -X POST https://your-app.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

### Railway 成本估算

| 用户规模 | 计算资源 | 数据库 | 月成本 |
|---------|---------|--------|--------|
| < 100 | Starter | Included | $5 |
| < 1000 | Developer | Included | $20 |
| < 10000 | Pro | Upgrade | $50+ |

---

## 🆓 方案二：Render (免费层)

### 为什么选择 Render？

✅ **优点**:
- 有免费层（足够测试）
- 自动 CI/CD
- 简单易用
- 支持 `render.yaml` 配置

❌ **缺点**:
- 免费层有冷启动（可能15秒）
- 免费数据库仅256MB
- 性能不如 Railway

### 详细部署步骤

#### 步骤1: 创建 Render 账号

1. 访问 [render.com](https://render.com)
2. 使用 GitHub 登录

#### 步骤2: 使用 Blueprint 部署

1. 点击 "New +" → "Blueprint"
2. 连接 GitHub 仓库
3. Render 会自动检测 `render.yaml`
4. 点击 "Apply"

#### 步骤3: 配置环境变量

Render 会根据 `render.yaml` 自动配置，但需要手动添加敏感信息：

1. 进入 Web Service 页面
2. 点击 "Environment" 标签
3. 添加环境变量:

```bash
JWT_SECRET=<32字符随机字符串>
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=life-recorder
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<your-bucket>.r2.dev
CORS_ORIGIN=https://your-frontend.onrender.com
```

#### 步骤4: 等待部署

- 首次部署约 5-10 分钟
- 后续部署约 2-3 分钟

#### 步骤5: 验证

```bash
# 你的 Render URL
curl https://life-recorder-api.onrender.com/health
```

### Render 成本估算

| 方案 | Web Service | PostgreSQL | 月成本 |
|------|------------|-----------|--------|
| 免费层 | Free (512MB RAM) | Free (256MB) | $0 |
| 付费层 | Starter ($7) | Starter ($7) | $14 |
| 专业层 | Pro ($25) | Standard ($20) | $45 |

**注意**: 免费层有冷启动问题，适合测试，不适合生产。

---

## ☁️ 方案三：Vercel Serverless

### 为什么选择 Vercel？

✅ **优点**:
- 与前端 Next.js 同平台
- 免费额度充足
- 全球 CDN
- 部署简单

❌ **缺点**:
- Serverless 冷启动
- 不适合长时间运行的任务
- 数据库连接池管理复杂
- 文件上传限制 50MB

### 详细部署步骤

#### 步骤1: 确保 vercel.json 存在

```json
{
  "version": 2,
  "builds": [{"src": "src/server.ts", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "src/server.ts"}],
  "env": {"NODE_ENV": "production"}
}
```

#### 步骤2: 修改 server.ts (已完成)

确保 server.ts 导出 Express app：

```typescript
// 只在非 Vercel 环境启动服务器
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer()
}

export default app  // Vercel 需要这个导出
```

#### 步骤3: 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 进入后端目录
cd backend

# 部署
vercel

# 生产环境
vercel --prod
```

#### 步骤4: 配置环境变量

在 Vercel Dashboard 或使用 CLI：

```bash
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add R2_ACCOUNT_ID production
# ... 添加所有必需的环境变量
```

### Vercel 成本估算

| 方案 | 成本 | 包含内容 |
|------|------|---------|
| Hobby (个人) | 免费 | 100GB 流量/月 |
| Pro | $20/月 | 1TB 流量/月 |
| Enterprise | 定制 | 无限流量 |

**注意**: Vercel 主要是 Serverless，不适合需要持续连接的场景。

---

## 🐳 方案四：Docker + VPS (完全控制)

### 为什么选择 Docker？

✅ **优点**:
- 完全控制服务器
- 可以部署到任何地方
- 性能最优
- 支持复杂架构

❌ **缺点**:
- 需要自己管理服务器
- 需要配置反向代理、SSL
- 需要处理更新、备份

### 详细部署步骤

#### 步骤1: 选择 VPS 提供商

推荐:
- **DigitalOcean** ($4/月起)
- **Vultr** ($2.5/月起)
- **Linode** ($5/月起)
- **Hetzner** (€3.79/月起，性价比最高)
- **AWS EC2** (按需计费)

#### 步骤2: 配置服务器

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
apt install docker-compose -y

# 创建项目目录
mkdir -p /opt/life-recorder-api
cd /opt/life-recorder-api
```

#### 步骤3: 上传项目文件

```bash
# 从本地上传 (在本地执行)
scp -r backend/* root@your-server-ip:/opt/life-recorder-api/

# 或使用 Git
# 在服务器上执行:
git clone <your-repo-url> .
```

#### 步骤4: 配置环境变量

```bash
# 在服务器上创建 .env 文件
cd /opt/life-recorder-api
nano .env

# 粘贴你的配置
# (参考 env.example)

# 保存并退出 (Ctrl+O, Enter, Ctrl+X)
```

#### 步骤5: 使用 Docker Compose 部署

```bash
# 启动所有服务 (API + PostgreSQL + Redis)
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

#### 步骤6: 配置 Nginx 反向代理

```bash
# 安装 Nginx
apt install nginx -y

# 创建配置文件
nano /etc/nginx/sites-available/life-recorder-api

# 添加以下配置:
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/life-recorder-api /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

#### 步骤7: 配置 SSL (Let's Encrypt)

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
certbot --nginx -d api.yourdomain.com

# Certbot 会自动配置 Nginx 并启用 HTTPS
# 证书会自动续期
```

#### 步骤8: 设置自动重启

```bash
# 编辑 docker-compose.yml，确保有 restart: unless-stopped
# 或使用 systemd

# 创建 systemd 服务
nano /etc/systemd/system/life-recorder-api.service
```

```ini
[Unit]
Description=Life Recorder API
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/life-recorder-api
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
systemctl enable life-recorder-api
systemctl start life-recorder-api
```

### VPS 成本估算

| VPS 提供商 | 配置 | 月成本 | 适用规模 |
|-----------|------|--------|---------|
| Vultr | 1 vCPU, 1GB RAM | $5 | < 100 用户 |
| Hetzner | 2 vCPU, 4GB RAM | €4.51 | < 1000 用户 |
| DigitalOcean | 2 vCPU, 4GB RAM | $24 | < 5000 用户 |
| AWS EC2 | t3.medium | $30 | 可扩展 |

**额外成本**: 域名 ($10/年), 备份存储 ($5/月)

---

## 🌍 方案五：Fly.io (边缘部署)

### 为什么选择 Fly.io？

✅ **优点**:
- 全球边缘网络 (30+ 数据中心)
- 超低延迟
- 支持多区域部署
- 免费额度充足

❌ **缺点**:
- 配置稍复杂
- 文档相对少

### 详细部署步骤

#### 步骤1: 安装 Fly CLI

```bash
# Mac
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

#### 步骤2: 登录

```bash
fly auth login
```

#### 步骤3: 初始化项目

```bash
cd backend
fly launch

# Fly 会询问:
# - App name: life-recorder-api
# - Region: 选择离你最近的
# - PostgreSQL: Yes (选择 Development)
# - Redis: Yes (可选)
```

#### 步骤4: 配置 fly.toml

Fly 会自动生成 `fly.toml`，确保配置正确：

```toml
app = "life-recorder-api"
primary_region = "hkg"  # 香港

[build]
  [build.args]
    NODE_VERSION = "20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 4000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    timeout = 2000
    grace_period = "5s"
    method = "get"
    path = "/health"
```

#### 步骤5: 配置环境变量

```bash
fly secrets set JWT_SECRET="your-secret"
fly secrets set R2_ACCOUNT_ID="your-account-id"
fly secrets set R2_ACCESS_KEY_ID="your-access-key"
fly secrets set R2_SECRET_ACCESS_KEY="your-secret-key"
# ... 其他环境变量
```

#### 步骤6: 部署

```bash
fly deploy

# 查看状态
fly status

# 查看日志
fly logs
```

#### 步骤7: 多区域部署 (可选)

```bash
# 在多个区域部署
fly scale count 3 --region hkg,sin,nrt

# 香港、新加坡、东京
```

### Fly.io 成本估算

| 资源 | 免费额度 | 成本 (超出后) |
|------|---------|--------------|
| 计算 | 3 shared-cpu-1x | $0.0000025/s |
| 内存 | 256MB x 3 | $0.0000005/s per MB |
| 存储 | 3GB | $0.15/GB/月 |
| 流量 | 160GB | $0.02/GB |

**估算**: 小型应用免费，中型约 $5-15/月

---

## 🎯 推荐选择流程图

```
开始
  ↓
需要免费方案? 
  ├─ 是 → Render (免费层) 或 Fly.io (免费额度)
  └─ 否 ↓
       ↓
追求最简单部署?
  ├─ 是 → Railway ($5/月起)
  └─ 否 ↓
       ↓
需要完全控制?
  ├─ 是 → Docker + VPS ($5/月起)
  └─ 否 ↓
       ↓
前端在 Vercel?
  ├─ 是 → Vercel Serverless (同平台)
  └─ 否 → Fly.io (全球低延迟)
```

---

## 📋 环境配置清单

### Cloudflare R2 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 R2 → "Create bucket"
3. Bucket 名称: `life-recorder`
4. 创建 API Token:
   - R2 → "Manage R2 API Tokens" → "Create API Token"
   - 权限: Object Read & Write
   - 复制 Access Key ID 和 Secret Access Key
5. 配置 CORS (可选):
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

### Redis 配置 (Upstash)

1. 访问 [upstash.com](https://upstash.com)
2. 创建 Redis 数据库
3. 选择区域 (与 API 服务器同区域)
4. 复制 `UPSTASH_REDIS_REST_URL`

### 数据库配置 (Neon)

1. 访问 [neon.tech](https://neon.tech)
2. 创建项目
3. 选择区域
4. 复制 Connection String
5. 格式: `postgresql://user:pass@host/db?sslmode=require`

---

## 🚨 生产环境检查清单

在部署到生产环境前，确保完成以下检查：

### 安全

- [ ] JWT_SECRET 使用强随机字符串 (32+ 字符)
- [ ] 所有敏感信息在环境变量中
- [ ] CORS_ORIGIN 设置为前端域名 (不要用 *)
- [ ] 启用 HTTPS
- [ ] 配置限流 (Redis)
- [ ] 定期备份数据库

### 性能

- [ ] 数据库索引已优化
- [ ] 启用 gzip 压缩
- [ ] 配置 CDN (Cloudflare R2)
- [ ] 监控日志和错误

### 监控

- [ ] 健康检查端点 `/health` 可用
- [ ] 配置错误追踪 (Sentry)
- [ ] 设置日志保留策略
- [ ] 配置告警 (可选)

### 备份

- [ ] 数据库自动备份
- [ ] R2 存储备份策略
- [ ] 配置恢复流程

---

## 📞 获取帮助

- 📖 完整文档: [README_STANDALONE.md](../README_STANDALONE.md)
- 🐛 问题反馈: GitHub Issues
- 💬 社区讨论: GitHub Discussions

---

**建议**: 对于大多数用户，我们推荐从 **Railway** 开始，它提供了最佳的易用性和性能平衡。

**祝部署顺利！** 🎉

