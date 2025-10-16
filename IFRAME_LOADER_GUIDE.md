# 通用 Iframe 加载器使用指南

## 概述

创建了一个通用的 iframe 加载器组件，可以在沉浸式容器中加载任何外部网站。

## 功能特性

✅ **通用加载器**：可以加载任何外部 URL  
✅ **沉浸式体验**：全屏展示，保留返回按钮和情绪小人  
✅ **加载状态**：优雅的加载动画  
✅ **错误处理**：处理无效链接的情况  
✅ **自定义标题**：支持显示自定义的加载提示文本  

## 使用方式

### 1. 直接访问 URL

访问 `/iframe` 路由并传递参数：

```
/iframe?url=<encoded_url>&title=<optional_title>
```

**示例**：
```
/iframe?url=https%3A%2F%2Ftwitter.com&title=Twitter
```

### 2. 在思维卡片中添加新链接

编辑 `src/components/ai/ai-chat-button.tsx`：

```typescript
const AI_PLUGINS: AIPlugin[] = [
  // ... 其他插件
  {
    id: "your-plugin",
    emoji: "🌐",
    label: "你的标签",
    route: "/iframe?url=" + encodeURIComponent("https://example.com") + "&title=" + encodeURIComponent("示例网站"),
    color: "from-blue-500 to-purple-600",
    type: "immersive",
  },
];
```

### 3. 支持的 URL 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | string | ✅ | 要加载的外部网站 URL（需要 URL 编码） |
| `title` | string | ❌ | 加载时显示的标题（需要 URL 编码） |

## 已添加的示例

### Twitter 插件

```typescript
{
  id: "twitter",
  emoji: "🐦",
  label: "看看推特",
  route: "/iframe?url=" + encodeURIComponent("https://twitter.com") + "&title=" + encodeURIComponent("Twitter"),
  color: "from-sky-400 to-blue-500",
  type: "immersive",
}
```

## 更多示例

### 添加 YouTube

```typescript
{
  id: "youtube",
  emoji: "🎥",
  label: "看看视频",
  route: "/iframe?url=" + encodeURIComponent("https://youtube.com") + "&title=" + encodeURIComponent("YouTube"),
  color: "from-red-500 to-pink-600",
  type: "immersive",
}
```

### 添加 GitHub

```typescript
{
  id: "github",
  emoji: "🐱",
  label: "代码灵感",
  route: "/iframe?url=" + encodeURIComponent("https://github.com") + "&title=" + encodeURIComponent("GitHub"),
  color: "from-gray-700 to-gray-900",
  type: "immersive",
}
```

### 添加 Medium

```typescript
{
  id: "medium",
  emoji: "📝",
  label: "阅读文章",
  route: "/iframe?url=" + encodeURIComponent("https://medium.com") + "&title=" + encodeURIComponent("Medium"),
  color: "from-green-500 to-emerald-600",
  type: "immersive",
}
```

## 技术细节

### 安全性

iframe 使用 `sandbox` 属性限制权限：
- `allow-same-origin`: 允许同源访问
- `allow-scripts`: 允许执行脚本
- `allow-popups`: 允许弹出窗口
- `allow-forms`: 允许表单提交
- `allow-popups-to-escape-sandbox`: 允许弹出窗口逃逸沙箱

### iframe 权限

通过 `allow` 属性授权：
- 加速度计
- 自动播放
- 剪贴板写入
- 加密媒体
- 陀螺仪
- 画中画

### 注意事项

⚠️ **某些网站可能会阻止 iframe 嵌入**，例如：
- 设置了 `X-Frame-Options: DENY` 的网站
- 设置了严格 CSP 策略的网站

如果网站无法加载，可以考虑：
1. 使用新标签页打开
2. 使用 Web Proxy
3. 直接链接到网站

## 文件结构

```
src/
├── app/
│   └── iframe/
│       └── page.tsx          # 通用 iframe 加载器页面
└── components/
    ├── immersive-container.tsx  # 沉浸式容器组件
    └── ai/
        └── ai-chat-button.tsx   # 思维卡片配置
```

## 未来扩展

可以考虑添加的功能：
- [ ] 网站收藏列表
- [ ] 浏览历史记录
- [ ] 网站分类标签
- [ ] 自定义网站添加界面
- [ ] 网站预览截图

