# 英语场景练习 - 故障排查指南 🔧

## 问题: 页面一直停留在加载状态

### ✅ **已修复的问题**

1. **useEffect 依赖循环** - 修复了场景生成的触发逻辑
2. **重复调用保护** - 添加了防止重复生成的检查
3. **错误处理优化** - 增强了错误提示和调试日志
4. **API Key 检测** - 改进了 API Key 的检查逻辑

---

## 📋 排查步骤

### Step 1: 打开浏览器开发者工具

按 `F12` 或右键 → 检查，打开开发者工具，切换到 **Console** 标签。

### Step 2: 查看日志输出

页面加载时应该看到以下日志：

```
[Scene Practice] Environment: development
[Scene Practice] Has env API key: true/false
[Scene Practice] Using environment API key  (如果有环境变量)
或
[Scene Practice] Using saved API key  (如果有保存的key)
或
[Scene Practice] No API key found, showing input  (如果都没有)
```

如果看到 API key 相关日志，继续：

```
[Scene Practice] useEffect check: {hasScene: false, hasApiKey: true, showApiKeyInput: false, isGeneratingScene: false}
[Scene Practice] Starting scene generation...
```

场景生成时：

```
[Scene Practice] Raw AI response: {...}
[Scene Practice] Cleaned text: {...}
[Scene Practice] Parsed scene data: {...}
```

---

## 🔍 **常见问题和解决方案**

### 1️⃣ **没有 API Key**

**症状**：
- 页面显示 "Configure API Key" 界面
- 控制台显示: `No API key found, showing input`

**解决方案**：

**方法A - 环境变量（推荐）**:
```bash
# 在项目根目录创建 .env.local
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local

# 重启开发服务器
npm run dev
```

**方法B - 手动输入**:
1. 在配置界面输入你的 OpenAI API Key
2. 点击 "Start Practice"
3. Key 会保存到 sessionStorage

---

### 2️⃣ **API 请求失败**

**症状**：
- 页面一直显示 "Generating your scenario..."
- 控制台显示错误: `Failed to generate scene`

**可能原因**：
- ❌ API Key 无效或过期
- ❌ 网络连接问题
- ❌ API 限流（rate limit）
- ❌ 服务器错误

**解决方案**：

1. **检查 Network 标签**：
   - 查看 `/ai/api/chat` 请求
   - 检查状态码（应该是 200）
   - 查看响应内容

2. **验证 API Key**：
   ```bash
   # 在终端测试
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

3. **检查 API 额度**：
   - 访问 [OpenAI Platform](https://platform.openai.com/account/usage)
   - 确认还有可用额度

4. **清除缓存重试**：
   ```javascript
   // 在浏览器控制台执行
   sessionStorage.clear();
   location.reload();
   ```

---

### 3️⃣ **JSON 解析失败**

**症状**：
- Alert 提示: `Failed to generate scene: Unexpected token...`
- 控制台显示: `SyntaxError: Unexpected token...`

**可能原因**：
- AI 返回的不是纯 JSON
- 包含了 markdown 代码块
- 格式不正确

**解决方案**：

**已自动处理**：代码会自动：
1. 移除 markdown 代码块标记 (\`\`\`json, \`\`\`)
2. 提取 JSON 对象部分
3. 解析并验证

**手动排查**：
1. 查看控制台 `Raw AI response` 日志
2. 检查返回的内容格式
3. 如果格式有问题，可能需要调整 prompt

---

### 4️⃣ **页面卡住不响应**

**症状**：
- 页面停留在某个状态
- 没有日志输出
- 无法交互

**解决方案**：

1. **硬刷新页面**：
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **检查浏览器兼容性**：
   - 使用最新版 Chrome/Edge/Firefox
   - 确保 JavaScript 已启用

3. **清除站点数据**：
   - F12 → Application → Storage
   - Clear site data
   - 刷新页面

4. **检查开发服务器**：
   ```bash
   # 重启开发服务器
   npm run dev
   ```

---

## 🐛 **调试技巧**

### 查看完整日志

打开浏览器控制台，应该看到：

```
[Scene Practice] Environment: development
[Scene Practice] Has env API key: true
[Scene Practice] Using environment API key
[Scene Practice] useEffect check: {hasScene: false, hasApiKey: true, ...}
[Scene Practice] Starting scene generation...
[Scene Practice] Raw AI response: {"title":"..."}
[Scene Practice] Cleaned text: {"title":"..."}
[Scene Practice] Parsed scene data: {title: "...", context: "...", ...}
```

### 手动测试 API

在控制台执行：

```javascript
fetch('/ai/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-if-needed'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Generate a JSON: {"test": "hello"}' }
    ],
    model: 'gpt-4o-mini'
  })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
```

### 模拟场景数据（测试用）

在控制台临时跳过 API 调用：

```javascript
// 在控制台执行，直接设置场景（仅用于测试UI）
const testScene = {
  title: "Coffee Shop Order",
  description: "Order a coffee at Starbucks",
  context: "You are at Starbucks. The barista is ready to help.",
  goal: "Successfully order a customized coffee drink",
  difficulty: "A2"
};

// 注意：这只能测试UI，无法测试真实的AI对话
```

---

## 📝 **报告问题**

如果以上方法都无法解决，请提供以下信息：

1. **浏览器信息**：Chrome/Edge/Firefox + 版本号
2. **控制台日志**：完整的错误日志
3. **Network 请求**：API 请求的状态和响应
4. **环境信息**：
   - Node 版本: `node -v`
   - npm 版本: `npm -v`
   - 是否设置了环境变量
5. **复现步骤**：详细描述如何触发问题

---

## ✅ **验证修复**

修复后，正常流程应该是：

1. ✅ 访问 `/ai/scene-practice`
2. ✅ 如果有 API Key，自动开始生成场景
3. ✅ 3-5秒后看到场景标题和描述
4. ✅ AI 发送开场白
5. ✅ 可以开始输入回复

---

## 🚀 **性能优化建议**

1. **使用环境变量**：避免每次都输入 API Key
2. **使用 gpt-4o-mini**：速度快，成本低
3. **保持网络稳定**：确保流式响应不中断
4. **定期清理缓存**：避免旧数据影响

---

**需要更多帮助？**
- 📖 查看 [完整文档](./ENGLISH_SCENE_PRACTICE.md)
- 🚀 查看 [快速启动](./SCENE_PRACTICE_QUICKSTART.md)
- 💬 在项目 Issues 中提问

