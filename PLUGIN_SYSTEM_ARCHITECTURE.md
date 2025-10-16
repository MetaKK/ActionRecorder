# 插件系统架构文档

## 📋 概述

本文档详细描述了全新的插件系统架构，该系统参考了 Notion 插件架构和业内最佳实践，具有以下特点：

- ✅ **清晰分离**：UI、逻辑、数据完全分离
- ✅ **高度可扩展**：插件注册机制，轻松添加新插件
- ✅ **类型安全**：完整的 TypeScript 类型定义
- ✅ **生命周期管理**：统一的钩子系统
- ✅ **日志追踪**：完整的日志和事件系统
- ✅ **统一接口**：标准化的插件定义和交互方式

## 🏗️ 架构设计

### 核心层次

```
┌─────────────────────────────────────────┐
│           UI Layer (React)              │
│  ┌─────────────────────────────────┐   │
│  │   AIChatButton (UI Component)   │   │
│  │   - 使用 usePlugins Hook        │   │
│  │   - 使用 usePluginNavigation    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        Business Logic Layer             │
│  ┌─────────────────────────────────┐   │
│  │      Plugin Manager              │   │
│  │  - activate()                    │   │
│  │  - navigate()                    │   │
│  │  - complete()                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│           Data Layer                    │
│  ┌─────────────────────────────────┐   │
│  │     Plugin Registry              │   │
│  │  - register()                    │   │
│  │  - get(), getAll()               │   │
│  │  - enable(), disable()           │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     Plugin Logger                │   │
│  │  - log(), trackEvent()           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 📦 核心模块

### 1. 类型定义 (`types.ts`)

定义了插件系统的所有核心类型：

```typescript
// 插件类型
enum PluginType {
  ROUTE,      // 普通路由
  IMMERSIVE,  // 沉浸式
  EXTERNAL,   // 外部链接
}

// 插件类别
enum PluginCategory {
  PRODUCTIVITY,  // 效率工具
  AI,            // AI 功能
  ENTERTAINMENT, // 娱乐休闲
  LEARNING,      // 学习知识
  CUSTOM,        // 自定义
}

// 插件定义
interface Plugin {
  metadata: PluginMetadata;  // 元数据
  config: PluginConfig;      // 配置
  hooks?: PluginHooks;       // 生命周期钩子
}
```

### 2. 插件注册表 (`registry.ts`)

单例模式，全局唯一的插件注册中心：

```typescript
const registry = pluginRegistry.getInstance();

// 注册插件
registry.register(plugin);

// 获取插件
const plugin = registry.get('focus');

// 获取所有启用的插件
const enabled = registry.getEnabled();

// 按类别获取
const productivity = registry.getByCategory(PluginCategory.PRODUCTIVITY);
```

### 3. 插件管理器 (`manager.ts`)

负责插件的生命周期管理：

```typescript
// 激活插件
await pluginManager.activate('focus');

// 导航到插件
const result = await pluginManager.navigate('focus');

// 标记插件完成
await pluginManager.complete('focus', {
  data: { duration: 1500 }
});
```

### 4. 日志系统 (`logger.ts`)

统一的日志记录和事件追踪：

```typescript
// 记录日志
pluginLogger.info('Plugin activated', 'focus');

// 追踪事件
pluginLogger.trackEvent({
  type: PluginEventType.COMPLETED,
  pluginId: 'focus',
  timestamp: Date.now(),
});

// 创建时间线记录
const record = createTimelineRecord({
  pluginId: 'focus',
  pluginName: '专注时钟',
  icon: '🍅',
  content: '完成第 1 个番茄钟',
  duration: '25 分钟',
});
```

### 5. React Hooks (`hooks.ts`)

在 React 组件中使用插件系统：

```typescript
// 获取所有插件
const plugins = usePlugins();

// 获取特定类别的插件
const productivity = usePlugins(PluginCategory.PRODUCTIVITY);

// 获取单个插件
const plugin = usePlugin('focus');

// 使用导航
const { navigateToPlugin, completePlugin } = usePluginNavigation();
await navigateToPlugin('focus');
```

## 🔌 插件生命周期

### 生命周期钩子

每个插件可以定义以下钩子函数：

```typescript
interface PluginHooks {
  // 激活前
  onBeforeActivate?: (context) => Promise<boolean | void>;
  
