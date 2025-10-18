# 🔍 Auto模式和豆包模型调试指南

## 问题现象

用户报告：
1. **Auto模式**：智能模式似乎没有生效
2. **Dream模型**：豆包图片生成没有生效  
3. **深度思考**：豆包深度思考没有生效

## 🎯 问题诊断步骤

### 1. 检查环境变量配置

**必需的环境变量**:
```env
# 豆包API Key
DOUBAO_API_KEY=f9a5f018-b500-46ca-9720-fafbbbc577b2

# 豆包模型Endpoint
DOUBAO_SEED_1_6_ENDPOINT=doubao-seed-1-6-251015
DOUBAO_SEED_1_6_FLASH_ENDPOINT=doubao-seed-1-6-flash-250828
DOUBAO_DREAM_ENDPOINT=ep-20251019000834-qqc8l
```

**检查方法**:
```bash
# 在项目根目录检查 .env.local 文件
cat .env.local | grep DOUBAO
```

### 2. Auto模式工作原理

Auto模式的执行流程：

```
用户消息
   ↓
analyzeTask() - 分析任务类型
   ↓
selectBestModel() - 选择最佳模型
   ↓
handleAutoMode() - 返回选中的模型
   ↓
实际使用选中的模型进行对话
```

**关键检查点**:
1. ✅ Auto模式是否正确识别任务类型
2. ✅ 是否选择了正确的模型
3. ✅ 选中的模型是否有有效的API Key

### 3. 豆包深度思考参数

豆包1.6模型支持深度思考，需要特定参数：

```typescript
// model-handlers.ts 中的配置
if (modelId === 'doubao-1.6') {
  baseParams.additionalParams = {
    reasoning_effort: "medium", // low, medium, high
  };
}
```

**深度思考触发关键词**:
- "深入分析"
- "详细解释"
- "为什么"
- "如何实现"
- "复杂问题"
- "思考"
- "推理"

### 4. 豆包Dream图片生成

Dream模型是专门的图片生成模型，**但当前实现可能有问题**。

**触发关键词**:
- "生成图片"
- "画一张图"
- "创作图片"
- "设计图片"
- "制作图片"
- "draw"
- "generate image"

**注意**: Dream模型需要特殊的图片生成API，不是普通的对话API。

## 🐛 已发现的潜在问题

### 问题1: Dream模型使用错误的API

**现状**: Dream模型(ep-20251019000834-qqc8l)是图片生成endpoint，但当前代码将它当作对话模型处理。

**正确使用方式**:
```typescript
// 图片生成应该调用
POST https://ark.cn-beijing.volces.com/api/v3/images/generations

// 而不是
POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
```

**解决方案**: 需要为Dream模型创建专门的图片生成处理逻辑。

### 问题2: Auto模式可能选择了没有配置API Key的模型

**检查方法**:
在浏览器控制台查看日志：
```
[Auto Agent] 智能选择模型: { selectedModel: '...', taskType: '...', reasoning: '...' }
```

**常见情况**:
- Auto选择了o1模型，但OPENAI_API_KEY未配置
- Auto选择了Claude，但ANTHROPIC_API_KEY未配置
- Auto选择了Perplexity，但PERPLEXITY_API_KEY未配置

### 问题3: 深度思考参数可能未正确传递

**检查**: 在API路由中添加日志
```typescript
console.log('[API] Stream params:', streamParams);
```

应该看到：
```json
{
  "model": "...",
  "messages": [...],
  "reasoning_effort": "medium"
}
```

## 🔧 快速修复方案

### 修复1: 确保Auto模式优先选择已配置的模型

修改 `auto-agent.ts` 中的 `selectBestModel`:

```typescript
function selectBestModel(taskType: TaskType, complexity: "low" | "medium" | "high"): string {
  const modelScores: Record<string, number> = {};
  
  // 检查哪些模型的API Key可用
  const availableProviders = getAvailableProviders();

  AI_MODELS.forEach(model => {
    if (model.id === 'auto') return;
    
    // 只评分有API Key的模型
    if (!availableProviders.includes(model.provider)) {
      return;
    }
    
    let score = 0;
    // ... 评分逻辑
  });
  
  // ...
}
```

### 修复2: Dream模型暂时禁用自动选择

在 `selectBestModel` 中：

```typescript
// 暂时不自动选择Dream，因为它需要特殊的图片生成API
if (model.id === 'doubao-dream') {
  score = 0; // 禁用自动选择
}
```

### 修复3: 添加详细的调试日志

在 `route.ts` 中添加：

```typescript
console.log('[Auto Agent] 原始请求模型:', model);
console.log('[Auto Agent] 实际使用模型:', actualModel);
console.log('[Auto Agent] 模型配置:', modelConfig);
console.log('[Auto Agent] 处理后的参数:', processedRequest);
console.log('[Auto Agent] Stream参数:', streamParams);
```

## 🧪 测试用例

### 测试Auto模式 - 深度思考

**输入**:
```
为什么量子计算比经典计算更强大？请深入分析其原理。
```

**期望**:
- Auto识别为DEEP_REASONING任务
- 选择o1或doubao-1.6模型
- 提供详细的推理过程

### 测试Auto模式 - 图片生成

**输入**:
```
生成一张图片：夕阳下的海滩，有椰子树
```

**期望**:
- Auto识别为IMAGE_GENERATION任务
- 选择doubao-dream模型（如果实现了图片生成API）
- 返回图片URL

### 测试豆包深度思考

**直接选择豆包1.6模型**，输入：
```
解释相对论和量子力学的关系
```

**期望**:
- 使用reasoning_effort参数
- 提供深入的分析

## 📊 诊断清单

- [ ] 检查`.env.local`文件是否存在
- [ ] 检查所有DOUBAO环境变量是否正确配置
- [ ] 检查浏览器控制台是否有Auto Agent日志
- [ ] 检查网络请求是否成功（开发者工具 Network标签）
- [ ] 检查API响应内容
- [ ] 测试直接选择模型vs Auto模式的区别

## 💡 临时解决方案

如果Auto模式不工作，可以：
1. **直接选择具体模型**：不使用Auto，手动选择doubao-1.6
2. **测试API连通性**：先用简单的gpt-4o-mini测试
3. **查看完整日志**：打开浏览器控制台和服务器日志

## 🚀 完整的解决方案（需要实现）

### 1. 为Dream创建专门的图片生成处理

```typescript
// src/lib/ai/doubao-image.ts
export async function generateDoubaoImage(prompt: string) {
  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.DOUBAO_DREAM_ENDPOINT,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    }),
  });
  
  return response.json();
}
```

### 2. 在Auto模式中特殊处理图片生成

```typescript
if (autoAnalysis.type === TaskType.IMAGE_GENERATION) {
  // 调用专门的图片生成API
  const imageResult = await generateDoubaoImage(lastMessageContent);
  return new Response(JSON.stringify(imageResult));
}
```

### 3. 优化模型选择逻辑

确保Auto模式只选择可用的模型，并提供降级方案。

## 📝 下一步行动

1. **立即**: 添加详细日志，查看Auto模式实际选择了什么模型
2. **短期**: 修复Dream模型，使用正确的图片生成API
3. **长期**: 优化Auto模式，使其更智能地处理各种任务

---

**请先执行诊断步骤，查看浏览器控制台和服务器日志，然后告诉我具体看到了什么！** 🔍
