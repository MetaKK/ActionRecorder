# 生活记录 - AI生活记录助手

通过语音快速记录日常生活，自动整理成时间线，支持导出给 AI 使用的 H5 Web 应用。

## ✨ 核心功能

- 🎤 **语音录入** - 支持中英文语音识别，连续说话自动识别
- ⌨️ **文本输入** - 支持键盘输入，快捷键 Cmd/Ctrl + Enter 保存
- 📅 **时间线** - 按日期自动分组，支持编辑和删除
- 📤 **导出** - 复制到剪贴板或下载为文件，方便与 AI 对话

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 在浏览器访问（重要：使用 localhost）
http://localhost:3000
```

⚠️ **注意**：必须使用 `localhost` 访问才能使用麦克风功能

## 🎤 使用语音录入

### 第一次使用

1. 访问 `http://localhost:3000`
2. 点击"开始录音"按钮
3. 浏览器会请求麦克风权限，**点击"允许"**
4. 开始说话，实时看到识别结果
5. 点击"停止录音"
6. 点击发送或按 Cmd/Ctrl + Enter 保存

### 如果提示"权限被拒绝"

1. 点击地址栏左侧的 🔒 图标
2. 找到"麦克风"选项，选择"允许"
3. 刷新页面（F5）

### 为什么必须用 localhost？

Chrome 安全限制：

| 访问方式 | 麦克风 |
|---------|--------|
| `http://localhost:3000` | ✅ 可用 |
| `http://127.0.0.1:3000` | ✅ 可用 |
| `http://192.168.x.x:3000` | ❌ **不可用** |
| `https://任何地址` | ✅ 可用 |

**在手机上测试？** 使用 ngrok 创建 HTTPS 隧道：
```bash
brew install ngrok
ngrok http 3000
# 使用生成的 https:// 地址访问
```

## 📤 导出记录

1. 点击"导出记录"按钮
2. 选择时间范围（今天/7天/30天/全部）
3. 点击"复制到剪贴板"
4. 粘贴到 ChatGPT、Claude 等 AI 对话中

**导出格式示例**：
```markdown
# 生活记录

## 2024-10-13 (今天)
- 09:30 晨跑5公里
- 14:00 参加项目会议
- 18:30 和朋友聚餐

---
导出时间：2024-10-13 20:00
记录条数：3
```

## 🛠 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **状态**: Zustand
- **存储**: localStorage
- **语音**: Web Speech API
- **日期**: date-fns

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式
├── components/
│   ├── record-input.tsx    # 录音/输入组件
│   ├── timeline.tsx        # 时间线
│   ├── timeline-item.tsx   # 单条记录
│   ├── export-dialog.tsx   # 导出弹窗
│   ├── permission-guide.tsx # 权限引导
│   └── ui/                 # shadcn/ui 组件
├── lib/
│   ├── hooks/
│   │   ├── use-speech.ts   # 语音识别
│   │   └── use-records.ts  # 记录管理
│   ├── stores/
│   │   └── records-store.ts # Zustand Store
│   ├── utils/
│   │   ├── storage.ts      # localStorage
│   │   ├── date.ts         # 日期格式化
│   │   └── export.ts       # 导出功能
│   └── types.ts            # 类型定义
└── config/
    └── site.ts             # 配置
```

## ⚙️ 构建部署

```bash
# 生产构建
npm run build

# 启动生产服务器
npm start

# 部署到 Vercel（推荐）
npm i -g vercel
vercel
```

## 💡 使用技巧

### 语音识别
- 在安静环境中使用效果更好
- 可以连续说多句话，不需要每句都点击录音
- 说话清晰，速度适中
- 句子之间稍微停顿有助于识别

### 键盘快捷键
- `Cmd/Ctrl + Enter` - 快速保存记录

### 导出给 AI
```
示例对话：

我：这是我最近的生活记录，请帮我分析一下

[粘贴导出的内容]

AI：根据您的记录，我看到...
```

## ⚠️ 常见问题

### 1. 提示"麦克风权限被拒绝"
- 点击地址栏 🔒 → 麦克风 → 允许 → 刷新页面

### 2. 通过 IP 地址访问无法录音
- 这是正常的，Chrome 安全限制
- 改用 `http://localhost:3000` 访问

### 3. 手机上无法使用麦克风
- HTTP + IP 无法使用麦克风
- 使用 ngrok 创建 HTTPS 隧道

### 4. 语音识别不准确
- 检查麦克风是否正常
- 确保网络连接（语音识别需要联网）
- 在安静环境中使用

## 🌐 浏览器兼容性

| 浏览器 | 支持 | 推荐 |
|--------|------|------|
| Chrome 25+ | ✅ 完全支持 | ⭐⭐⭐⭐⭐ |
| Edge 79+ | ✅ 完全支持 | ⭐⭐⭐⭐⭐ |
| Safari 14.1+ | ⚠️ 部分支持 | ⭐⭐⭐ |
| Firefox | ❌ 需手动启用 | ⭐⭐ |

## 📄 数据说明

- 所有记录存储在浏览器本地（localStorage）
- 不会上传到任何服务器
- 清除浏览器数据会删除记录
- 建议定期导出备份

## 📝 许可证

MIT License

---

**提示**：首次使用请允许麦克风权限，使用 `http://localhost:3000` 访问以获得最佳体验。
