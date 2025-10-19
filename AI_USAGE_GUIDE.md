# AI聊天系统使用指南

## 🚀 **快速开始**

### **基本使用**

```typescript
// 发送聊天请求
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key' // 可选，用于自定义API密钥
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '你好，请介绍一下自己' }
    ],
    model: 'gpt-4o-mini', // 或 'auto' 智能选择
    temperature: 0.7,
    maxTokens: 4096
  })
});
```

### **支持的模型**

#### **OpenAI模型**
- `gpt-4o`: 最强大的GPT-4模型，支持多模态
- `gpt-4o-mini`: 快速且经济的GPT-4模型
- `gpt-4-turbo`: 高性能GPT-4模型
- `o1-preview`: 推理能力最强的模型

#### **豆包模型**
- `doubao-seed-1-6-251015`: 豆包大模型，支持多模态
- `doubao-seed-1-6-flash-250828`: 豆包快速模型

#### **Anthropic模型**
- `claude-3-5-sonnet-20241022`: Claude-3.5 Sonnet
- `claude-3-5-haiku-20241022`: Claude-3.5 Haiku

#### **Perplexity模型**
- `sonar-medium-online`: 联网搜索模型
- `sonar-small-online`: 轻量级搜索模型

#### **智能模式**
- `auto`: AI Agent自动选择最适合的模型

## 🔧 **高级功能**

### **1. 多轮对话**

```typescript
const messages = [
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
  { role: 'user', content: '请介绍一下人工智能' }
];
```

### **2. 系统提示词**

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '写一首诗' }],
    model: 'gpt-4o',
    systemPrompt: '你是一个专业的诗人，请用优美的语言创作诗歌。',
    temperature: 0.8
  })
});
```

### **3. 流式响应处理**

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '请详细介绍一下机器学习' }],
    model: 'gpt-4o-mini'
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.content) {
        console.log('收到内容:', data.content);
      }
    }
  }
}
```

### **4. 错误处理**

```typescript
try {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4o-mini'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API错误:', error.details);
    return;
  }

  // 处理响应...
} catch (error) {
  console.error('请求失败:', error);
}
```

## 🎯 **模型选择指南**

### **根据任务类型选择模型**

#### **日常对话**
- **推荐**: `gpt-4o-mini` (快速、经济)
- **备选**: `claude-3-5-haiku-20241022`

#### **复杂推理**
- **推荐**: `o1-preview` (最强推理能力)
- **备选**: `gpt-4o` (多模态支持)

#### **多模态任务**
- **推荐**: `gpt-4o` (图像+文本)
- **备选**: `doubao-seed-1-6-251015` (豆包多模态)

#### **联网搜索**
- **推荐**: `sonar-medium-online` (实时信息)
- **备选**: `auto` (智能选择)

#### **代码生成**
- **推荐**: `gpt-4o-mini` (快速、准确)
- **备选**: `claude-3-5-sonnet-20241022`

### **智能模式 (Auto)**

```typescript
// 让AI自动选择最适合的模型
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '请帮我分析这张图片' }],
    model: 'auto' // AI会自动选择支持多模态的模型
  })
});
```

## ⚙️ **配置说明**

### **环境变量配置**

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# 豆包
DOUBAO_API_KEY=your_doubao_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Perplexity
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### **自定义API密钥**

```typescript
// 在请求头中传递自定义API密钥
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-custom-api-key'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'gpt-4o-mini'
  })
});
```

## 🔍 **故障排除**

### **常见问题**

#### **1. API密钥错误**
```
错误: API key not found for provider: openai
解决: 检查环境变量 OPENAI_API_KEY 是否正确设置
```

#### **2. 模型不存在**
```
错误: Model gpt-5 not found
解决: 使用支持的模型ID，如 gpt-4o-mini
```

#### **3. 请求格式错误**
```
错误: Invalid messages format
解决: 确保messages是数组格式，每个消息包含role和content
```

#### **4. 流式响应解析错误**
```
错误: Failed to parse SSE data
解决: 检查前端是否正确解析SSE格式的响应
```

### **调试技巧**

#### **1. 启用详细日志**
```typescript
// 在浏览器控制台查看详细日志
console.log('AI请求:', {
  model: 'gpt-4o-mini',
  messages: messages,
  temperature: 0.7
});
```

#### **2. 检查网络请求**
- 打开浏览器开发者工具
- 查看Network标签页
- 检查API请求和响应

#### **3. 测试不同模型**
```typescript
// 测试不同模型是否可用
const models = ['gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'doubao-seed-1-6-251015'];

for (const model of models) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test' }],
        model: model
      })
    });
    console.log(`${model}: ${response.ok ? '可用' : '不可用'}`);
  } catch (error) {
    console.log(`${model}: 错误 - ${error.message}`);
  }
}
```

## 📚 **最佳实践**

### **1. 消息格式**
```typescript
// ✅ 正确格式
const messages = [
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
  { role: 'user', content: '请介绍一下自己' }
];

// ❌ 错误格式
const messages = [
  { content: '你好' }, // 缺少role
  { role: 'user' }, // 缺少content
];
```

### **2. 参数设置**
```typescript
// ✅ 合理的参数设置
{
  temperature: 0.7, // 0-1之间，0.7适合大多数任务
  maxTokens: 4096, // 根据模型限制设置
  model: 'gpt-4o-mini' // 选择合适的模型
}

// ❌ 不合理的参数设置
{
  temperature: 2.0, // 超出范围
  maxTokens: 100000, // 超出模型限制
  model: 'unknown-model' // 不存在的模型
}
```

### **3. 错误处理**
```typescript
// ✅ 完整的错误处理
async function sendMessage(messages, model) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || '请求失败');
    }

    return await response.text();
  } catch (error) {
    console.error('AI请求失败:', error);
    throw error;
  }
}
```

## 🎉 **总结**

这个AI聊天系统提供了：

- **统一的接口**: 所有模型使用相同的调用方式
- **智能选择**: Auto模式自动选择最适合的模型
- **流式响应**: 实时显示AI生成的内容
- **多模态支持**: 支持文本、图像等多种输入
- **错误处理**: 完善的错误处理和调试信息

**开始使用**: 只需要一个API调用，就能享受强大的AI能力！
