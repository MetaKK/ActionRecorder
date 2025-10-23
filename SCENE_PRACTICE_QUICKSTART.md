# 英语场景练习 - 快速启动指南 🚀

## 立即开始

### 方法1: 通过 AI 按钮进入
1. 打开应用主页
2. 点击右下角的 **AI 浮动按钮**
3. 选择 **"🎯 英语场景"** 卡片
4. 开始练习！

### 方法2: 直接访问
浏览器打开: `http://localhost:3000/ai/scene-practice`

---

## 首次使用配置

### 开发环境（推荐）
在项目根目录创建 `.env.local` 文件：

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

重启开发服务器后无需手动配置。

### 生产环境
首次访问时会提示输入 OpenAI API Key，输入后自动保存到会话中。

---

## 使用流程

### Step 1: 场景生成
系统自动基于你当天的行为记录生成一个英语场景：
- 📍 场景标题
- 📝 场景描述
- 🎯 学习目标

### Step 2: 开始对话
- AI 首先发起对话
- 你用**纯英语**回复（支持语音或文本）
- AI 给出反馈和继续对话

### Step 3: 查看评分
每轮对话后立即看到：
- 💯 **总分进度** (目标: 80分)
- 📊 **4个维度分数**:
  - Grammar (语法)
  - Vocabulary (词汇)
  - Relevance (相关性)
  - Fluency (流畅度)
- 💬 **简短反馈**

### Step 4: 完成练习
- 10轮对话后自动结束
- 或达到80分后可选择结束
- 查看总结和评分
- 点击"Try New Scenario"开始新场景

---

## 注意事项 ⚠️

### ❌ 避免这些行为
- 用中文回复 → **扣10分**
- 回复过短（少于5个词）→ 流畅度扣分
- 离题或无意义回复 → 相关性低分

### ✅ 最佳实践
- 全程使用英语
- 回答充分完整
- 紧扣场景目标
- 注意语法正确性
- 尝试丰富的词汇

---

## 示例对话

### 场景: Ordering Coffee ☕

**AI**: Welcome! What can I get for you today?

**You**: Hi! I'd like a large cappuccino with oat milk, please.

**AI**: Great choice! Would you like it hot or iced?

**You**: Hot, please. And could you add a little bit of vanilla syrup?

**评分**:
- Grammar: 95 ✅
- Vocabulary: 88 ✅
- Relevance: 92 ✅
- Fluency: 90 ✅
- **总分**: 91/100 🎉

---

## 常见问题 FAQ

### Q: 我没有今天的记录怎么办？
**A**: AI 会生成一个通用的有趣场景。

### Q: 可以重新开始同一个场景吗？
**A**: 目前每次重启都会生成新场景，保持练习新鲜感。

### Q: 语音输入识别不准确？
**A**: 确保允许浏览器麦克风权限，并在安静环境中使用。

### Q: API Key 安全吗？
**A**: 开发环境使用环境变量；生产环境保存在 sessionStorage，关闭浏览器后清除。

### Q: 为什么我的分数很低？
**A**: 
- 检查是否用了中文（-10分）
- 回答是否过短
- 语法是否正确
- 是否切题

---

## 技术支持

遇到问题？查看详细文档:
- 📖 [完整功能文档](./ENGLISH_SCENE_PRACTICE.md)
- 🐛 [提交 Issue](https://github.com/your-repo/issues)

---

**祝你学习愉快！Good luck! 🎯**

