# 🚀 后端服务快速启动指南

本文档将帮助你在 **5分钟内** 搭建并运行生活记录应用的后端服务。

---

## 📋 前置要求

确保你已安装：
- ✅ [Node.js](https://nodejs.org/) 20+ 
- ✅ [Git](https://git-scm.com/)
- ✅ 一个代码编辑器（推荐 [VS Code](https://code.visualstudio.com/)）

---

## 🎬 第一步：安装依赖

```bash
cd backend
npm install
```

⏱️ 预计时间: 1-2分钟

---

## 🗄️ 第二步：配置数据库（免费）

### 选项A: 使用 Neon（推荐，免费 512MB）

1. 访问 [https://neon.tech](https://neon.tech)
2. 注册并创建新项目
3. 复制连接字符串（格式：`postgresql://user:pass@xxx.neon.tech/dbname`）

### 选项B: 本地 PostgreSQL

```bash
# macOS
brew install postgresql
brew services start postgresql
createdb life-recorder

# Ubuntu/Debian
sudo apt install postgresql
sudo -u postgres createdb life-recorder
```

连接字符串: `postgresql://localhost:5432/life-recorder`

---

## 🔑 第三步：配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件（最小配置）:

```bash
# 数据库（必需）
DATABASE_URL="postgresql://user:pass@xxx.neon.tech/dbname?sslmode=require"

# JWT密钥（必需，随机生成32+字符）
JWT_SECRET="your-super-secret-jwt-key-CHANGE-THIS-min-32-chars"

# Cloudflare R2 配置（稍后配置也可以）
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="life-recorder"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

**生成随机 JWT 密钥**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

⏱️ 预计时间: 2分钟

---

## 🔧 第四步：初始化数据库

```bash
cd backend

# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate
```

看到 `✅ Your database is now in sync with your schema.` 表示成功！

⏱️ 预计时间: 30秒

---

## 🎉 第五步：启动服务器

```bash
npm run dev
```

看到以下输出表示启动成功：

```
🚀 Server running on port 4000
📝 Environment: development
🔗 API: http://localhost:4000/api/v1
✅ Database connected successfully
```

⏱️ 预计时间: 10秒

---

## ✅ 第六步：测试 API

### 1. 健康检查

在浏览器打开: [http://localhost:4000/health](http://localhost:4000/health)

或使用 curl:
```bash
curl http://localhost:4000/health
```

期望输出:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T10:00:00.000Z",
  "uptime": 10.123,
  "environment": "development"
}
```

### 2. 注册用户

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "username": "测试用户"
  }'
```

期望输出:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "xxx-xxx-xxx",
      "email": "test@example.com",
      "username": "测试用户",
      "tier": "FREE",
      "createdAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**保存返回的 `token`，后续请求需要！**

### 3. 创建生活记录

```bash
TOKEN="你的token"

curl -X POST http://localhost:4000/api/v1/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "今天天气不错，心情很好！",
    "timestamp": 1698765432000
  }'
```

### 4. 获取记录列表

```bash
curl http://localhost:4000/api/v1/records \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎊 成功！后端服务已启动

你现在有了一个功能完整的后端API：

- ✅ 用户认证（注册/登录）
- ✅ 生活记录 CRUD
- ✅ AI日记管理
- ✅ 媒体文件上传（需配置 R2）
- ✅ 数据同步

---

## 🔗 下一步

### 1. 配置 Cloudflare R2（图片/视频上传）

**为什么需要 R2？**
- 免费 10GB 存储 + 无限流量
- 全球 CDN 加速
- S3 兼容 API

**如何配置？**

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 R2 → Create bucket → 名称: `life-recorder`
3. 创建 API Token → 权限: Object Read & Write
4. 复制 Account ID, Access Key ID, Secret Access Key
5. 更新 `.env` 文件:

```bash
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="life-recorder"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
```

6. 重启服务器

**测试上传**:
```bash
curl -X POST http://localhost:4000/api/v1/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test-image.jpg"
```

---

### 2. 前端连接后端

修改前端 `.env.local`:

```bash
# API地址
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# 启用后端模式
NEXT_PUBLIC_USE_BACKEND=true
```

**创建 API 客户端** (`src/lib/api/client.ts`):

```typescript
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 添加请求拦截器（自动附加 Token）
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API 方法
export const api = {
  // 认证
  auth: {
    register: (data: { email: string; password: string; username?: string }) =>
      apiClient.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    me: () => apiClient.get('/auth/me'),
  },

  // 生活记录
  records: {
    list: (params?: { page?: number; limit?: number }) =>
      apiClient.get('/records', { params }),
    get: (id: string) => apiClient.get(`/records/${id}`),
    create: (data: any) => apiClient.post('/records', data),
    update: (id: string, data: any) => apiClient.put(`/records/${id}`, data),
    delete: (id: string) => apiClient.delete(`/records/${id}`),
    batchCreate: (records: any[]) => apiClient.post('/records/batch', { records }),
  },

  // AI日记
  diaries: {
    list: (params?: { page?: number; limit?: number }) =>
      apiClient.get('/diaries', { params }),
    get: (id: string) => apiClient.get(`/diaries/${id}`),
    create: (data: any) => apiClient.post('/diaries', data),
    update: (id: string, data: any) => apiClient.put(`/diaries/${id}`, data),
    delete: (id: string) => apiClient.delete(`/diaries/${id}`),
  },

  // 媒体上传
  media: {
    upload: (files: File[]) => {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      return apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    delete: (id: string) => apiClient.delete(`/media/${id}`),
  },

  // 数据同步
  sync: {
    pull: (lastSyncTime: number) =>
      apiClient.post('/sync/pull', { lastSyncTime }),
    push: (data: any) =>
      apiClient.post('/sync/push', data),
    status: () =>
      apiClient.get('/sync/status'),
  },
}
```

**使用示例**:

```typescript
import { api } from '@/lib/api/client'

// 注册
const response = await api.auth.register({
  email: 'user@example.com',
  password: 'password123',
  username: '张三',
})

// 保存 token
localStorage.setItem('auth_token', response.data.data.token)

// 创建记录
await api.records.create({
  content: '今天很开心',
  timestamp: Date.now(),
})

// 获取记录列表
const { data } = await api.records.list({ page: 1, limit: 20 })
console.log(data.data.records)
```

---

### 3. 数据迁移（从 IndexedDB 迁移到云端）

**步骤1**: 在浏览器控制台导出数据

```javascript
// 打开控制台（F12），粘贴运行：
async function exportData() {
  // ... (使用 tools/migrate-to-backend.ts 中的导出脚本)
}
exportData()
```

这会下载一个 `life-recorder-export-xxx.json` 文件。

**步骤2**: 导入到后端

```bash
# 获取你的用户ID（从注册响应或数据库）
USER_ID="xxx-xxx-xxx"

# 运行迁移脚本
cd backend
npx tsx ../tools/migrate-to-backend.ts $USER_ID ../export.json
```

---

### 4. 部署到生产环境

**Railway（推荐，最简单）**:

1. 注册 [Railway](https://railway.app)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway 会自动检测 Node.js 项目
5. 添加 PostgreSQL 服务
6. 配置环境变量（从 `.env` 复制）
7. 部署！

**成本**: $5/月（Hobby Plan）

详细文档: [backend/docs/DEPLOYMENT.md](./backend/docs/DEPLOYMENT.md)

---

## 🐛 常见问题

### 1. `DATABASE_URL` 错误

**错误**: `Can't reach database server`

**解决**:
- 检查 `DATABASE_URL` 格式是否正确
- Neon 数据库需要 `?sslmode=require`
- 确保网络连接正常

### 2. `JWT_SECRET` 太短

**错误**: `JWT_SECRET must be at least 32 characters`

**解决**:
```bash
# 生成新密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 端口已占用

**错误**: `EADDRINUSE: address already in use :::4000`

**解决**:
```bash
# 更改端口
PORT=5000 npm run dev

# 或找到占用进程并杀掉
lsof -ti:4000 | xargs kill -9
```

### 4. Prisma 迁移失败

**错误**: `Migration engine error`

**解决**:
```bash
# 重置数据库（开发环境）
npm run prisma:migrate reset

# 重新生成 Prisma Client
npm run prisma:generate
```

---

## 📚 更多资源

- 📖 [完整API文档](./backend/README.md)
- 🚀 [部署指南](./backend/docs/DEPLOYMENT.md)
- 🏗️ [架构设计](./BACKEND_ARCHITECTURE.md)
- 💬 [问题反馈](https://github.com/your-repo/issues)

---

## 🎉 恭喜！

你已经成功搭建并运行了后端服务！现在可以开始开发前端集成了。

**有问题？** 欢迎提 Issue 或查看文档！

---

**Happy Coding! 🚀**

