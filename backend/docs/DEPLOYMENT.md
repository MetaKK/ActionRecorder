# 后端部署指南

本指南将帮助你将后端服务部署到生产环境。

## 🎯 部署选项

### 方案对比

| 平台 | 优点 | 缺点 | 价格 | 推荐指数 |
|------|------|------|------|---------|
| **Railway** | 简单易用，PostgreSQL集成 | 价格稍高 | $5+/月 | ⭐⭐⭐⭐⭐ |
| **Render** | 免费层，自动部署 | 冷启动慢 | $0-7/月 | ⭐⭐⭐⭐ |
| **Vercel (Serverless)** | 与前端同平台 | 需要改造代码 | $0-20/月 | ⭐⭐⭐ |
| **Fly.io** | 全球边缘部署 | 配置稍复杂 | $0-10/月 | ⭐⭐⭐⭐ |
| **AWS/GCP** | 功能强大 | 配置复杂，成本高 | $20+/月 | ⭐⭐⭐ |

## 🚀 Railway 部署（推荐）

### 1. 准备工作

- 注册 [Railway](https://railway.app) 账号
- GitHub 仓库准备就绪

### 2. 创建 PostgreSQL 数据库

1. 登录 Railway
2. 创建新项目
3. 添加 PostgreSQL 服务
4. 复制 `DATABASE_URL`

### 3. 部署后端服务

1. 点击 "New Service" → "GitHub Repo"
2. 选择你的仓库
3. 配置环境变量:

```bash
# 数据库
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway 自动注入

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=7d

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=life-recorder
R2_PUBLIC_URL=https://your-bucket.r2.dev
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Redis (可选)
REDIS_URL=redis://default:xxx@upstash.io:6379

# AI API Keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DOUBAO_API_KEY=xxx

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# Other
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
```

4. 配置构建命令（自动检测）:
```bash
npm install && npm run prisma:generate && npm run build
```

5. 配置启动命令:
```bash
npm run prisma:deploy && npm start
```

6. 部署

### 4. 配置域名（可选）

1. 在 Railway 项目中点击 "Settings"
2. 添加自定义域名: `api.yourdomain.com`
3. 更新 DNS 记录

### 5. 健康检查

访问: `https://your-app.railway.app/health`

---

## 🌐 Render 部署

### 1. 创建 Web Service

1. 注册 [Render](https://render.com)
2. 创建 "New +" → "Web Service"
3. 连接 GitHub 仓库
4. 配置:
   - **Name**: life-recorder-api
   - **Environment**: Node
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:deploy && npm start`

### 2. 创建 PostgreSQL 数据库

1. 创建 "New +" → "PostgreSQL"
2. 选择免费层（256MB RAM）
3. 复制 `Internal Database URL`

### 3. 配置环境变量

同 Railway，在 "Environment" 标签页添加

### 4. 部署

点击 "Create Web Service"

---

## ☁️ Vercel 部署（Serverless）

### 1. 创建 `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. 修改 `server.ts`

```typescript
// 导出 Express app 而不是启动服务器
export default app
```

### 3. 部署

```bash
vercel
```

⚠️ **注意**: Vercel Serverless 有冷启动问题，不适合长连接和大文件上传。

---

## 🔧 Cloudflare R2 配置

### 1. 创建 R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 R2 → "Create bucket"
3. Bucket 名称: `life-recorder`
4. 配置公开访问（可选）

### 2. 创建 API Token

1. R2 → "Manage R2 API Tokens"
2. "Create API Token"
3. 权限: "Object Read & Write"
4. 复制 Access Key ID 和 Secret Access Key

### 3. 配置 CORS（可选）

```json
[
  {
    "AllowedOrigins": ["https://your-frontend.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4. 配置自定义域名

1. R2 Bucket → "Settings" → "Custom Domains"
2. 添加: `cdn.yourdomain.com`
3. 更新 `.env`:
```bash
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

---

## 📊 Neon PostgreSQL 配置

### 1. 创建数据库

1. 注册 [Neon](https://neon.tech)
2. 创建新项目
3. 复制连接字符串

### 2. 配置连接池

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 用于迁移
}
```

### 3. 环境变量

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

---

## 🔴 Redis 配置（可选）

### 使用 Upstash（推荐）

1. 注册 [Upstash](https://upstash.com)
2. 创建 Redis 数据库
3. 复制 `REDIS_URL`

```bash
REDIS_URL=rediss://default:xxx@us1-xxx.upstash.io:6379
```

### 跳过 Redis

如果不配置 Redis，限流功能会自动禁用，其他功能正常工作。

---

## 🔐 环境变量清单

### 必需
- ✅ `DATABASE_URL` - PostgreSQL 连接字符串
- ✅ `JWT_SECRET` - JWT 密钥（至少32字符）
- ✅ `R2_ACCOUNT_ID` - Cloudflare R2 账号ID
- ✅ `R2_ACCESS_KEY_ID` - R2 Access Key
- ✅ `R2_SECRET_ACCESS_KEY` - R2 Secret Key
- ✅ `R2_BUCKET_NAME` - R2 Bucket 名称
- ✅ `R2_PUBLIC_URL` - R2 公开 URL

### 可选
- ⚪ `REDIS_URL` - Redis 连接字符串（限流）
- ⚪ `OPENAI_API_KEY` - OpenAI API Key（AI代理）
- ⚪ `ANTHROPIC_API_KEY` - Anthropic API Key
- ⚪ `DOUBAO_API_KEY` - 豆包 API Key
- ⚪ `CORS_ORIGIN` - CORS 允许的源（默认 *）
- ⚪ `LOG_LEVEL` - 日志等级（debug/info/warn/error）

---

## 🧪 部署后测试

### 1. 健康检查

```bash
curl https://your-api.railway.app/health
```

### 2. 注册测试用户

```bash
curl -X POST https://your-api.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

### 3. 创建记录

```bash
TOKEN="<your-jwt-token>"

curl -X POST https://your-api.railway.app/api/v1/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"测试记录","timestamp":1698765432000}'
```

### 4. 上传图片

```bash
curl -X POST https://your-api.railway.app/api/v1/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test-image.jpg"
```

---

## 📈 监控与日志

### Railway 日志查看

1. 进入项目
2. 点击 "Deployments"
3. 查看实时日志

### 添加监控（可选）

**Sentry** (错误追踪):
```bash
npm install @sentry/node
```

```typescript
// src/server.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

---

## 🚨 常见问题

### 1. 数据库连接失败

**问题**: `Error: Can't reach database server`

**解决**:
- 检查 `DATABASE_URL` 是否正确
- 确保 Neon 数据库未休眠（免费层会自动休眠）
- 检查 IP 白名单（如果配置了）

### 2. R2 上传失败

**问题**: `AccessDenied: Access Denied`

**解决**:
- 检查 API Token 权限
- 确保 Bucket 名称正确
- 检查 CORS 配置

### 3. JWT 验证失败

**问题**: `Invalid token`

**解决**:
- 确保 `JWT_SECRET` 前后端一致
- 检查 Token 是否过期
- 确保 Token 格式正确 (`Bearer <token>`)

### 4. 限流不工作

**问题**: 限流中间件没有效果

**解决**:
- 检查 `REDIS_URL` 是否配置
- Redis 连接是否正常
- 如果不需要限流，可以注释掉中间件

---

## 🔄 持续部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Build
        run: cd backend && npm run build
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 💰 成本估算

### 小规模（100 用户）

| 服务 | 配置 | 成本 |
|------|------|------|
| Railway (计算) | Starter | $5/月 |
| Neon PostgreSQL | 512MB | 免费 |
| Cloudflare R2 | 10GB 存储 | 免费 |
| Upstash Redis | 10K命令/天 | 免费 |
| **总计** | | **$5/月** |

### 中等规模（1000 用户）

| 服务 | 配置 | 成本 |
|------|------|------|
| Railway | Developer | $20/月 |
| Neon PostgreSQL | 3GB | $19/月 |
| Cloudflare R2 | 100GB | $1.50/月 |
| Upstash Redis | 100K命令/天 | $10/月 |
| **总计** | | **$50.5/月** |

---

**部署完成！** 🎉

下一步: [API 集成文档](./API_INTEGRATION.md)

