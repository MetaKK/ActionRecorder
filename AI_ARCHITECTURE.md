# AI 架构文档

## 📋 概述

本项目采用**可扩展的多模型AI架构**，支持多个AI提供商和多种模型类型，包括标准对话、深度思考、联网搜索等功能。

## 🏗️ 架构设计

### 核心组件

```
src/lib/ai/
├── config.ts           # 统一的模型配置中心
├── providers-v2.ts     # Provider管理系统
├── model-handlers.ts   # 特殊模型处理器
├── prompts.ts         # 系统提示词
├── types.ts           # 类型定义
└── utils.ts           # 工具函数
```

### 设计原则

1. **配置驱动** - 所有模型配置集中在 `config.ts`，易于维护和扩展
2. **Provider抽象** - 统一的Provider接口，支持多个AI提供商
3. **特殊处理** - 针对不同模型的特殊需求（如o1推理模型）提供专门处理
4. **分类管理** - 按功能分类：标准对话、深度思考、联网搜索、多模态

## 🤖 支持的模型

### 标准对话模型
- **GPT-4o** - 最强大的GPT-4模型，支持多模态
- **GPT-4o Mini** ⭐ - 快速且经济（推荐）
- **GPT-4 Turbo** - GPT-4增强版
- **GPT-3.5 Turbo** - 经典对话模型
- **Claude 3.5 Sonnet** - Anthropic最强模型
- **Claude 3.5 Haiku** - 快速Claude模型

### 深度思考模型 🧠
- **o1 Preview** 🔥 - 深度推理模型，擅长复杂问题
- **o1 Mini** 🔥 - 快速推理模型

### 联网搜索模型 🌐
- **Sonar Pro** 🔥 - 联网搜索，实时信息
- **Sonar** - 快速联网搜索

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件并配置：

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Anthropic API Key (可选)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity API Key (可选)
PERPLEXITY_API_KEY=pplx-...
```

### 运行时配置

用户也可以在应用设置中直接输入API Key（仅保存在会话中）。

## 📝 使用示例

### 添加新模型

在 `src/lib/ai/config.ts` 中添加：

```typescript
{
  id: "new-model-id",
  name: "new-model-name",
  provider: ModelProvider.OPENAI,
  displayName: "New Model",
  description: "Model description",
  capabilities: [ModelCapability.CHAT, ModelCapability.CODE],
  category: "standard",
}
```

### 添加新Provider

1. 在 `src/lib/ai/providers-v2.ts` 中添加Provider创建函数
2. 在 `getLanguageModel` 中添加对应的case
3. 更新环境变量配置

### 特殊模型处理

对于需要特殊处理的模型（如o1系列），在 `src/lib/ai/model-handlers.ts` 中添加处理器：

```typescript
export function handleSpecialModel(
  messages: CoreMessage[],
  systemPrompt?: string
): ModelHandlerResult {
  // 自定义处理逻辑
  return {
    messages,
    system: systemPrompt,
    temperature: 0.7,
  };
}
```

## 🎯 模型能力

模型能力标签：

- `chat` - 对话
- `reasoning` - 深度推理
- `search` - 联网搜索
- `vision` - 视觉理解
- `code` - 代码生成
- `fast` - 快速响应
- `multimodal` - 多模态

## 🔄 模型路由

API会根据模型类型自动处理：

1. **o1系列** - 将system prompt合并到用户消息，不使用temperature
2. **Perplexity** - 添加搜索参数，返回引用
3. **Claude** - 优化temperature和top_k参数
4. **标准模型** - 使用默认配置

## 📊 成本优化

每个模型配置包含成本信息：

```typescript
costPer1kTokens: {
  input: 0.00015,  // 输入token成本
  output: 0.0006,  // 输出token成本
}
```

建议：
- 日常使用：GPT-4o Mini（性价比最高）
- 复杂问题：o1 Preview（深度思考）
- 实时信息：Sonar（联网搜索）

## 🚀 最佳实践

1. **模型选择**
   - 简单对话 → GPT-4o Mini
   - 复杂推理 → o1 Preview
   - 需要最新信息 → Sonar
   - 长文本分析 → Claude 3.5 Sonnet

2. **成本控制**
   - 优先使用Mini版本模型
   - 根据任务复杂度选择模型
   - 监控token使用量

3. **错误处理**
   - API Key验证
   - 模型可用性检查
   - 降级策略

## 🔐 安全性

- API Key仅存储在服务器环境变量或浏览器会话中
- 支持自定义API Key（会话级别）
- 不在前端暴露敏感信息

## 📈 扩展性

架构设计支持：
- ✅ 添加新的AI提供商
- ✅ 添加新的模型类型
- ✅ 自定义模型处理逻辑
- ✅ 按需扩展能力标签
- ✅ 动态模型配置

## 🐛 故障排除

### 常见问题

1. **API Key错误**
   - 检查环境变量配置
   - 验证Key有效性
   - 确认Provider权限

2. **模型不可用**
   - 检查模型ID是否正确
   - 确认Provider支持该模型
   - 查看API配额

3. **特殊模型错误**
   - o1模型不支持temperature
   - Perplexity需要专门的API Key
   - Claude有独立的参数要求

## 📚 参考资料

- [OpenAI API文档](https://platform.openai.com/docs)
- [Anthropic API文档](https://docs.anthropic.com)
- [Perplexity API文档](https://docs.perplexity.ai)
- [Vercel AI SDK](https://sdk.vercel.ai)

