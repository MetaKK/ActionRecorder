# 后端架构设计方案

## 📋 项目现状分析

### 当前架构
- **前端**: Next.js 15 (App Router) + TypeScript
- **存储**: IndexedDB (Dexie.js) + localStorage（纯浏览器本地）
- **AI集成**: 前端直接调用 OpenAI/Anthropic/Doubao API
- **API Key**: 存储在 sessionStorage/localStorage（不安全）
- **数据同步**: 无（数据仅存在于单一浏览器）

### 核心数据类型
1. **Record（生活记录）**: 文本、位置、音频（Base64）、图片/视频
2. **Diary（AI日记）**: AI生成的结构化日记
3. **MediaData（媒体）**: 图片、视频文件（Base64）
4. **AI聊天会话**: 多模型对话历史

### 痛点问题
1. ❌ 数据丢失风险：清除浏览器数据 = 数据全丢
2. ❌ 无法跨设备同步：换电脑/手机无法访问数据
3. ❌ API Key暴露：前端存储不安全
4. ❌ 媒体存储限制：IndexedDB容量有限（50MB-500MB）
5. ❌ 无备份机制：数据无法恢复

---

## 🎯 目标与需求

### 功能需求
1. ✅ **用户系统**: 注册/登录、多设备管理
2. ✅ **数据持久化**: 云端存储所有数据
3. ✅ **跨设备同步**: 实时/增量同步
4. ✅ **媒体存储**: 音频、图片、视频云存储
5. ✅ **AI代理**: 隐藏API Key，统一计费
6. ✅ **数据备份**: 自动备份和恢复
7. ✅ **权限管理**: 免费/付费用户分级

### 非功能需求
1. ✅ **性能**: API响应 < 200ms，媒体上传 < 5s
2. ✅ **安全**: 数据加密、API Key保护
3. ✅ **可扩展**: 支持10万+ 用户
4. ✅ **成本控制**: 初期成本 < $50/月
5. ✅ **部署简单**: 一键部署，易于维护

---

## 🏗️ 技术架构设计

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端层                                  │
│  Next.js 15 (React 19) + TypeScript + IndexedDB (离线缓存)        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS + JWT Token
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                        API网关层                                   │
│  Next.js API Routes / Fastify (Node.js) / FastAPI (Python)       │
│  - 认证/授权 (JWT)                                                │
│  - 限流/防护                                                      │
│  - 请求日志                                                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────────────┐
        │             │             │                     │
┌───────▼──────┐ ┌───▼────────┐ ┌─▼───────────┐  ┌─────▼─────────┐
│  业务服务层   │ │ AI代理服务  │ │  媒体服务    │  │   同步服务     │
│              │ │            │ │             │  │               │
│ - 记录管理   │ │ - GPT-4o   │ │ - 上传/下载 │  │ - 增量同步    │
│ - 日记管理   │ │ - Claude   │ │ - 转码/压缩 │  │ - 冲突解决    │
│ - 用户管理   │ │ - Doubao   │ │ - CDN分发   │  │ - 版本管理    │
└───────┬──────┘ └───┬────────┘ └─┬───────────┘  └─────┬─────────┘
        │            │             │                    │
        └────────────┼─────────────┴────────────────────┘
                     │
        ┌────────────▼────────────────────────┐
        │         数据持久层                   │
        │                                     │
        │  PostgreSQL (关系数据)               │
        │  - 用户、记录、日记、会话            │
        │  - 事务、索引、全文搜索              │
        │                                     │
        │  S3 / R2 / OSS (对象存储)           │
        │  - 音频、图片、视频                 │
        │  - 备份文件                         │
        │                                     │
        │  Redis (缓存 + 队列)                │
        │  - Session、限流、排行榜             │
        │  - 后台任务队列                     │
        └─────────────────────────────────────┘
