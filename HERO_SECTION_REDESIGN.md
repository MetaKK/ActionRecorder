# Hero Section 重设计 - Lovable.dev 风格

> 参考 [Lovable.dev](https://lovable.dev/) 的设计语言，打造大气、优雅、富有科技感的输入体验

## 设计参考

### Lovable.dev 的核心特点

1. **超大标题** - 视觉焦点，立即传达产品价值
2. **简洁副标题** - 一句话说明产品功能
3. **突出的输入框** - 大圆角、阴影、毛玻璃效果
4. **操作按钮在内** - 所有功能集成在输入框内部
5. **居中布局** - 内容优先，两侧留白

## 重设计对比

### Before（功能优先）

```
┌────────────────────────────┐
│ [复杂的输入框]             │
│ [很多按钮]                 │
└────────────────────────────┘
```

**问题**：
- ❌ 没有标题或副标题
- ❌ 输入框不够突出
- ❌ 按钮样式不统一
- ❌ 缺乏视觉层次

### After（Lovable 风格）

```
┌────────────────────────────┐
│      记录生活               │  ← 超大标题
│      用文字、语音或图片，   │  ← 简洁副标题
│      捕捉每一个值得铭记的   │
│      瞬间                   │
│                            │
│ ┌──────────────────────┐   │
│ │                      │   │
│ │   [大输入框]         │   │  ← 突出的输入框
│ │                      │   │
│ │                      │   │
│ │ [⚪][⚪][⚪]  [⚫]  │   │  ← 底部按钮
│ └──────────────────────┘   │
└────────────────────────────┘
```

**改进**：
- ✅ 清晰的信息层级
- ✅ 视觉焦点明确
- ✅ 大气的输入体验
- ✅ 统一的按钮风格

## 实现细节

### 1. Hero Section 标题

```tsx
<div className="relative w-full flex flex-col items-center px-4 text-center mb-12">
  {/* Hero Section - Lovable 风格 */}
  <div className="flex w-full flex-col items-center justify-center gap-6 mb-6">
    {/* 主标题 */}
    <h1 className="text-4xl font-bold leading-none text-foreground tracking-tight 
                   md:text-5xl lg:text-6xl">
      记录生活
    </h1>
    
    {/* 副标题 */}
    <p className="max-w-2xl text-center text-lg leading-tight 
                  text-foreground/60 md:text-xl">
      用文字、语音或图片，捕捉每一个值得铭记的瞬间
    </p>
  </div>
</div>
```

**设计决策**：
- **标题**：text-4xl → text-6xl（响应式）
  - 移动端：36px
  - 平板：48px  
  - 桌面：60px
- **副标题**：text-foreground/60
  - 60% 透明度，轻量次要
  - max-w-2xl 限制宽度，保持可读性
- **居中对齐**：text-center, items-center
- **留白**：gap-6, mb-6, mb-12

### 2. 输入框容器

```tsx
<form className="group flex flex-col gap-3 p-4 w-full 
                rounded-[28px]                     // 大圆角
                border border-border/40            // 柔和边框
                bg-muted/30 backdrop-blur-xl       // 毛玻璃
                shadow-xl                          // 大阴影
                transition-all duration-200 ease-out
                focus-within:border-foreground/20  // Focus 状态
                hover:border-foreground/10         // Hover 状态
                focus-within:hover:border-foreground/20">
```

**关键特性**：
- **rounded-[28px]**：28px 圆角，比 rounded-3xl (24px) 更圆
- **bg-muted/30**：30% 透明度，轻盈感
- **backdrop-blur-xl**：强模糊，毛玻璃效果
- **shadow-xl**：大阴影，突出感
- **border-border/40**：40% 透明边框，微妙

**交互状态**：
- Rest: `border-border/40`
- Hover: `border-foreground/10`
- Focus: `border-foreground/20`

### 3. Textarea 优化

```tsx
<Textarea
  className="w-full resize-none bg-transparent 
             text-[16px] leading-snug              // 16px 避免 iOS 缩放
             placeholder:text-muted-foreground 
             focus-visible:outline-none 
             border-0 p-0 ring-0                   // 移除所有边框
             focus-visible:ring-0 
             focus-visible:ring-offset-0
             max-h-[max(35svh,5rem)]               // 响应式最大高度
             placeholder-shown:text-ellipsis 
             placeholder-shown:whitespace-nowrap"
  style={{ minHeight: '100px', height: '100px' }}
/>
```

**设计决策**：
- **text-[16px]**：iOS 不会自动缩放（<16px 会缩放）
- **leading-snug**：紧凑行高，节省空间
- **border-0 p-0**：移除所有内边距和边框
- **bg-transparent**：透明背景，融入容器
- **100px 最小高度**：足够的输入空间

### 4. 统一按钮系统

```tsx
// 基础按钮样式
<button
  className={cn(
    "inline-flex items-center justify-center",
    "h-10 w-10 md:h-8 md:w-8",          // 响应式尺寸
    "rounded-full p-0",                 // 圆形
    "border border-input bg-muted",     // 边框 + 背景
    "transition-all duration-150 ease-in-out",
    "hover:bg-accent hover:border-accent",
    "text-muted-foreground hover:text-foreground"
  )}
>
  <Icon className="h-4 w-4" />
</button>
```

**统一规范**：
| 属性 | 值 | 说明 |
|------|-----|------|
| 尺寸 | h-10 w-10 (md: h-8 w-8) | 移动40px，桌面32px |
| 形状 | rounded-full | 完美圆形 |
| 图标 | h-4 w-4 (16px) | 统一图标大小 |
| 边框 | border-input | 统一边框色 |
| 背景 | bg-muted | 统一背景色 |
| 过渡 | duration-150 ease-in-out | 快速流畅 |

**状态颜色系统**：
```tsx
// 录音按钮
isRecording && "border-red-500/50 bg-red-500/10 text-red-600 animate-pulse"

// 位置按钮
isEnabled && "border-blue-500/50 bg-blue-500/10 text-blue-600"

// 图片按钮
hasImages && "border-cyan-500/50 bg-cyan-500/10 text-cyan-600"

// 语音转文本
isListening && "border-purple-500/50 bg-purple-500/10 text-purple-600 animate-pulse"
```

**透明度规范**：
- 边框：`/50` (50%)
- 背景：`/10` (10%)
- 文字：完全不透明

### 5. 发送按钮特殊处理

```tsx
<button
  type="submit"
  className={cn(
    "inline-flex items-center justify-center",
    "h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
    "bg-foreground text-background",        // 反转色，突出
    "transition-all duration-150 ease-out",
    "hover:opacity-90",                     // 微妙的 hover
    "disabled:pointer-events-none disabled:opacity-50"
  )}
>
  {/* 上箭头图标 */}
</button>
```

**为什么突出**：
- **bg-foreground**：使用前景色作为背景
- **text-background**：反转文字颜色
- **视觉重量**：黑色（暗色模式白色）按钮最重
- **功能优先**：发送是主要操作

## 设计原则

### 1. 视觉层级（Visual Hierarchy）

```
层级 1：标题 (text-6xl, font-bold)
  ↓
层级 2：副标题 (text-xl, foreground/60)
  ↓  
层级 3：输入框 (shadow-xl, border)
  ↓
层级 4：按钮 (h-8 w-8, muted)
  ↓
层级 5：提示文字 (text-xs, muted-foreground/40)
```

### 2. 一致性（Consistency）

**所有按钮遵循相同规范**：
- ✅ 相同尺寸（h-10 w-10）
- ✅ 相同形状（rounded-full）
- ✅ 相同图标大小（h-4 w-4）
- ✅ 相同过渡时间（150ms）
- ✅ 相同交互反馈

### 3. 响应式（Responsive）

**移动端优先**：
```tsx
h-10 w-10           // 默认：40x40px (移动端友好)
md:h-8 md:w-8       // 桌面端：32x32px (更紧凑)
```

**标题响应式**：
```tsx
text-4xl            // 移动端：36px
md:text-5xl         // 平板：48px
lg:text-6xl         // 桌面：60px
```

### 4. 可访问性（Accessibility）

```tsx
// 语义化标签
<h1>记录生活</h1>

// aria-label
aria-label="上传图片或视频"

// disabled 状态
disabled={isUploading}

// title 提示
title="点击启用位置记录"

// focus-visible
focus-visible:outline-none 
focus-visible:ring-1 
focus-visible:ring-ring
```

## 参数对比

### 输入框

| 属性 | Before | After | 改进 |
|------|--------|-------|------|
| 圆角 | rounded-[28px] | rounded-[28px] | ✓ 保持 |
| 背景 | bg-muted/50 | bg-muted/30 | ✅ 更轻盈 |
| 模糊 | backdrop-blur-sm | backdrop-blur-xl | ✅ 更强 |
| 阴影 | shadow-lg | shadow-xl | ✅ 更突出 |
| 边框 | border-border/40 | border-border/40 | ✓ 保持 |

### 按钮

| 属性 | Before | After | 改进 |
|------|--------|-------|------|
| 尺寸 | h-10 w-10 | h-10 w-10 | ✓ 统一 |
| 形状 | rounded-full | rounded-full | ✓ 统一 |
| 图标 | h-5 w-5 | h-4 w-4 | ✅ 更精致 |
| 过渡 | 300ms | 150ms | ✅ 更快 |
| 样式 | 各不相同 | 统一规范 | ✅ 一致性 |

### Textarea

| 属性 | Before | After | 改进 |
|------|--------|-------|------|
| 字号 | text-[16px] | text-[16px] | ✓ 保持 |
| 行高 | leading-relaxed | leading-snug | ✅ 更紧凑 |
| 高度 | 140px | 100px | ✅ 更合理 |
| 内边距 | px-3 py-3 | p-0 | ✅ 更简洁 |

## 效果预览

### 桌面端（Desktop）

```
┌─────────────────────────────────────────────┐
│                                             │
│                  记录生活                    │ ← 60px
│                                             │
│     用文字、语音或图片，捕捉每一个值得铭记的 │ ← 20px
│              瞬间                           │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │                                    │    │
│  │  [大输入区域 - 100px 高]          │    │
│  │                                    │    │
│  │  [⚪32][⚪32][⚪32] ... [⚫32]   │    │
│  └────────────────────────────────────┘    │
│                                             │
│         Cmd/Ctrl + Enter 快速保存           │ ← 提示
└─────────────────────────────────────────────┘
```

### 移动端（Mobile）

```
┌──────────────────────┐
│                      │
│     记录生活          │ ← 36px
│                      │
│  用文字、语音或图片， │ ← 18px
│  捕捉每一个值得铭记的 │
│  瞬间                │
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │  [大输入区域]    │ │
│ │                  │ │
│ │  [⚪40] [⚪40]  │ │
│ │  [⚪40] ... [⚫40]│ │
│ └──────────────────┘ │
└──────────────────────┘
```

## 代码优化

### Before（复杂）

```tsx
<Button
  variant="ghost"
  size="icon"
  className={`h-10 w-10 rounded-full p-0 border 
    transition-all duration-300 md:h-9 md:w-9 ${
    isRecording 
      ? 'border-red-500/80 bg-red-500/20 text-red-600 
         shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' 
      : 'border-border/40 bg-background/50 
         backdrop-blur-sm text-muted-foreground 
         hover:bg-red/10 hover:border-red-500/50'
  }`}
>
```

### After（简洁）

```tsx
<button
  className={cn(
    "inline-flex items-center justify-center",
    "h-10 w-10 md:h-8 md:w-8 rounded-full p-0",
    "border border-input bg-muted",
    "transition-all duration-150 ease-in-out",
    "hover:bg-accent hover:border-accent",
    "text-muted-foreground hover:text-foreground",
    isRecording && "border-red-500/50 bg-red-500/10 text-red-600 animate-pulse"
  )}
>
```

**改进**：
- ✅ 使用 `cn()` 工具函数
- ✅ 移除嵌套三元运算符
- ✅ 简化类名组合
- ✅ 更易维护

## 参考资料

- **设计参考**：[Lovable.dev](https://lovable.dev/)
- **设计系统**：Tailwind CSS
- **组件库**：shadcn/ui
- **字体**：系统默认字体

## 总结

这次重设计的核心是**借鉴 Lovable.dev 的设计语言**，打造一个：

✨ **大气的**：
- 超大标题（60px）
- 充足的留白
- 清晰的视觉层级

✨ **优雅的**：
- 大圆角输入框（28px）
- 柔和的毛玻璃效果
- 精致的阴影和边框

✨ **富有科技感的**：
- 现代化的设计语言
- 流畅的交互反馈
- 统一的按钮系统

**设计哲学**：
> 让用户一打开页面，就被吸引到输入框
> 让输入成为一种享受，而非负担
> 让设计服务于功能，而非喧宾夺主

---

**状态**：✅ 已完成重设计
**提交**：f4e9f9a - 重新设计 Hero Section - Lovable.dev 风格

