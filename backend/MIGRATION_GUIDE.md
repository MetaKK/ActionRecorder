# 🔄 后端独立迁移指南

本指南将帮助你把后端从主项目中独立出来，作为单独的项目/仓库管理和部署。

---

## 📋 迁移选项

### 选项1: 保持在同一仓库 (Monorepo)

**优点**: 
- 代码在一起，便于管理
- 共享类型定义
- 单一仓库维护

**缺点**:
- 部署时需要指定子目录
- CI/CD 配置稍复杂

**适用于**: 小团队、个人项目

### 选项2: 独立仓库

**优点**:
- 后端完全独立
- 可以独立版本管理
- 团队分工更清晰
- 部署配置更简单

**缺点**:
- 需要管理两个仓库
- 类型定义需要同步

**适用于**: 团队协作、微服务架构

---

## 🚀 选项1: Monorepo 部署 (保持现状)

后端已经完全独立，可以直接部署，不需要移动文件。

### 目录结构

```
action-recorder/
├── src/                      # 前端 (Next.js)
├── backend/                  # 后端 (Express) ✅ 已独立
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── README_STANDALONE.md
│   └── ... (所有独立文件)
└── package.json             # 前端依赖
```

### Railway 部署 (推荐)

```bash
# 1. 在 Railway 创建项目
# 2. 连接 GitHub 仓库
# 3. 设置根目录为 "backend"
# 4. Railway 会自动检测并部署
```

**关键配置** - Railway 会自动使用 `backend/railway.json`

### Render 部署

Render 会自动检测 `backend/render.yaml`

### Vercel 部署

```bash
cd backend
vercel --prod
```

---

## 📦 选项2: 独立仓库迁移

### 步骤1: 创建新的 GitHub 仓库

```bash
# 在 GitHub 创建新仓库
# 名称: life-recorder-backend
# 不要初始化 README (我们已经有了)
```

### 步骤2: 提取后端代码

**方法A: 使用 git filter-branch (保留历史)**

```bash
# 克隆原仓库
git clone https://github.com/your-username/action-recorder.git life-recorder-backend
cd life-recorder-backend

# 只保留 backend 目录的历史
git filter-branch --subdirectory-filter backend -- --all

# 清理
git reset --hard
git gc --aggressive
git prune

# 移动文件到根目录 (如果需要)
# backend 目录已经是根目录了

# 添加新的远程仓库
git remote set-url origin https://github.com/your-username/life-recorder-backend.git

# 推送
git push -u origin main
```

**方法B: 简单复制 (不保留历史)**

```bash
# 创建新目录
mkdir life-recorder-backend
cd life-recorder-backend

# 初始化 git
git init

# 从原项目复制 backend 目录的所有文件
cp -r ../action-recorder/backend/* .

# 提交
git add .
git commit -m "Initial commit: Backend independent project"

# 添加远程仓库
git remote add origin https://github.com/your-username/life-recorder-backend.git

# 推送
git push -u origin main
```

### 步骤3: 验证独立性

```bash
# 在新仓库目录中
cd life-recorder-backend

# 安装依赖
npm install

# 配置环境变量
cp env.example .env
# 编辑 .env

# 生成 Prisma Client
npm run prisma:generate

# 启动开发服务器
npm run dev

# 应该能正常运行，不依赖前端代码
```

### 步骤4: 更新文档

```bash
# 重命名 README
mv README_STANDALONE.md README.md

# 删除不需要的文件 (如果有)
rm -rf node_modules/
rm -f .DS_Store
```

### 步骤5: 设置 CI/CD

GitHub Actions 已经配置好了 `.github/workflows/deploy.yml`

更新 secrets:
1. 进入 GitHub 仓库 → Settings → Secrets
2. 添加:
   - `RAILWAY_TOKEN` (如果用 Railway)
   - `DOCKER_USERNAME` (如果用 Docker Hub)
   - `DOCKER_PASSWORD`

---

## 🔄 前后端协作

### 前端调用后端 API

#### 方式1: 环境变量

```typescript
// 前端 src/config/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const apiClient = {
  baseURL: `${API_URL}/api/v1`,
  
  async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  },
  
  // 示例: 获取记录
  async getRecords() {
    return this.request('/records')
  },
  
  // 示例: 创建记录
  async createRecord(data: any) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
```

#### 方式2: 使用 SWR 或 React Query