```

---

## 📦 技术选型方案

### 方案对比

| 组件 | 方案A（推荐）| 方案B | 方案C |
|------|-------------|-------|-------|
| **后端框架** | Node.js + Next.js API Routes | Node.js + Fastify | Python + FastAPI |
| **数据库** | PostgreSQL (Neon/Supabase) | PostgreSQL (Railway) | PostgreSQL (Render) |
| **对象存储** | Cloudflare R2 (免费10GB) | AWS S3 | 阿里云OSS |
| **认证** | NextAuth.js v5 | Clerk | 自建JWT |
| **部署** | Vercel + Cloudflare | Railway | Render |
| **成本** | $0-20/月 | $20-50/月 | $15-40/月 |

### 方案A详细说明（推荐）

#### 1. **后端框架**: Next.js API Routes + TypeScript

**理由**:
- ✅ 与现有项目完美融合（已经是 Next.js）
- ✅ 零学习成本（你已经熟悉 Next.js）
- ✅ 支持 Edge Functions（低延迟）
- ✅ 内置 API 路由，无需额外服务器
- ✅ TypeScript 类型共享前后端

**技术栈**:
```json
{
  "runtime": "Node.js 20+",
  "framework": "Next.js 15",
  "language": "TypeScript 5",
  "ORM": "Prisma / Drizzle ORM",
  "validation": "Zod"
}
```

#### 2. **数据库**: PostgreSQL (Neon Serverless)

**理由**:
- ✅ 关系型数据库，支持复杂查询
- ✅ 全文搜索（pg_trgm 扩展）
- ✅ JSON 字段支持（存储 Diary 结构）
- ✅ Neon: 免费 512MB，$19/月起
- ✅ Serverless: 按需计费，自动休眠

**数据库设计**:
```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    username VARCHAR(100),
    tier VARCHAR(20) DEFAULT 'free', -- free, premium, enterprise
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 生活记录表
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    location JSONB, -- {latitude, longitude, address, ...}
    audio_url VARCHAR(500), -- S3/R2 URL
    audio_duration INTEGER,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_timestamp (user_id, timestamp DESC),
    INDEX idx_created_at (created_at DESC)
);

-- 媒体关联表
CREATE TABLE record_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES records(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0
);

-- 媒体表
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- image, video
    url VARCHAR(500) NOT NULL, -- S3/R2 URL
    thumbnail_url VARCHAR(500),
    width INTEGER,
    height INTEGER,
    size_bytes BIGINT,
    mime_type VARCHAR(100),
    duration INTEGER, -- for video
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_created (user_id, created_at DESC)
);

-- AI日记表
CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    diary_data JSONB NOT NULL, -- 完整 Diary 对象
    mood VARCHAR(50),
    word_count INTEGER,
    type VARCHAR(20) DEFAULT 'auto', -- auto, manual
    excerpt TEXT,
    title VARCHAR(200),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, date, created_at), -- 支持同日多篇
    INDEX idx_user_date (user_id, date DESC),
    INDEX idx_user_pinned (user_id, is_pinned, created_at DESC)
);

-- AI聊天会话表
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    model VARCHAR(50),
    messages JSONB NOT NULL, -- 消息数组
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_updated (user_id, updated_at DESC)
);

-- API使用统计（计费）
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(50),
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_created (user_id, created_at DESC)
);
```

#### 3. **对象存储**: Cloudflare R2

**理由**:
- ✅ 免费 10GB 存储 + 无限流量出站
- ✅ S3 兼容 API
- ✅ 全球 CDN 加速
- ✅ 比 AWS S3 便宜 90%

**价格**:
- 存储: 前 10GB 免费，之后 $0.015/GB/月
- 上传: 免费
- 下载: 免费（无出站流量费）

#### 4. **认证**: NextAuth.js v5

**理由**:
- ✅ Next.js 官方推荐
- ✅ 支持多种登录方式（邮箱、Google、GitHub）
- ✅ JWT + Session 管理
- ✅ 自动处理 CSRF

**配置示例**:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 验证用户逻辑
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })
        if (user && await bcrypt.compare(credentials.password, user.password_hash)) {
          return { id: user.id, email: user.email, tier: user.tier }
        }
        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tier = user.tier
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.tier = token.tier
      return session
    }
  }
})
```

#### 5. **部署**: Vercel + Cloudflare

**Vercel**（前端 + API）:
- ✅ 免费: 100GB 流量/月
- ✅ 自动 CI/CD
- ✅ Edge Functions
- ✅ Preview 环境

**Cloudflare**（数据库 + 存储）:
- ✅ R2 对象存储
- ✅ D1 数据库（可选，SQLite）
- ✅ Workers KV（可选，缓存）

**部署架构**:
```
GitHub → Vercel (自动部署)
         ↓
      Next.js App
         ↓
    API Routes → Neon PostgreSQL
         ↓       ↓
      R2 Storage  Redis (Upstash)
```

---

## 🔌 API设计

### RESTful API规范

