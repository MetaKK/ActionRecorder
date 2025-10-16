# 字体设计系统指南 📝

基于现代 UI 设计最佳实践优化的字体排版系统

## 🎯 核心原则

### 1. 字体选择
- **主字体**: Geist Sans - Vercel 设计的现代几何无衬线字体
- **等宽字体**: Geist Mono - 代码显示专用
- **后备字体栈**: 系统字体优先，确保跨平台一致性

### 2. 字体渲染优化
```css
/* 已全局应用 */
-webkit-font-smoothing: antialiased;        /* macOS/iOS 抗锯齿 */
-moz-osx-font-smoothing: grayscale;         /* Firefox 灰度渲染 */
text-rendering: optimizeLegibility;         /* 优化连字和字距 */
font-feature-settings: "kern" 1, "liga" 1;  /* 启用字距和连字 */
```

## 📐 字体规范

### 标题层级 (H1-H6)

```tsx
// H1 - 页面主标题
<h1 className="text-4xl md:text-5xl font-display">
  Life Recorder
</h1>

// H2 - 区块标题  
<h2 className="text-3xl md:text-4xl font-title">
  我的记录
</h2>

// H3 - 小节标题
<h3 className="text-2xl md:text-3xl font-title">
  今日总结
</h3>

// H4-H6 - 更小的标题
<h4 className="text-xl font-title">...</h4>
<h5 className="text-lg font-title">...</h5>
<h6 className="text-base font-title">...</h6>
```

### 正文文本

```tsx
// 标准段落
<p className="font-body">
  这是一段正文内容...
</p>

// 小说明文字
<small className="font-caption text-muted-foreground">
  这是说明文字
</small>

// 粗体强调
<strong className="font-semibold">重要内容</strong>
```

### 特殊文本

```tsx
// 数字和表格（等宽数字）
<div className="font-numeric">
  $123,456.78
</div>

// 代码
<code className="font-mono text-sm">
  const hello = 'world';
</code>

// 优雅文本（启用高级特性）
<p className="font-elegant">
  精致的文字排版
</p>
```

## 🎨 工具类速查

### 字重系列

| 类名 | 字重 | 用途 |
|------|------|------|
| `font-display` | 700 | 大标题展示 |
| `font-title` | 600 | 标题和重要文本 |
| `font-body` | 400 | 正文内容 |
| `font-caption` | 500 | 辅助说明 |

### 间距调整

| 类名 | Letter Spacing | Line Height | 用途 |
|------|----------------|-------------|------|
| `font-compact` | -0.02em | 1.3 | 紧凑布局 |
| `font-body` | -0.011em | 1.6 | 标准正文 |
| `font-relaxed` | 0.01em | 1.8 | 宽松阅读 |

### 数字优化

```tsx
// 表格数字（等宽，便于对齐）
<td className="font-numeric">123.45</td>

// 或者使用内联样式
<span className="tabular-nums">99.99</span>
```

### 特效文字

```tsx
// 渐变文字
<h1 
  className="text-gradient"
  style={{
    '--gradient-from': '#3b82f6',
    '--gradient-to': '#8b5cf6'
  }}
>
  Life Recorder
</h1>

// 发光文字
<span className="text-glow text-blue-500">
  ✨ 新功能
</span>

// 轻微发光
<h2 className="text-glow-subtle">
  标题文字
</h2>
```

## 📱 响应式设计

### 移动端优化

```tsx
// 标题响应式
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
  Life Recorder
</h1>

// 正文响应式
<p className="text-sm sm:text-base md:text-lg">
  内容文字...
</p>
```

### 建议的断点

- **sm**: 640px - 手机横屏
- **md**: 768px - 平板
- **lg**: 1024px - 桌面
- **xl**: 1280px - 大屏

## 🎯 实战示例

### 1. 卡片标题

```tsx
<div className="card">
  <h3 className="text-xl font-title mb-2">
    AI 对话
  </h3>
  <p className="text-sm font-caption text-muted-foreground">
    智能助手随时为你服务
  </p>
</div>
```

### 2. 按钮文字

```tsx
<button className="font-medium tracking-tight">
  开始记录
</button>
```

### 3. 统计数字

```tsx
<div className="stat">
  <div className="text-3xl font-display font-numeric">
    1,234
  </div>
  <div className="text-sm font-caption text-muted-foreground">
    总记录数
  </div>
</div>
```

### 4. 引用文字

```tsx
<blockquote className="border-l-4 border-primary pl-4 italic font-elegant">
  "记录生活，发现美好"
</blockquote>
```

## 🔧 高级技巧

### 1. OpenType 特性

Geist 字体支持多种 OpenType 特性：

```css
/* Stylistic Sets */
font-feature-settings: "ss01" 1;  /* 圆润的 a */
font-feature-settings: "ss02" 1;  /* 单层 g */

/* 数字变体 */
font-variant-numeric: tabular-nums;  /* 等宽数字 */
font-variant-numeric: oldstyle-nums; /* 老式数字 */
```

### 2. 文本平衡

```tsx
// 标题自动平衡换行
<h1 className="text-balance">
  这是一个很长的标题需要换行
</h1>
```

### 3. 性能优化

```tsx
// 优化关键文字的渲染
<h1 className="text-optimize">
  关键标题
</h1>
```

## ✅ 最佳实践清单

- ✅ 标题使用 `font-title` 或 `font-display`
- ✅ 正文使用 `font-body` 
- ✅ 数字使用 `font-numeric` 保持对齐
- ✅ 代码使用 `font-mono`
- ✅ 按钮使用 `font-medium`
- ✅ 说明文字使用 `font-caption`
- ✅ 响应式尺寸使用 `md:` 前缀
- ✅ 深色模式下测试对比度

## 🚫 避免的做法

- ❌ 不要混用多种字体家族
- ❌ 不要使用过多的字重（400, 500, 600, 700 足够）
- ❌ 不要在正文使用过小的字号（< 14px）
- ❌ 不要忽略移动端字体大小
- ❌ 不要在大段文字使用紧凑间距
- ❌ 不要过度使用特效文字

## 📚 参考资源

- [Geist 字体文档](https://vercel.com/font)
- [CSS Fonts Module Level 4](https://www.w3.org/TR/css-fonts-4/)
- [Material Design Typography](https://m3.material.io/styles/typography)
- [Apple Human Interface Guidelines - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)

---

**更新时间**: 2025-10-16  
**维护者**: Life Recorder Team

