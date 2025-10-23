# Life Recorder Backend API

**完全独立的后端服务** - 支持独立部署、Docker化、多平台部署

> ⚡ Node.js + Express + TypeScript + PostgreSQL + Cloudflare R2

## 📋 项目概述

这是一个完全独立的生活记录应用后端服务，提供：
- ✅ 用户认证和授权 (JWT)
- ✅ 生活记录 CRUD API
- ✅ AI日记管理
- ✅ 媒体文件存储 (Cloudflare R2)
- ✅ 数据同步
- ✅ API限流和安全保护

**特点**：
- 🚀 零依赖前端，完全独立
- 🐳 Docker支持，一键部署
- ☁️ 多平台部署支持
- 🔒 生产级安全特性
- 📊 完整的数据库设计

---

## 🚀 快速开始

### 方式1: 自动安装脚本

```bash
# 克隆项目
git clone <your-repo-url>
cd backend

# 运行安装脚本 (Linux/Mac)
chmod +x scripts/setup.sh
./scripts/setup.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

### 方式2: 手动安装

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp env.example .env
# 编辑 .env 文件，填入你的配置

# 3. 生成 Prisma Client
npm run prisma:generate

# 4. 运行数据库迁移
npm run prisma:migrate

# 5. 启动开发服务器
npm run dev
```

服务器将运行在 `http://localhost:4000`

### 方式3: Docker (推荐用于生产)

```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 包含 PostgreSQL + Redis + API 服务
```

---

## 📦 目录结构

```
backend/
├── src/                          # 源代码
│   ├── server.ts                  # 服务器入口
│   ├── controllers/               # 控制器层
│   │   ├── auth.controller.ts
│   │   ├── record.controller.ts
│   │   ├── diary.controller.ts
│   │   ├── media.controller.ts
│   │   └── sync.controller.ts
│   ├── routes/                    # 路由层
│   ├── middleware/                # 中间件
│   ├── services/                  # 服务层
│   │   └── storage.service.ts
│   └── utils/                     # 工具函数
├── prisma/                        # 数据库
│   └── schema.prisma              # 数据库 Schema
├── scripts/                       # 部署脚本
│   ├── setup.sh                   # 安装脚本
│   └── deploy.sh                  # 部署脚本
├── docs/                          # 文档
│   ├── DEPLOYMENT.md
│   └── BEST_PRACTICES.md
├── Dockerfile                     # Docker配置
├── docker-compose.yml             # Docker Compose
├── railway.json                   # Railway配置
├── render.yaml                    # Render配置
├── vercel.json                    # Vercel配置
├── package.json
├── tsconfig.json
└── env.example                    # 环境变量示例
```

---

## ⚙️ 环境变量配置

复制 `env.example` 到 `.env` 并填入以下配置：

### 必需配置

```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# JWT认证
JWT_SECRET="your-super-secret-key-min-32-chars"

# Cloudflare R2 存储
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="life-recorder"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

### 可选配置

```bash
# Redis (用于限流)
REDIS_URL="redis://localhost:6379"

# AI API Keys
OPENAI_API_KEY="sk-xxx"
ANTHROPIC_API_KEY="sk-ant-xxx"

# CORS
CORS_ORIGIN="http://localhost:3000,https://your-frontend.com"
```

---

## 🔌 API 端点

### 认证 API

```
POST   /api/v1/auth/register        # 注册
POST   /api/v1/auth/login           # 登录
GET    /api/v1/auth/me              # 获取用户信息
PUT    /api/v1/auth/profile         # 更新个人资料
```

### 生活记录 API

```
GET    /api/v1/records              # 获取记录列表
POST   /api/v1/records              # 创建记录
PUT    /api/v1/records/:id          # 更新记录
DELETE /api/v1/records/:id          # 删除记录
POST   /api/v1/records/batch        # 批量导入
```

### 媒体文件 API

```
POST   /api/v1/media/upload         # 上传文件
GET    /api/v1/media/:id            # 获取文件信息
DELETE /api/v1/media/:id            # 删除文件
```

### 同步 API

```
POST   /api/v1/sync/pull            # 拉取数据
POST   /api/v1/sync/push            # 推送数据
GET    /api/v1/sync/status          # 同步状态
```

完整 API 文档：[docs/API.md](./docs/API.md)

---

## 🚀 部署方案

### 1. Railway (推荐 - 最简单)

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 添加 PostgreSQL 服务
railway add

# 部署
railway up
```

**优点**: 自动配置数据库、环境变量、HTTPS
**成本**: $5/月起

### 2. Render (有免费层)

