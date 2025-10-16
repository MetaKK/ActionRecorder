# 插件系统迁移指南

## 📋 概述

本文档详细说明如何从旧的插件系统迁移到新的插件架构。

## 🔄 核心变化对比

### 旧系统 vs 新系统

| 方面 | 旧系统 | 新系统 |
|------|--------|--------|
| **插件定义** | 硬编码在组件中 | 独立的配置文件 |
| **类型系统** | 简单的 interface | 完整的类型定义和枚举 |
| **生命周期** | 无 | 完整的钩子系统 |
| **日志记录** | 分散在各处 | 统一的日志系统 |
| **扩展性** | 修改组件代码 | 注册机制 |
| **导航管理** | 手动 router.push | 统一的管理器 |

## 📦 文件更新清单

### 1. 组件更新

#### 旧文件：`src/components/ai/ai-chat-button.tsx`
#### 新文件：`src/components/ai/ai-chat-button-v2.tsx`

**主要变化**：
- ✅ 移除硬编码的 `AI_PLUGINS` 数组
- ✅ 使用 `usePlugins()` Hook
- ✅ 使用 `usePluginNavigation()` Hook
- ✅ 简化组件逻辑

### 2. 插件配置更新

#### 旧方式：
```typescript
// 在组件文件中
const AI_PLUGINS: AIPlugin[] = [
  {
    id: "focus",
    emoji: "🍅",
    label: "专注时钟",
    route: "/focus",
    color: "from-red-500 to-orange-600",
    type: "immersive",
  },
  // ...
];
```

#### 新方式：
```typescript
// 在 src/lib/plugins/presets.ts 中
export const focusPlugin: Plugin = {
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
    // 可选的生命周期钩子
    onBeforeActivate: async (context) => {
      // 激活前的逻辑
      return true;
    },
  },
};
```

### 3. 日志记录更新

#### 旧方式：
```typescript
// 在番茄钟组件中直接调用
addRecord({
  content: recordContent,
  timestamp: new Date(),
});
```

#### 新方式：
```typescript
import { completePluginWithRecord } from "@/lib/plugins";

await completePluginWithRecord(
  {
    pluginId: "focus",
    duration: 1500,
    content: "完成第 1 个番茄钟：学习 React",
  },
  addRecord
);
```

## 🚀 迁移步骤

### 步骤 1：安装新的插件系统

新系统已经创建在 `src/lib/plugins/` 目录下，无需安装。

### 步骤 2：更新主布局

在 `src/app/layout.tsx` 中初始化插件系统：

```typescript
import { registerPresetPlugins } from "@/lib/plugins";

// 在客户端初始化
if (typeof window !== "undefined") {
  registerPresetPlugins();
}
```

**或者**在 `src/components/ai/ai-chat-button-v2.tsx` 中初始化（已完成）。

### 步骤 3：替换 AIChatButton 组件

#### 方式 A：直接替换（推荐）

1. 备份旧组件：
```bash
mv src/components/ai/ai-chat-button.tsx src/components/ai/ai-chat-button.old.tsx
```

2. 重命名新组件：
```bash
mv src/components/ai/ai-chat-button-v2.tsx src/components/ai/ai-chat-button.tsx
```

#### 方式 B：渐进式迁移

在布局文件中同时使用两个组件，逐步切换：

```typescript
import { AIChatButton } from "@/components/ai/ai-chat-button"; // 旧
import { AIChatButton as AIChatButtonV2 } from "@/components/ai/ai-chat-button-v2"; // 新

// 使用环境变量或 Feature Flag 控制
const USE_NEW_PLUGIN_SYSTEM = true;

return (
  <>
    {USE_NEW_PLUGIN_SYSTEM ? <AIChatButtonV2 /> : <AIChatButton />}
  </>
);
```

### 步骤 4：更新插件页面

#### 番茄钟示例

在 `src/components/pomodoro-timer-optimized.tsx` 中：

```typescript
import { completePluginWithRecord } from "@/lib/plugins";
import { useRecords } from "@/lib/hooks/use-records";

export function PomodoroTimerOptimized() {
  const { addRecord } = useRecords();

  const handleTimerComplete = async () => {
    // ... 其他逻辑

    // 使用新的插件完成方法
    await completePluginWithRecord(
      {
        pluginId: "focus",
        duration: POMODORO_CONFIG.work,
        content: `完成第 ${newPomodoros} 个番茄钟${currentTask ? `：${taskText}` : ''}`,
        customData: {
          task: currentTask,
          pomodoros: newPomodoros,
        },
      },
      addRecord
    );

    // ... 其他逻辑
  };

  // ... 组件其余部分
}
```

### 步骤 5：验证迁移

1. **检查插件列表**：
```typescript
import { pluginRegistry } from "@/lib/plugins";

console.log("已注册的插件：", pluginRegistry.getAll());
```

2. **检查日志**：
```typescript
import { pluginLogger } from "@/lib/plugins";

console.log("插件日志：", pluginLogger.getLogs());
```