  // 激活后
  onAfterActivate?: (context) => Promise<void>;
  
  // 导航前
  onBeforeNavigate?: (context) => Promise<boolean | void>;
  
  // 导航后
  onAfterNavigate?: (context) => Promise<void>;
  
  // 完成时
  onComplete?: (context) => Promise<void>;
  
  // 错误处理
  onError?: (error, context) => Promise<void>;
}
```

### 生命周期流程

```
用户点击插件
    ↓
onBeforeActivate (可取消)
    ↓
激活插件
    ↓
onAfterActivate
    ↓
onBeforeNavigate (可取消)
    ↓
导航到插件页面
    ↓
onAfterNavigate
    ↓
用户使用插件
    ↓
onComplete (完成时)
```

## 📝 插件定义示例

### 完整的插件定义

```typescript
const focusPlugin: Plugin = {
  metadata: {
    id: "focus",
    name: "专注时钟",
    description: "使用番茄工作法提升专注力",
    version: "1.0.0",
    category: PluginCategory.PRODUCTIVITY,
    icon: "🍅",
    color: "from-red-500 to-orange-600",
    enabled: true,
    weight: 100,
  },
  config: {
    type: PluginType.IMMERSIVE,
    route: "/focus",
  },
  hooks: {
    onBeforeActivate: async (context) => {
      console.log("准备启动番茄钟");
      return true; // 返回 false 可取消激活
    },
    onComplete: async (context) => {
      // 完成后的处理逻辑
      console.log("番茄钟完成", context.data);
    },
  },
};
```

## 🚀 使用指南

### 1. 在组件中使用插件

```typescript
import { usePlugins, usePluginNavigation } from "@/lib/plugins";

function MyComponent() {
  const plugins = usePlugins();
  const { navigateToPlugin } = usePluginNavigation();

  return (
    <div>
      {plugins.map((plugin) => (
        <button
          key={plugin.metadata.id}
          onClick={() => navigateToPlugin(plugin.metadata.id)}
        >
          {plugin.metadata.icon} {plugin.metadata.name}
        </button>
      ))}
    </div>
  );
}
```

### 2. 在插件页面中记录完成

```typescript
import { completePluginWithRecord } from "@/lib/plugins";
import { useRecords } from "@/lib/hooks/use-records";

function FocusPage() {
  const { addRecord } = useRecords();

  const handleComplete = async () => {
    await completePluginWithRecord(
      {
        pluginId: "focus",
        duration: 1500, // 25 分钟
        content: "完成第 1 个番茄钟：学习 React",
      },
      addRecord
    );
  };

  // ... 组件逻辑
}
```

### 3. 添加新插件

#### 步骤 1：创建插件定义

在 `src/lib/plugins/presets.ts` 中添加：

```typescript
export const myPlugin: Plugin = {
  metadata: {
    id: "my-plugin",
    name: "我的插件",
    description: "这是一个新插件",
    version: "1.0.0",
    category: PluginCategory.CUSTOM,
    icon: "✨",
    color: "from-purple-500 to-pink-600",
    enabled: true,
    weight: 50,
  },
  config: {
    type: PluginType.ROUTE,
    route: "/my-plugin",
  },
};
```

#### 步骤 2：添加到预设列表

```typescript
export const presetPlugins: Plugin[] = [
  // ... 其他插件
  myPlugin,
];
```

#### 步骤 3：创建插件页面

在 `src/app/my-plugin/page.tsx` 创建页面。

完成！插件会自动出现在思维卡片中。

## 📊 数据流

### 插件激活流程

```
用户交互
    ↓
UI Component (AIChatButton)
    ↓
usePluginNavigation().navigateToPlugin()
    ↓
PluginManager.activate()
    ↓
执行钩子：onBeforeActivate
    ↓
PluginLogger.trackEvent(ACTIVATED)
    ↓
PluginManager.navigate()
    ↓
执行钩子：onBeforeNavigate
    ↓
Router.push(url)
    ↓
执行钩子：onAfterNavigate
```

### 插件完成流程

```
插件页面内部逻辑
    ↓
