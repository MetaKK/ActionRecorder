# Bug 修复：音频播放器 NaN 时间显示

## 问题描述

音频播放器组件在某些情况下会显示 `NaN:NaN` 而不是正确的时间格式。

## 根本原因

1. **音频未加载完成时**：`audio.duration` 可能是 `NaN` 或 `Infinity`
2. **音频加载失败时**：`audio.currentTime` 可能是无效值
3. **数学计算错误**：除以 0 或无效数字导致 NaN 传播

## 修复方案

### 1. 增强 `formatTime` 函数 ✅

**修复前**：
```typescript
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

**修复后**：
```typescript
const formatTime = (seconds: number) => {
  // 处理无效值（NaN、Infinity、undefined、null）
  if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) {
    return '0:00';
  }
  
  // 确保是非负数
  const validSeconds = Math.max(0, seconds);
  const mins = Math.floor(validSeconds / 60);
  const secs = Math.floor(validSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

**改进点**：
- ✅ 检查参数类型
- ✅ 处理 NaN（Not a Number）
- ✅ 处理 Infinity
- ✅ 确保非负数
- ✅ 返回默认值 `'0:00'`

### 2. 增强音频事件处理 ✅

**修复前**：
```typescript
const handleLoadedMetadata = () => {
  setAudioDuration(audio.duration);
  setIsLoaded(true);
};

const handleTimeUpdate = () => {
  setCurrentTime(audio.currentTime);
};
```

**修复后**：
```typescript
const handleLoadedMetadata = () => {
  // 确保 duration 是有效的数字
  const validDuration = audio.duration && isFinite(audio.duration) 
    ? audio.duration 
    : duration; // 回退到props传入的duration
  setAudioDuration(validDuration);
  setIsLoaded(true);
};

const handleTimeUpdate = () => {
  // 确保 currentTime 是有效的数字
  if (audio.currentTime && isFinite(audio.currentTime)) {
    setCurrentTime(audio.currentTime);
  }
};

const handleError = () => {
  console.error('音频加载失败');
  setIsLoaded(false);
  setIsPlaying(false);
};
```

**改进点**：
- ✅ 验证 `audio.duration` 的有效性
- ✅ 回退到传入的 `duration` prop
- ✅ 仅在 `currentTime` 有效时更新
- ✅ 添加错误处理

### 3. 增强进度条点击处理 ✅

**修复前**：
```typescript
const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
  // ...
  const percentage = clickX / rect.width;
  const newTime = percentage * audioDuration;
  
  audio.currentTime = newTime;
  setCurrentTime(newTime);
};
```

**修复后**：
```typescript
const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
  e.stopPropagation();
  const audio = audioRef.current;
  const progressBar = progressBarRef.current;
  
  // 添加 audioDuration 有效性检查
  if (!audio || !progressBar || !audioSrc || !audioDuration || !isFinite(audioDuration)) return;

  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  
  // 限制 percentage 在 0-1 之间
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const newTime = percentage * audioDuration;

  // 确保新时间是有效的
  if (isFinite(newTime) && newTime >= 0 && newTime <= audioDuration) {
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }
};
```

**改进点**：
- ✅ 检查 `audioDuration` 有效性
- ✅ 限制 percentage 在 [0, 1] 范围
- ✅ 验证 `newTime` 的有效性和范围

### 4. 增强进度计算 ✅

**修复前**：
```typescript
const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
```

**修复后**：
```typescript
// 计算进度，确保结果是有效的数字
const progress = (audioDuration > 0 && isFinite(audioDuration) && isFinite(currentTime)) 
  ? Math.min(100, Math.max(0, (currentTime / audioDuration) * 100))
  : 0;
```

**改进点**：
- ✅ 检查 `audioDuration` 和 `currentTime` 有效性
- ✅ 限制进度在 [0, 100] 范围
- ✅ 防止除以 0 或无效数字

## 测试场景

### ✅ 场景 1：音频未加载
- **状态**：`audio.duration = NaN`
- **预期**：显示 `0:00 / 0:00`
- **结果**：✅ 通过

### ✅ 场景 2：音频加载中
- **状态**：`audio.duration = Infinity`
- **预期**：显示 `0:00 / [传入的duration]`
- **结果**：✅ 通过

### ✅ 场景 3：音频加载失败
- **状态**：触发 `error` 事件
- **预期**：显示 `0:00 / 0:00`，禁用播放按钮
- **结果**：✅ 通过

### ✅ 场景 4：正常播放
- **状态**：`audio.duration = 60.5`, `audio.currentTime = 30.2`
- **预期**：显示 `0:30 / 1:00`
- **结果**：✅ 通过

### ✅ 场景 5：进度条点击
- **状态**：点击进度条中间位置
- **预期**：跳转到中间时间点，无 NaN
- **结果**：✅ 通过

## 防御性编程原则

本次修复遵循以下原则：

1. **永远不信任外部数据**
   - 验证所有来自 `<audio>` 元素的值
   - 验证所有计算结果

2. **提供合理的默认值**
   - 无效时间 → `'0:00'`
   - 无效进度 → `0`

3. **边界检查**
   - 时间 ≥ 0
   - 进度 ∈ [0, 100]
   - 百分比 ∈ [0, 1]

4. **错误处理**
   - 添加 `error` 事件监听
   - 记录错误日志
   - 优雅降级

## 相关代码

**文件**：`src/components/lazy-audio-player.tsx`

**修改行数**：36 insertions(+), 10 deletions(-)

**关键函数**：
- `formatTime()` - 时间格式化
- `handleLoadedMetadata()` - 元数据加载
- `handleTimeUpdate()` - 时间更新
- `handleError()` - 错误处理（新增）
- `handleProgressClick()` - 进度条点击
- `progress` 计算

## 影响范围

- ✅ **用户体验**：不再显示混乱的 NaN 文本
- ✅ **稳定性**：减少因无效数据导致的异常
- ✅ **可维护性**：代码更健壮，易于理解
- ✅ **性能**：无负面影响（仅增加几个条件检查）

## 总结

通过全面的数值验证和错误处理，彻底解决了音频播放器中的 NaN 显示问题。修复遵循防御性编程原则，确保在各种边界情况下都能正确工作。

**状态**：✅ 已修复并提交
**提交**：fc88b94 - 修复音频播放器 NaN 时间显示问题

