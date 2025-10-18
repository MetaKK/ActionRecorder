# 调试系统使用指南

## 概述

本项目实现了环境区分和可视化调试系统，确保生产环境的性能和用户体验，同时为开发提供强大的调试工具。

## 环境区分

### 自动识别
- **开发环境**: `NODE_ENV=development` - 自动启用所有调试功能
- **生产环境**: `NODE_ENV=production` - 默认禁用所有调试功能
- **测试环境**: `NODE_ENV=test` - 用于自动化测试

### 强制启用调试（可选）
在生产环境中，可以通过环境变量强制启用调试面板：

```bash
NEXT_PUBLIC_DEBUG=true
```

⚠️ **注意**: 不建议在正式生产环境中启用调试模式，这会影响性能和用户体验。

## 调试面板功能

### 可拖动调试面板
- **拖动**: 点击面板标题栏可拖动到任意位置
- **折叠/展开**: 点击最小化按钮可以折叠面板
- **关闭**: 点击关闭按钮可以关闭面板

### 性能监控面板
显示实时性能指标：

#### 系统信息
- **环境**: 当前运行环境（development/production）
- **时间**: 当前系统时间

#### 性能指标
- **FPS**: 实时帧率（绿色≥50, 黄色≥30, 红色<30）
- **内存**: JS堆内存使用量（MB）
- **加载**: Tab切换加载时间（绿色<100ms, 黄色<300ms, 红色≥300ms）

#### Tab状态
- **当前Tab**: 显示当前激活的Tab
- **加载中**: 显示Tab是否正在加载

#### 额外信息
- **recordsCount**: 记录总数
- **transitionDirection**: 切换方向

## 在代码中使用

### 环境判断工具

```typescript
import { isDev, isProd, isDebugEnabled } from '@/lib/utils/env';

// 判断是否为开发环境
if (isDev()) {
  console.log('开发环境');
}

// 判断是否为生产环境
if (isProd()) {
  console.log('生产环境');
}

// 判断是否启用调试
if (isDebugEnabled()) {
  console.log('调试模式已启用');
}
```

### 使用调试面板组件

#### 基础用法

```typescript
import { DebugPanel } from '@/components/debug-panel';

function MyComponent() {
  return (
    <DebugPanel title="我的调试面板">
      <div>调试信息...</div>
    </DebugPanel>
  );
}
```

#### 性能监控面板

```typescript
import { PerformanceDebugPanel } from '@/components/debug-panel';

function MyPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {/* 你的页面内容 */}
      
      {/* 性能监控 */}
      <PerformanceDebugPanel
        activeTab={activeTab}
        isLoading={isLoading}
        additionalInfo={{
          customMetric: 'value'
        }}
      />
    </>
  );
}
```

#### 自定义配置

```typescript
<DebugPanel
  title="自定义面板"
  initialPosition={{ x: 100, y: 100 }}  // 初始位置
  initialCollapsed={false}               // 初始是否折叠
  canMinimize={true}                     // 是否可以最小化
  canClose={true}                        // 是否可以关闭
  onClose={() => console.log('关闭')}   // 关闭回调
>
  <div>自定义内容</div>
</DebugPanel>
```

### 条件加载调试组件

为了确保生产环境不打包调试代码，使用动态导入：

```typescript
import dynamic from 'next/dynamic';
import { isDebugEnabled } from '@/lib/utils/env';

// 只在调试模式下加载组件
const DebugComponent = isDebugEnabled()
  ? dynamic(() => import('@/components/debug-panel'), { ssr: false })
  : () => null;

function MyPage() {
  return (
    <>
      {/* 页面内容 */}
      
      {/* 调试组件 - 只在开发环境加载 */}
      {isDebugEnabled() && <DebugComponent />}
    </>
  );
}
```

## 最佳实践

### 1. 生产环境优化
- ✅ 使用动态导入加载调试组件
- ✅ 使用 `isDebugEnabled()` 判断是否显示调试内容
- ✅ 确保调试代码不影响主业务逻辑

### 2. 开发体验
- ✅ 合理放置调试面板位置，不遮挡重要内容
- ✅ 使用折叠功能节省屏幕空间
- ✅ 添加有意义的调试信息

### 3. 性能考虑
- ✅ 避免在调试代码中进行高频操作
- ✅ 使用 `useCallback` 和 `useMemo` 优化性能
- ✅ 及时清理定时器和事件监听

## 移除旧的调试组件

以下旧组件已被新的调试系统替代，可以考虑移除：

- `src/components/performance-monitor.tsx`
- `src/components/route-performance-monitor.tsx`
- `src/components/simple-performance-monitor.tsx`

## 常见问题

### Q: 为什么生产环境看不到调试面板？
A: 这是正常的。生产环境默认禁用调试功能以优化性能。如需临时启用，可设置 `NEXT_PUBLIC_DEBUG=true`。

### Q: 如何在生产环境调试问题？
A: 建议使用浏览器开发者工具或日志系统，而不是启用调试面板。

### Q: 调试面板会影响应用性能吗？
A: 在开发环境会有轻微影响，但在生产环境中完全不会加载，因此不影响性能。

### Q: 可以添加自定义调试信息吗？
A: 可以，使用 `additionalInfo` 属性传入自定义信息到 `PerformanceDebugPanel`。

## 技术实现

### 环境检测
通过 `process.env.NODE_ENV` 检测运行环境，支持：
- development: 开发环境
- production: 生产环境
- test: 测试环境

### 动态加载
使用 Next.js 的动态导入确保调试代码不会打包到生产构建中：

```typescript
const DebugPanel = isDebugEnabled()
  ? dynamic(() => import('./debug-panel'), { ssr: false })
  : () => null;
```

### 拖动实现
使用原生 DOM API 实现拖动功能，无第三方依赖，轻量高效。

## 更新日志

### v1.0.0 (2025-10-18)
- ✨ 新增环境区分工具 (`src/lib/utils/env.ts`)
- ✨ 新增可拖动调试面板组件 (`src/components/debug-panel.tsx`)
- ✨ 新增性能监控面板
- ♻️ 重构主页面使用新调试系统
- 📝 添加调试系统文档
- 🔧 更新环境变量配置示例

## 贡献

欢迎提交 Issue 和 Pull Request 来改进调试系统！

