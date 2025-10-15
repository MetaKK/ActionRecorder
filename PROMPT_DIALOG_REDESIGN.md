# Prompt Dialog 完整重构方案

## 🎯 重构目标

基于Apple设计理念和业内最佳实践，重新设计英文学习Prompt生成器，重点关注Prompt预览区域，确保PC和移动端的完美兼容。

## 📋 当前问题分析

### 1. PC端问题
- 左侧栏各个模块的边距不优雅且不固定
- 教材部分占据位置太多，缺乏Apple风格的精致感
- 整体设计偏向PC风格，移动端体验不佳

### 2. 移动端问题
- 布局在小屏幕上基本不可用
- 缺乏响应式设计
- 交互元素过小，难以操作

## 🎨 Apple设计原则应用

### 1. 视觉层次
- **清晰的信息架构**：配置 → 预览 → 操作
- **渐进式披露**：重要信息优先显示
- **一致的间距系统**：8px基础网格系统

### 2. 交互设计
- **直观的操作流程**：3步完成Prompt生成
- **即时反馈**：实时预览更新
- **优雅的动画**：微交互提升体验

### 3. 响应式设计
- **移动优先**：从小屏幕开始设计
- **断点策略**：sm(640px), md(768px), lg(1024px), xl(1280px)
- **内容优先**：确保核心功能在所有设备上可用

## 🏗️ 重构架构设计

### 1. 整体布局
```
┌─────────────────────────────────────────┐
│ Header: 标题 + 描述                      │
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │ 配置区域     │ │ Prompt预览区域      │ │
│ │ (侧边栏)     │ │ (主要内容区域)       │ │
│ │             │ │                     │ │
│ │ • 教材选择   │ │ ┌─────────────────┐ │ │
│ │ • 课程范围   │ │ │ 实时预览         │ │ │
│ │ • 模板选择   │ │ │ (可滚动)         │ │ │
│ │             │ │ └─────────────────┘ │ │
│ │             │ │                     │ │
│ │             │ │ [复制按钮]          │ │
│ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. 响应式布局策略
- **Mobile (< 768px)**: 垂直堆叠，全屏预览
- **Tablet (768px - 1024px)**: 侧边栏 + 主内容
- **Desktop (> 1024px)**: 固定侧边栏 + 自适应主内容

## 🎯 核心功能优化

### 1. Prompt预览区域 (最重要)
- **全屏预览模式**：移动端可全屏查看
- **语法高亮**：支持Markdown和代码高亮
- **实时更新**：配置变化时即时预览
- **复制优化**：一键复制，支持多种格式

### 2. 配置区域优化
- **紧凑设计**：减少垂直空间占用
- **分组管理**：相关配置归组显示
- **智能默认**：减少用户配置负担

### 3. 交互体验提升
- **手势支持**：移动端滑动操作
- **键盘导航**：PC端完整键盘支持
- **无障碍访问**：ARIA标签和语义化HTML

## 🛠️ 技术实现方案

### 1. 组件架构
```typescript
EnglishPromptDialog/
├── components/
│   ├── ConfigPanel.tsx      // 配置面板
│   ├── PreviewPanel.tsx     // 预览面板
│   ├── BookSelector.tsx     // 教材选择器
│   ├── LessonRange.tsx      // 课程范围选择
│   ├── TemplateSelector.tsx  // 模板选择器
│   └── ActionBar.tsx        // 操作栏
├── hooks/
│   ├── usePromptPreview.ts   // 预览逻辑
│   ├── useResponsiveLayout.ts // 响应式布局
│   └── useKeyboardShortcuts.ts // 键盘快捷键
└── styles/
    ├── mobile.css           // 移动端样式
    ├── desktop.css          // 桌面端样式
    └── animations.css       // 动画样式
```

### 2. 状态管理
```typescript
interface PromptDialogState {
  // 配置状态
  selectedBook: string;
  lessonRange: [number, number];
  selectedTemplate: string;
  
  // UI状态
  isPreviewFullscreen: boolean;
  isConfigCollapsed: boolean;
  
  // 预览状态
  previewContent: string;
  isGenerating: boolean;
}
```

### 3. 响应式断点
```css
/* Mobile First */
.prompt-dialog {
  @apply flex flex-col;
}

/* Tablet */
@media (min-width: 768px) {
  .prompt-dialog {
    @apply flex-row;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .prompt-dialog {
    @apply max-w-7xl;
  }
}
```

## 📱 移动端优化重点

### 1. 触摸友好
- 最小点击区域：44px × 44px
- 手势支持：滑动、捏合缩放
- 触摸反馈：触觉反馈和视觉反馈

### 2. 性能优化
- 虚拟滚动：长内容预览
- 懒加载：按需加载模板
- 缓存策略：智能缓存预览内容

### 3. 可访问性
- 屏幕阅读器支持
- 高对比度模式
- 字体大小调节

## 🎨 视觉设计规范

### 1. 色彩系统
```css
:root {
  --primary: #007AFF;      /* Apple Blue */
  --secondary: #5856D6;    /* Purple */
  --success: #34C759;      /* Green */
  --warning: #FF9500;      /* Orange */
  --error: #FF3B30;        /* Red */
}
```

### 2. 间距系统
```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
}
```

### 3. 字体系统
```css
:root {
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
}
```

## 🚀 实施计划

### Phase 1: 基础架构
1. 创建新的组件结构
2. 实现响应式布局系统
3. 建立状态管理

### Phase 2: 核心功能
1. 优化Prompt预览区域
2. 重构配置面板
3. 实现移动端优化

### Phase 3: 体验提升
1. 添加动画和微交互
2. 优化性能和可访问性
3. 完善测试和文档

## 📊 成功指标

### 1. 用户体验
- 移动端可用性评分 > 90%
- 页面加载时间 < 2秒
- 用户操作成功率 > 95%

### 2. 技术指标
- 代码覆盖率 > 80%
- 性能评分 > 90
- 可访问性评分 > 95

## 🔧 开发工具

### 1. 设计工具
- Figma: 设计稿和原型
- Storybook: 组件开发
- Chromatic: 视觉测试

### 2. 开发工具
- TypeScript: 类型安全
- Tailwind CSS: 样式系统
- Framer Motion: 动画库

### 3. 测试工具
- Jest: 单元测试
- Cypress: E2E测试
- Lighthouse: 性能测试

---

## 📝 新会话开发指南

当开始新会话时，请按照以下步骤进行：

1. **环境准备**
   - 确认当前代码状态
   - 创建新的功能分支
   - 安装必要的依赖

2. **架构设计**
   - 实现响应式布局系统
   - 创建组件架构
   - 建立状态管理

3. **核心开发**
   - 优先实现Prompt预览区域
   - 优化移动端体验
   - 添加交互和动画

4. **测试和优化**
   - 跨设备测试
   - 性能优化
   - 可访问性检查

这个重构方案将确保Prompt生成器在所有设备上都有出色的用户体验，同时保持Apple设计的高标准。