1. 访问 [render.com](https://render.com)
2. 连接 GitHub 仓库
3. 选择 `backend` 目录
4. Render 会自动检测 `render.yaml` 配置
5. 点击部署

**优点**: 免费层可用、自动CI/CD
**缺点**: 冷启动慢 (免费层)

### 3. Vercel (Serverless)

```bash
# 安装 Vercel CLI
npm install -g vercel

# 进入后端目录
cd backend

# 部署
vercel --prod
```

**注意**: Serverless 适合小流量，大文件上传有限制

### 4. Docker + VPS

```bash
# 1. 构建镜像
docker build -t life-recorder-api .

# 2. 运行容器
docker run -d \
  -p 4000:4000 \
  --env-file .env \
  --name life-recorder-api \
  life-recorder-api

# 或使用 Docker Compose
docker-compose up -d
```

**适用于**: 自有服务器、VPS (AWS/DigitalOcean/Vultr)

### 5. Fly.io (边缘部署)

```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 启动项目
fly launch

# 部署
fly deploy
```

**优点**: 全球边缘网络、低延迟
**成本**: $0-10/月

---

## 🔐 数据库配置

### Neon (推荐 - Serverless PostgreSQL)

1. 注册 [neon.tech](https://neon.tech)
2. 创建项目
3. 复制 CONNECTION STRING
4. 更新 .env:
   ```bash
   DATABASE_URL="postgresql://xxx@xxx.neon.tech/xxx?sslmode=require"
   ```

**优点**: 
- 免费 512MB
- 自动休眠节省成本
- 无需管理服务器

### Supabase (开源替代)

1. 注册 [supabase.com](https://supabase.com)
2. 创建项目
3. 获取数据库URL
4. 更新 .env

**优点**: 
- 免费 500MB
- 提供额外功能 (Auth/Storage/Realtime)

### Railway/Render 内置数据库

部署时自动提供 PostgreSQL，无需手动配置

---

## 📊 数据库 Schema

### 核心表

```sql
users           -- 用户表
records         -- 生活记录表
diaries         -- AI日记表
media           -- 媒体文件表
record_media    -- 记录-媒体关联表
chat_sessions   -- AI聊天会话表
api_usage       -- API使用统计表
```

### 运行迁移

```bash
# 开发环境
npm run prisma:migrate

# 生产环境
npm run prisma:deploy

# 查看数据库
npm run prisma:studio
```

---

## 🧪 测试

```bash
# 健康检查
curl http://localhost:4000/health

# 注册用户
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# 登录
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

---

## 📈 监控和日志

### 查看日志

```bash
# 开发环境
npm run dev  # 实时日志

# 生产环境 (Docker)
docker logs -f life-recorder-api

# Railway
railway logs

# Render
在 Dashboard 查看
```

### 添加错误追踪 (可选)

```bash
# 安装 Sentry
npm install @sentry/node

# 配置
# 在 server.ts 中初始化 Sentry
```

---

## 🔧 故障排除

### 数据库连接失败

```bash
# 检查 DATABASE_URL 是否正确
echo $DATABASE_URL

# 测试连接
npm run prisma:studio
```

### R2 上传失败

```bash
# 检查 R2 凭证
echo $R2_ACCESS_KEY_ID

# 确保 Bucket 存在
# 检查 CORS 配置
```

### 端口占用

```bash
# 更改端口
PORT=5000 npm run dev

# 或在 .env 中设置
PORT=5000
```

---

## 💰 成本估算

### 小规模 (< 100 用户)

| 服务 | 平台 | 成本 |
|------|------|------|
| API 服务 | Railway Starter | $5/月 |
| 数据库 | Neon Free | $0 |
| 存储 | Cloudflare R2 (10GB) | $0 |
| Redis | Upstash Free | $0 |
| **总计** | | **$5/月** |

### 中等规模 (< 1000 用户)

| 服务 | 平台 | 成本 |
|------|------|------|
| API 服务 | Railway Developer | $20/月 |
| 数据库 | Neon Pro (3GB) | $19/月 |
| 存储 | Cloudflare R2 (100GB) | $1.5/月 |
| Redis | Upstash Pro | $10/月 |
| **总计** | | **$50.5/月** |

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)

---

## 📞 支持

- 📖 文档: [docs/](./docs/)
- 🐛 问题: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/your-repo/discussions)

---

## 🎉 致谢

感谢以下开源项目:
- Express.js
- Prisma
- PostgreSQL
- Cloudflare R2
- TypeScript

---

**开始使用**: `npm install && npm run dev` 🚀