completePluginWithRecord()
    ↓
createTimelineRecord() (格式化记录)
    ↓
addRecord() (记录到时间线)
    ↓
PluginManager.complete()
    ↓
执行钩子：onComplete
    ↓
PluginLogger.trackEvent(COMPLETED)
```

## 🔧 配置和自定义

### 插件元数据字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 插件唯一标识 |
| `name` | string | ✅ | 插件名称 |
| `description` | string | ❌ | 插件描述 |
| `version` | string | ✅ | 插件版本 |
| `category` | PluginCategory | ✅ | 插件类别 |
| `icon` | string | ✅ | 图标（emoji） |
| `color` | string | ✅ | Tailwind 渐变类 |
| `enabled` | boolean | ✅ | 是否启用 |
| `weight` | number | ❌ | 排序权重 |

### 插件配置字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | PluginType | ✅ | 插件类型 |
| `route` | string | ⚠️ | 路由地址 |
| `externalUrl` | string | ⚠️ | 外部链接 |
| `requiresAuth` | boolean | ❌ | 是否需要认证 |
| `customData` | object | ❌ | 自定义数据 |

⚠️ `route` 用于 ROUTE 和 IMMERSIVE 类型，`externalUrl` 用于 EXTERNAL 类型

## 🎯 最佳实践

### 1. 插件命名规范

- ID 使用小写字母和连字符：`my-plugin`
- 名称简洁明了：`专注时钟`
- 描述详细但不冗长

### 2. 权重分配

- 高频使用的插件：90-100
- 常用功能：70-89
- 辅助功能：50-69
- 娱乐功能：30-49

### 3. 日志记录

- 关键操作记录 INFO 级别
- 异常情况记录 WARN 级别
- 错误记录 ERROR 级别
- 调试信息记录 DEBUG 级别

### 4. 钩子使用

- 需要验证时使用 `onBeforeActivate`
- 需要清理资源时使用 `onAfterNavigate`
- 需要持久化数据时使用 `onComplete`
- 统一错误处理使用 `onError`

## 📈 扩展性

### 添加新的插件类型

在 `types.ts` 中扩展 `PluginType` 枚举：

```typescript
export enum PluginType {
  ROUTE = "route",
  IMMERSIVE = "immersive",
  EXTERNAL = "external",
  MODAL = "modal",  // 新增模态框类型
}
```

在 `manager.ts` 中添加对应的处理逻辑。

### 添加新的钩子

在 `types.ts` 的 `PluginHooks` 接口中添加：

```typescript
export interface PluginHooks {
  // ... 现有钩子
  onPause?: (context: PluginHookContext) => Promise<void>;
  onResume?: (context: PluginHookContext) => Promise<void>;
}
```

在 `manager.ts` 中实现调用逻辑。

## 🔍 调试和监控

### 查看日志

```typescript
import { pluginLogger } from "@/lib/plugins";

// 获取所有日志
const logs = pluginLogger.getLogs();

// 获取特定插件的日志
const focusLogs = pluginLogger.getLogs('focus');

// 导出日志
const json = pluginLogger.exportLogs();
```

### 查看事件

```typescript
// 获取所有事件
const events = pluginLogger.getEvents();

// 获取特定类型的事件
const completions = pluginLogger.getEvents(undefined, PluginEventType.COMPLETED);
```

## 📚 文件结构

```
src/lib/plugins/
├── index.ts          # 主入口，导出所有公共 API
├── types.ts          # 类型定义
├── registry.ts       # 插件注册表
├── manager.ts        # 插件管理器
├── logger.ts         # 日志系统
├── hooks.ts          # React Hooks
├── utils.ts          # 工具函数
└── presets.ts        # 预设插件配置
```

## 🎉 总结

新的插件系统提供了：

1. **清晰的架构**：分层设计，职责明确
2. **强大的扩展性**：轻松添加新插件和功能
3. **完善的类型系统**：TypeScript 全面支持
4. **统一的接口**：标准化的插件定义
5. **完整的生命周期**：钩子函数覆盖所有场景
6. **日志和监控**：完整的追踪系统
7. **最佳实践**：参考 Notion 等优秀产品

这是一个面向未来、可持续发展的插件架构！

