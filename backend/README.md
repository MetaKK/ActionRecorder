# Life Recorder Backend API

生活记录应用的后端服务 - Node.js + Express + PostgreSQL + Cloudflare R2

## 📋 功能特性

- ✅ **用户认证**: JWT-based 认证系统
- ✅ **生活记录**: CRUD API + 批量导入
- ✅ **AI日记**: 保存和管理 AI 生成的日记
- ✅ **媒体管理**: 图片/视频上传到 Cloudflare R2
- ✅ **数据同步**: 增量同步 + 冲突解决
- ✅ **限流保护**: Redis-based 限流
- ✅ **安全**: Helmet + CORS + JWT
- ✅ **日志**: 结构化日志系统

## 🛠 技术栈

- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Redis (Upstash)
- **Authentication**: JWT
- **Validation**: Zod

## 📦 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```bash
# 数据库 (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="life-recorder"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# (可选) 查看数据库
npm run prisma:studio
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器启动在 `http://localhost:4000`

### 5. 测试 API

```bash
# 健康检查
curl http://localhost:4000/health

# 注册用户
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 登录
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📚 API 文档

### 认证 API

#### POST /api/v1/auth/register
注册新用户

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "John Doe" // optional
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "John Doe",
      "tier": "FREE"
    },
    "token": "jwt-token"
  }
}
```

#### POST /api/v1/auth/login
用户登录

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/v1/auth/me
获取当前用户信息

**请求头**:
```
Authorization: Bearer <jwt-token>
```

### 生活记录 API

#### GET /api/v1/records
获取记录列表（分页）

**Query Parameters**:
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20，最大 100）

**请求头**:
```
Authorization: Bearer <jwt-token>
```

#### POST /api/v1/records
创建新记录

**请求体**:
```json
{
  "content": "今天天气不错",
  "timestamp": 1698765432000,
  "location": {
    "latitude": 31.2304,
    "longitude": 121.4737,
    "address": "上海市黄浦区"
  },
  "audioUrl": "https://r2.dev/audio/xxx.webm",
  "mediaIds": ["media-uuid-1", "media-uuid-2"]
}
```

#### POST /api/v1/records/batch
批量创建记录（用于数据迁移）

**请求体**:
```json
{
  "records": [
    {
      "content": "记录1",
      "timestamp": 1698765432000
    },
    {
      "content": "记录2",
      "timestamp": 1698765433000
    }
  ]
}
```

### 媒体文件 API

#### POST /api/v1/media/upload
上传媒体文件

**请求**:
- Content-Type: `multipart/form-data`
- Field: `files` (支持多文件)

**支持的文件类型**:
- 图片: JPEG, PNG, GIF, WebP
- 视频: MP4, WebM, QuickTime

**响应**:
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "uuid",
        "type": "image",
        "url": "https://r2.dev/images/xxx.jpg",
        "thumbnailUrl": "https://r2.dev/images/xxx_thumb.jpg",
        "width": 1920,
        "height": 1080,
        "size": 524288,
        "mimeType": "image/jpeg"
      }
    ]
  }
}
```

### AI日记 API

#### GET /api/v1/diaries
获取日记列表

#### GET /api/v1/diaries/:id
获取单篇日记

#### POST /api/v1/diaries
保存日记

**请求体**:
```json
{
  "date": "2025-10-22",
  "diaryData": { /* 完整 Diary 对象 */ },
  "mood": "快乐",
  "wordCount": 500,
  "type": "auto",
  "excerpt": "今天是美好的一天...",
  "title": "美好的一天"
}
```

### 同步 API

#### POST /api/v1/sync/pull
从服务器拉取数据

**请求体**:
```json
{
  "lastSyncTime": 1698765432000
}
```

#### POST /api/v1/sync/push
推送数据到服务器

**请求体**:
```json
{
  "lastSyncTime": 1698765432000,
  "changes": {
    "records": [/* ... */],
    "diaries": [/* ... */],
    "deletedIds": ["id1", "id2"]
  }
}
```

## 🚀 部署

### 部署到 Railway

1. 注册 [Railway](https://railway.app)
2. 连接 GitHub 仓库
3. 添加 PostgreSQL 服务
4. 配置环境变量
5. 部署

### 部署到 Render

1. 注册 [Render](https://render.com)
2. 创建 Web Service
3. 连接 GitHub 仓库
4. 配置构建命令:
   ```bash
   npm install && npm run prisma:generate && npm run build
   ```
5. 配置启动命令:
   ```bash
   npm run prisma:deploy && npm start
   ```

### 部署到 Vercel (Serverless)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

## 📊 数据库 Schema

查看完整 Schema: [prisma/schema.prisma](./prisma/schema.prisma)

**核心表**:
- `users`: 用户表
- `records`: 生活记录表
- `diaries`: AI日记表
- `media`: 媒体文件表
- `record_media`: 记录-媒体关联表
- `chat_sessions`: AI聊天会话表
- `api_usage`: API使用统计表

## 🔐 安全

- ✅ Helmet.js (安全头)
- ✅ CORS 配置
- ✅ JWT 认证
- ✅ 限流保护
- ✅ 输入验证 (Zod)
- ✅ SQL注入防护 (Prisma ORM)
- ✅ 密码哈希 (bcrypt)

## 🐛 调试

```bash
# 查看日志等级
LOG_LEVEL=debug npm run dev

# 查看 Prisma 查询
DATABASE_URL="..." npm run prisma:studio

# 查看 Redis 连接
REDIS_URL="..." npm run dev
```

## 📝 开发指南

### 项目结构

```
backend/
├── src/
│   ├── server.ts              # 入口文件
│   ├── middleware/            # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── ratelimit.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/                # 路由
│   │   ├── auth.routes.ts
│   │   ├── record.routes.ts
│   │   ├── diary.routes.ts
│   │   ├── media.routes.ts
│   │   └── sync.routes.ts
│   ├── controllers/           # 控制器
│   ├── services/              # 服务层
│   │   └── storage.service.ts
│   └── utils/                 # 工具函数
│       ├── database.ts
│       ├── logger.ts
│       └── errors.ts
├── prisma/
│   └── schema.prisma          # 数据库 Schema
├── package.json
└── tsconfig.json
```

### 添加新 API

1. **创建路由** (`src/routes/xxx.routes.ts`)
2. **创建控制器** (`src/controllers/xxx.controller.ts`)
3. **在 `server.ts` 中注册路由**
4. **编写测试**

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率
npm run test:coverage
```

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**需要帮助？** 查看 [API文档](./docs/API.md) 或 [部署指南](./docs/DEPLOYMENT.md)