```typescript
// 前端 src/hooks/useRecords.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useRecords() {
  const { data, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records`,
    fetcher
  )
  
  return {
    records: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  }
}
```

### 前端环境变量

```bash
# 前端 .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000          # 本地开发
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # 生产环境
```

### CORS 配置

确保后端 CORS 允许前端域名：

```bash
# 后端 .env
CORS_ORIGIN=http://localhost:3000,https://your-frontend.vercel.app
```

---

## 🔧 类型定义共享

### 方案1: 手动同步

在前后端分别定义类型：

```typescript
// 后端 src/types/record.ts
export interface Record {
  id: string
  userId: string
  content: string
  timestamp: number
  createdAt: Date
}

// 前端 src/types/record.ts (手动同步)
export interface Record {
  id: string
  userId: string
  content: string
  timestamp: number
  createdAt: string  // JSON 序列化后是字符串
}
```

### 方案2: 共享 npm 包

创建独立的类型包：

```bash
# 创建类型包
mkdir life-recorder-types
cd life-recorder-types
npm init -y

# 发布到 npm
npm publish

# 前后端都安装
npm install life-recorder-types
```

### 方案3: Git Submodule

```bash
# 创建共享类型仓库
git submodule add https://github.com/your-username/life-recorder-types shared/types

# 前后端都引用
import { Record } from '../shared/types'
```

---

## 📊 数据迁移

如果用户已经有本地数据 (IndexedDB)，需要迁移到云端：

### 前端迁移工具

```typescript
// 前端 src/utils/migration.ts
export async function migrateToBackend() {
  // 1. 导出 IndexedDB 数据
  const records = await db.records.toArray()
  const diaries = await db.diaries.toArray()
  
  // 2. 批量上传到后端
  const response = await fetch(`${API_URL}/api/v1/records/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ records, diaries }),
  })
  
  if (response.ok) {
    console.log('迁移成功！')
    // 3. 清空本地数据 (可选)
    // await db.records.clear()
  }
}
```

---

## ✅ 迁移检查清单

### 独立性检查

- [ ] 后端代码不依赖前端文件
- [ ] 所有依赖都在 `backend/package.json` 中
- [ ] 环境变量配置完整 (`env.example`)
- [ ] 独立运行测试通过

### 文档检查

- [ ] README.md 完整
- [ ] 部署指南完整
- [ ] API 文档完整
- [ ] 环境变量说明清楚

### 部署检查

- [ ] Railway/Render/Vercel 配置文件存在
- [ ] Docker 配置完整
- [ ] CI/CD 配置正确
- [ ] 健康检查端点可用

### 安全检查

- [ ] 所有敏感信息在 .env
- [ ] .gitignore 包含 .env
- [ ] CORS 配置正确
- [ ] JWT_SECRET 够强

---

## 🎯 推荐流程

对于大多数项目，我们推荐：

1. **先保持 Monorepo**:
   - 后端已经完全独立
   - 直接部署到 Railway/Render
   - 设置根目录为 `backend`

2. **需要时再分离**:
   - 当团队扩大
   - 当需要独立版本管理
   - 使用上述步骤2迁移

3. **渐进式迁移**:
   - 先部署后端
   - 前端逐步切换到 API
   - 保留本地存储作为备份

---

## 🚨 常见问题

### Q: 迁移后前端还能访问本地数据吗？

A: 可以。前端可以同时保留 IndexedDB 和云端同步：
```typescript
// 优先从云端读取，失败则从本地读取
async function getRecords() {
  try {
    return await api.getRecords()  // 云端
  } catch {
    return await db.records.toArray()  // 本地备份
  }
}
```

### Q: 类型定义如何保持同步？

A: 三种方案：
1. 手动同步（适合小项目）
2. 共享 npm 包（适合大团队）
3. Git submodule（适合中等规模）

### Q: 后端部署后前端如何访问？

A: 更新前端环境变量：
```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### Q: 需要更改前端代码吗？

A: 需要少量更改：
1. API 请求改为调用后端 URL
2. 认证逻辑改为 JWT
3. 数据存储改为API调用

---

## 📞 获取帮助

- 📖 文档: [README_STANDALONE.md](./README_STANDALONE.md)
- 🚀 部署: [BEST_DEPLOYMENT_GUIDE.md](./docs/BEST_DEPLOYMENT_GUIDE.md)
- 🐛 问题: GitHub Issues

---

**建议**: 如果你的项目还比较小，建议先保持 Monorepo 结构，直接部署后端即可。等项目成熟后再考虑完全分离。

**祝迁移顺利！** 🎉