#### 认证相关
```
POST   /api/auth/register          # 注册
POST   /api/auth/login             # 登录
POST   /api/auth/logout            # 登出
GET    /api/auth/me                # 获取当前用户
```

#### 生活记录
```
GET    /api/records                # 获取记录列表（分页）
GET    /api/records/:id            # 获取单条记录
POST   /api/records                # 创建记录
PUT    /api/records/:id            # 更新记录
DELETE /api/records/:id            # 删除记录
POST   /api/records/batch          # 批量上传（迁移）
```

#### AI日记
```
GET    /api/diaries                # 获取日记列表
GET    /api/diaries/:id            # 获取单篇日记
GET    /api/diaries/date/:date     # 获取指定日期的日记
POST   /api/diaries                # 创建日记
PUT    /api/diaries/:id            # 更新日记
DELETE /api/diaries/:id            # 删除日记
POST   /api/diaries/generate       # AI生成日记
```

#### 媒体文件
```
POST   /api/media/upload           # 上传媒体（支持分片）
GET    /api/media/:id              # 获取媒体信息
DELETE /api/media/:id              # 删除媒体
GET    /api/media/presigned-url    # 获取上传URL（大文件）
```

#### AI代理
```
POST   /api/ai/chat                # AI聊天（已有）
POST   /api/ai/analyze             # 数据分析（已有）
GET    /api/ai/usage               # 获取AI使用统计
```

#### 同步
```
POST   /api/sync/pull              # 拉取云端数据
POST   /api/sync/push              # 推送本地数据
GET    /api/sync/status            # 同步状态
POST   /api/sync/resolve-conflict  # 解决冲突
```

### API响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "RECORD_NOT_FOUND",
    "message": "Record not found",
    "details": "Record with id xxx does not exist"
  }
}
```

---

## 🔐 安全设计

### 1. 认证与授权

**JWT Token**:
```typescript
// Token 结构
interface JWTPayload {
  userId: string
  email: string
  tier: 'free' | 'premium' | 'enterprise'
  iat: number  // 签发时间
  exp: number  // 过期时间（7天）
}

// 中间件验证
export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    const payload = await verifyJWT(token)
    request.userId = payload.userId
    return null // 验证通过
  } catch {
    return new Response('Invalid token', { status: 401 })
  }
}
```

### 2. 数据加密

- **传输加密**: HTTPS (TLS 1.3)
- **存储加密**: PostgreSQL 磁盘加密 + R2 服务端加密
- **敏感字段加密**: API Key、密码（bcrypt）

### 3. API限流

```typescript
// 使用 Redis 实现限流
const rateLimit = {
  free: '100 requests/15min',
  premium: '1000 requests/15min',
  enterprise: 'unlimited'
}