3. **测试功能**：
   - ✅ 思维卡片正常显示
   - ✅ 点击卡片能正确跳转
   - ✅ 插件完成能正确记录
   - ✅ 日志系统正常工作

### 步骤 6：清理旧代码（可选）

确认新系统完全正常后，删除旧文件：

```bash
# 备份
git commit -am "Backup before cleanup"

# 删除旧文件
rm src/components/ai/ai-chat-button.old.tsx
```

## 📝 代码更新示例

### 更新 1：组件中使用插件

#### 旧代码：
```typescript
const AI_PLUGINS: AIPlugin[] = [
  // 硬编码的插件列表
];

const plugin = AI_PLUGINS[currentPluginIndex];

const handleClick = () => {
  router.push(plugin.route);
};
```

#### 新代码：
```typescript
const plugins = usePlugins();
const { navigateToPlugin } = usePluginNavigation();

const plugin = plugins[currentPluginIndex];

const handleClick = async () => {
  await navigateToPlugin(plugin.metadata.id);
};
```

### 更新 2：添加新插件

#### 旧方式：
修改 `ai-chat-button.tsx`，在 `AI_PLUGINS` 数组中添加。

#### 新方式：
在 `src/lib/plugins/presets.ts` 中：

```typescript
// 1. 定义插件
export const myPlugin: Plugin = {
  metadata: {
    id: "my-plugin",
    name: "我的插件",
    // ...
  },
  config: {
    type: PluginType.ROUTE,
    route: "/my-plugin",
  },
};

// 2. 添加到列表
export const presetPlugins: Plugin[] = [
  // ... 现有插件
  myPlugin,
];
```

### 更新 3：插件完成记录

#### 旧代码：
```typescript
const recordContent = `🍅 完成第 ${newPomodoros} 个番茄钟`;
addRecord(recordContent);
```

#### 新代码：
```typescript
await completePluginWithRecord(
  {
    pluginId: "focus",
    duration: 1500,
    content: `完成第 ${newPomodoros} 个番茄钟`,
  },
  addRecord
);
```

## ⚠️ 注意事项

### 1. 插件 ID 一致性

确保新系统中的插件 ID 与旧系统中的路由保持一致：

| 旧 ID | 新 ID | 备注 |
|-------|-------|------|
| `focus` | `focus` | ✅ 保持一致 |
| `chat` | `chat` | ✅ 保持一致 |
| `wikipedia` | `wikipedia` | ✅ 保持一致 |

### 2. 外部链接插件

旧系统中通过拼接 URL 参数的方式：

```typescript
route: "/iframe?url=" + encodeURIComponent("https://example.com")
```

新系统中使用 `externalUrl` 配置：

```typescript
config: {
  type: PluginType.EXTERNAL,
  externalUrl: "https://example.com",
}
```

### 3. 生命周期钩子

新系统中的钩子是**可选**的，只在需要时添加：

```typescript
hooks: {
  // 只添加需要的钩子
  onBeforeActivate: async (context) => {
    // 验证逻辑
    return true;
  },
}
```

### 4. 类型导入

确保从正确的位置导入类型：

```typescript
// ✅ 正确
import { Plugin, PluginType, PluginCategory } from "@/lib/plugins";

// ❌ 错误
import { AIPlugin } from "@/components/ai/ai-chat-button";
```

## 🔍 常见问题

### Q1：新系统性能如何？

A：新系统采用单例模式和优化的数据结构，性能优于旧系统。

### Q2：可以逐步迁移吗？

A：可以。新旧系统可以共存，通过环境变量或 Feature Flag 控制切换。

### Q3：如何回滚？

A：保留旧文件备份，需要时恢复即可：

```bash
git checkout -- src/components/ai/ai-chat-button.tsx
```

### Q4：插件数据会丢失吗？

A：不会。新系统使用相同的记录存储机制，数据完全兼容。

### Q5：如何调试新系统？

A：使用内置的日志系统：

```typescript
import { pluginLogger } from "@/lib/plugins";

// 查看所有日志
console.log(pluginLogger.getLogs());

// 导出日志用于分析
console.log(pluginLogger.exportLogs());
```

## 📊 迁移检查清单

迁移完成后，检查以下项目：

- [ ] 新的插件系统文件已创建
- [ ] AIChatButton 组件已更新
- [ ] 所有插件在注册表中
- [ ] 思维卡片显示正常
- [ ] 插件导航功能正常
- [ ] 插件完成记录正常
- [ ] 日志系统工作正常
- [ ] 所有现有功能正常
- [ ] 旧代码已备份
- [ ] 文档已更新

## 🎉 迁移完成

恭喜！你已经成功迁移到新的插件系统。新系统提供了：

- ✅ 更清晰的架构
- ✅ 更强的扩展性
- ✅ 更好的类型安全
- ✅ 完整的生命周期管理
- ✅ 统一的日志系统

享受新系统带来的便利吧！🚀