export async function rateLimitMiddleware(userId: string, tier: string) {
  const key = `ratelimit:${userId}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, 15 * 60) // 15分钟
  }
  
  const limit = tier === 'free' ? 100 : 1000
  if (count > limit) {
    throw new Error('Rate limit exceeded')
  }
}
```

### 4. 数据隔离

- 所有数据库查询必须包含 `user_id` 过滤
- 使用 Row Level Security (Supabase 自动支持)

---

## 📲 数据同步策略

### 同步模型

```
┌──────────────┐                    ┌──────────────┐
│   客户端A    │                    │   客户端B    │
│  (iPhone)    │                    │  (MacBook)   │
└───────┬──────┘                    └──────┬───────┘
        │                                  │
        │  ① 上传修改                       │
        │  (timestamp: 12:00)               │
        ▼                                  │
   ┌────────────────────┐                 │
   │   云端服务器        │                 │
   │  (最新版本仓库)     │                 │
   └────────────────────┘                 │
        │                                  │
        │  ② 推送更新                      │
        │  (WebSocket / 轮询)              │
        └──────────────────────────────────▶
```

### 冲突解决策略

1. **Last Write Wins (LWW)**: 最后修改者胜出
   - 比较 `updated_at` 时间戳
   - 适用于大部分场景

2. **Version Vector**: 版本向量
   - 为每个设备维护版本号
   - 适用于复杂冲突场景

3. **Manual Resolution**: 手动解决
   - 显示冲突，让用户选择
   - 适用于重要数据（日记）

### 实现方案

```typescript
// 增量同步算法
interface SyncRequest {
  lastSyncTime: number  // 客户端最后同步时间
  changes: {
    records: Record[]
    diaries: Diary[]
    deletedIds: string[]
  }
}

interface SyncResponse {
  updates: {
    records: Record[]
    diaries: Diary[]
    deletedIds: string[]
  }
  conflicts: Conflict[]
  newSyncTime: number
}

async function syncData(userId: string, request: SyncRequest): Promise<SyncResponse> {
  // 1. 推送客户端修改到服务器
  for (const record of request.changes.records) {
    const existing = await db.record.findUnique({ where: { id: record.id } })
    
    if (!existing) {
      // 新记录，直接创建
      await db.record.create({ data: record })
    } else if (existing.updated_at < record.updated_at) {
      // 客户端更新，覆盖服务器
      await db.record.update({ where: { id: record.id }, data: record })
    } else {
      // 冲突：服务器数据更新，标记冲突
      conflicts.push({ type: 'record', id: record.id, server: existing, client: record })
    }
  }
  
  // 2. 拉取服务器更新到客户端
  const serverUpdates = await db.record.findMany({
    where: {
      user_id: userId,
      updated_at: { gt: request.lastSyncTime }
    }
  })
  
  return {
    updates: { records: serverUpdates, ... },
    conflicts,
    newSyncTime: Date.now()
  }
}
```

---

## 💰 成本估算

### 免费层配额（足够个人使用）

| 服务 | 免费额度 | 价格（超出后） |
|------|---------|---------------|
| **Vercel** | 100GB流量/月 | $20/月 (Pro) |
| **Neon PostgreSQL** | 512MB数据库 | $19/月 (1GB) |
| **Cloudflare R2** | 10GB存储 + 无限流量 | $0.015/GB/月 |
| **Upstash Redis** | 10K命令/天 | $0.2/100K命令 |
| **NextAuth.js** | 免费（自托管） | - |

**月度成本预估**:

| 用户规模 | 存储 | 流量 | API调用 | 总成本 |
|---------|-----|------|--------|--------|
| **100人** | 5GB | 50GB | 500K | **$0** |
| **1000人** | 50GB | 500GB | 5M | **$30-50** |
| **10000人** | 500GB | 5TB | 50M | **$300-500** |

---

## 🚀 实施计划

### 阶段1: 基础架构搭建（2周）

**Week 1**:
- [ ] 数据库设计与迁移脚本
- [ ] PostgreSQL 部署（Neon）
- [ ] Cloudflare R2 配置
- [ ] NextAuth.js 集成

**Week 2**:
- [ ] API 路由开发（CRUD）
- [ ] 中间件（认证、限流）
- [ ] Prisma ORM 集成
- [ ] 单元测试

### 阶段2: 核心功能开发（3周）

**Week 3-4**:
- [ ] 用户注册/登录流程
- [ ] 生活记录 API
- [ ] 日记 API
- [ ] 媒体上传/下载

**Week 5**:
- [ ] 数据同步逻辑
- [ ] 冲突解决
- [ ] AI 代理服务

### 阶段3: 前端适配（2周）

**Week 6**:
- [ ] 前端 API 客户端
- [ ] 登录/注册 UI
- [ ] 同步状态显示

**Week 7**:
- [ ] 数据迁移工具（IndexedDB → 云端）
- [ ] 离线模式优化
- [ ] 错误处理

### 阶段4: 测试与上线（1周）

**Week 8**:
- [ ] 集成测试
- [ ] 性能优化
- [ ] 生产环境部署
- [ ] 文档编写

---

## 📚 技术文档

### 开发环境配置

```bash
# 1. 安装依赖
npm install @prisma/client prisma next-auth @aws-sdk/client-s3 bcryptjs jsonwebtoken

# 2. 初始化 Prisma
npx prisma init

# 3. 配置环境变量
cp .env.example .env.local
```

### 环境变量

```bash
# .env.local
# 数据库
DATABASE_URL="postgresql://user:pass@neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Google OAuth（可选）
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="life-recorder"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# Redis（可选）
REDIS_URL="redis://default:xxx@upstash.io:6379"

# AI API Keys（服务端）
OPENAI_API_KEY="sk-xxx"
ANTHROPIC_API_KEY="sk-ant-xxx"
DOUBAO_API_KEY="xxx"
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?  @map("password_hash")
  username     String?  @db.VarChar(100)
  tier         UserTier @default(FREE)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  records      Record[]
  diaries      Diary[]
  media        Media[]
  chatSessions ChatSession[]
  apiUsage     ApiUsage[]
  
  @@map("users")
}

enum UserTier {
  FREE
  PREMIUM
  ENTERPRISE
}

model Record {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  content       String   @db.Text
  location      Json?
  audioUrl      String?  @map("audio_url") @db.VarChar(500)
  audioDuration Int?     @map("audio_duration")
  timestamp     BigInt
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  media         RecordMedia[]
  
  @@index([userId, timestamp(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@map("records")
}

model Media {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  type         MediaType
  url          String   @db.VarChar(500)
  thumbnailUrl String?  @map("thumbnail_url") @db.VarChar(500)
  width        Int?
  height       Int?
  sizeBytes    BigInt   @map("size_bytes")
  mimeType     String   @map("mime_type") @db.VarChar(100)
  duration     Int?
  createdAt    DateTime @default(now()) @map("created_at")
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  records      RecordMedia[]
  
  @@index([userId, createdAt(sort: Desc)])
  @@map("media")
}

enum MediaType {
  IMAGE
  VIDEO
}

model RecordMedia {
  id           String @id @default(uuid())
  recordId     String @map("record_id")
  mediaId      String @map("media_id")
  displayOrder Int    @default(0) @map("display_order")
  
  record       Record @relation(fields: [recordId], references: [id], onDelete: Cascade)
  media        Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  
  @@map("record_media")
}

model Diary {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  date       DateTime @db.Date
  diaryData  Json     @map("diary_data")
  mood       String?  @db.VarChar(50)
  wordCount  Int      @map("word_count")
  type       DiaryType @default(AUTO)
  excerpt    String?  @db.Text
  title      String?  @db.VarChar(200)
  isDeleted  Boolean  @default(false) @map("is_deleted")
  isPinned   Boolean  @default(false) @map("is_pinned")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, date, createdAt])
  @@index([userId, date(sort: Desc)])
  @@index([userId, isPinned, createdAt(sort: Desc)])
  @@map("diaries")
}

enum DiaryType {
  AUTO
  MANUAL
}

model ChatSession {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  title     String?  @db.VarChar(200)
  model     String   @db.VarChar(50)
  messages  Json
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, updatedAt(sort: Desc)])
  @@map("chat_sessions")
}

model ApiUsage {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  model        String   @db.VarChar(50)
  inputTokens  Int      @map("input_tokens")
  outputTokens Int      @map("output_tokens")
  costUsd      Decimal  @map("cost_usd") @db.Decimal(10, 6)
  createdAt    DateTime @default(now()) @map("created_at")
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt(sort: Desc)])
  @@map("api_usage")
}
```

---

## 🎓 学习资源

### 推荐学习路径

1. **Next.js API Routes**
   - 官方文档: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
   - 教程: https://www.youtube.com/watch?v=vrR5ZLJelrY

2. **Prisma ORM**
   - 官方文档: https://www.prisma.io/docs
   - 快速开始: https://www.prisma.io/docs/getting-started/quickstart

3. **NextAuth.js**
   - 官方文档: https://next-auth.js.org/
   - 示例: https://github.com/nextauthjs/next-auth-example

4. **Cloudflare R2**
   - 文档: https://developers.cloudflare.com/r2/
   - AWS SDK: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/

---

## ✅ 总结

### 为什么选择这个方案？

1. **技术栈统一**: 全栈 TypeScript，前后端无缝对接
2. **学习成本低**: 基于现有 Next.js 项目，无需学习新框架
3. **成本可控**: 初期 $0-20/月，可扩展到 $300/月（万人规模）
4. **部署简单**: Vercel 一键部署，无需运维
5. **性能优秀**: Edge Functions + CDN，全球低延迟
6. **安全可靠**: 企业级数据库 + 加密 + 认证

### 下一步行动

1. **立即开始**: 创建 Neon 数据库账号
2. **搭建原型**: 实现用户登录 + 简单 CRUD API
3. **迁移数据**: 编写 IndexedDB → PostgreSQL 迁移脚本
4. **逐步替换**: 前端逐步切换到云端 API

---

**需要我开始实施吗？我可以帮你：**
1. ✅ 创建数据库 Schema 和迁移脚本
2. ✅ 实现核心 API 路由
3. ✅ 集成认证系统
4. ✅ 编写数据迁移工具
5. ✅ 前端适配和测试

请告诉我是否开始实施，或者是否需要调整方案！🚀

