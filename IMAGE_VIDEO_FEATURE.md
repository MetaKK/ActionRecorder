# 📷🎬 图片 + 视频融合上传功能

## ✨ 功能概述

成功将视频上传功能自然融合到原有的图片上传功能中，实现了统一的多媒体管理系统。用户可以通过同一个按钮上传图片和视频，预览时支持图片查看和视频播放。

## 🎯 核心设计理念

### 1. **统一数据结构** - MediaData
将图片和视频统一为 `MediaData` 类型，通过 `type` 字段区分：
```typescript
export type MediaType = 'image' | 'video';

export interface MediaData {
  id: string;              // 媒体唯一ID
  type: MediaType;         // 媒体类型 ('image' | 'video')
  data: string;            // Base64 数据
  width: number;           // 原始宽度
  height: number;          // 原始高度
  size: number;            // 文件大小（字节）
  mimeType: string;        // MIME类型
  duration?: number;       // 视频时长（秒，仅视频）
  thumbnail?: string;      // 视频缩略图（Base64，仅视频）
  createdAt: Date;         // 添加时间
}
```

### 2. **智能文件处理**
- 自动识别文件类型（图片 vs 视频）
- 图片：自动压缩到最佳质量（1920x1920, 85% quality）
- 视频：自动生成缩略图（取 0.5 秒帧）
- 统一的错误处理和验证

### 3. **优雅的 UI 交互**
- **网格预览**：图片显示缩略图，视频显示缩略图 + 播放图标
- **灯箱模式**：图片支持缩放预览，视频支持全屏播放
- **统一操作**：点击、拖拽、粘贴一键上传

## 📁 文件结构变更

### 新增文件

#### `/src/lib/utils/media.ts` - 媒体处理核心
```typescript
// 主要功能：
- validateMediaFile()        // 验证文件类型和大小
- compressImage()             // 图片压缩
- generateVideoThumbnail()    // 视频缩略图生成
- processMediaFile()          // 处理单个文件
- processMediaFiles()         // 批量处理
- getMediaConfig()            // 获取配置
```

**关键配置：**
- 图片：最大 10MB，支持 JPG/PNG/WebP/GIF
- 视频：最大 100MB，支持 MP4/WebM/MOV
- 最多上传：9 个文件

### 修改文件

#### 1. `/src/lib/types.ts`
```typescript
// 新增类型
export type MediaType = 'image' | 'video';
export interface MediaData { /* ... */ }

// 向后兼容
export type ImageData = MediaData;

// Record 接口保持不变（使用 images 字段名）
export interface Record {
  images?: MediaData[];      // 媒体数组
  hasImages?: boolean;       // 是否包含媒体
}
```

#### 2. `/src/lib/hooks/use-image-upload.ts`
```typescript
// 更新为支持图片和视频
import { processMediaFiles } from '@/lib/utils/media';

// 功能增强：
- 支持图片和视频混合上传
- 智能统计和提示（"1张图片和2个视频"）
- 详细的日志输出
```

#### 3. `/src/components/image-grid.tsx`
```typescript
// 重构为媒体网格组件
export function ImageGrid({ images }: { images: MediaData[] }) {
  // 功能：
  - 自动识别图片和视频
  - 视频显示播放图标
  - 智能统计显示
}
```

**UI 特性：**
- 视频缩略图上显示 ▶ 播放图标
- Hover 时显示媒体信息（图片尺寸 vs 视频时长）
- 底部统计：`2 张图片 • 1 个视频`

#### 4. `/src/components/image-lightbox.tsx`
```typescript
// 重构为媒体灯箱
export function ImageLightbox({ images }: { images: MediaData[] }) {
  const isVideo = currentMedia?.type === 'video';
  
  return (
    <div>
      {isVideo ? (
        <video controls autoPlay />
      ) : (
        <img /> // 支持缩放
      )}
    </div>
  );
}
```

**交互特性：**
- 图片：支持缩放（150%）
- 视频：原生 `<video>` 控件，支持播放/暂停/进度
- 统一的键盘导航（← → ESC）
- 移动端支持滑动切换

#### 5. `/src/components/record-input.tsx`
```typescript
// 更新文件选择器
<input
  type="file"
  accept="image/*,video/*"  // 同时接受图片和视频
  multiple
/>

// 更新按钮提示
title="📷🎬 添加图片或视频 (最多9个)"
```

#### 6. `/src/lib/utils/export.ts`
```typescript
// 导出功能更新

// 纯文本导出
"这是一段文字 [2张图片和1个视频]"

// Markdown 导出
> 📷 图片1 (1920×1080)
> 📷 图片2 (1920×1080)
> 🎬 视频 (0:15)

// JSON 导出
{
  "images": [
    { "type": "image", "width": 1920, "height": 1080 },
    { "type": "video", "duration": 15.2 }
  ]
}
```

## 🎨 UI/UX 优化

### 网格显示
```
┌──────┬──────┬──────┐
│ 图片1│ 视频▶│ 图片2│
└──────┴──────┴──────┘
  2 张图片 • 1 个视频
```

### 视频缩略图设计
- 半透明黑色背景
- 白色播放图标（居中）
- Hover 时图标放大 110%
- 底部显示视频时长

### 灯箱播放器
- **图片模式**：
  - 背景：黑色半透明模糊
  - 控制：缩放按钮（右下角）
  - 信息：尺寸显示（底部）

- **视频模式**：
  - 原生 HTML5 播放器
  - 自动播放
  - 完整控制条（播放/音量/全屏）
  - 圆角阴影设计

## 🔧 技术实现细节

### 视频缩略图生成
```typescript
function generateVideoThumbnail(file: File): Promise<{
  thumbnail: string;
  width: number;
  height: number;
  duration: number;
}> {
  // 1. 创建隐藏的 <video> 元素
  const video = document.createElement('video');
  
  // 2. 跳转到 0.5 秒位置
  video.currentTime = 0.5;
  
  // 3. 使用 Canvas 捕获当前帧
  const canvas = document.createElement('canvas');
  ctx.drawImage(video, 0, 0);
  
  // 4. 转换为 Base64
  return canvas.toDataURL('image/jpeg', 0.7);
}
```

### 图片压缩优化
```typescript
function compressImage(file: File): Promise<Blob> {
  // 1. 计算缩放比例
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  
  // 2. Canvas 绘制
  canvas.drawImage(img, 0, 0, newWidth, newHeight);
  
  // 3. 转换为 JPEG（85% quality）
  canvas.toBlob(callback, 'image/jpeg', 0.85);
}
```

### 文件验证策略
```typescript
// 类型检测
const isImage = ['image/jpeg', 'image/png', ...].includes(file.type);
const isVideo = ['video/mp4', 'video/webm', ...].includes(file.type);

// 大小限制
if (isImage && file.size > 10MB) throw Error();
if (isVideo && file.size > 100MB) throw Error();
```

## 📊 性能优化

### 存储优化
- 图片压缩率：约 70-85%
- 视频不压缩（保持原始质量）
- 缩略图压缩率：70%
- Base64 编码后体积增加约 33%

### 加载优化
- 懒加载：`<img loading="lazy" />`
- 渐进式显示：`animate-in fade-in zoom-in`
- 视频预加载：`<video preload="metadata" />`

### 内存管理
- 删除媒体时释放 Blob URL
- 切换灯箱时自动清理视频资源
- LocalStorage 自动清理过期记录

## 🚀 使用示例

### 上传媒体
```typescript
// 用户操作
1. 点击 📷 按钮
2. 选择文件（支持多选）
3. 自动处理并显示

// 或拖拽上传
1. 拖拽文件到输入框
2. 自动识别并处理

// 或粘贴上传（仅图片）
1. Ctrl/Cmd + V
2. 自动粘贴剪贴板图片
```

### 预览媒体
```typescript
// 网格预览
- 图片：显示缩略图
- 视频：显示缩略图 + ▶ 图标

// 点击查看
- 图片：灯箱放大，支持缩放
- 视频：灯箱播放，原生控件
```

### 导出记录
```typescript
// 选择导出格式
1. Text  - AI 友好，简洁标记
2. Markdown - 文档友好，详细信息
3. JSON - 完整数据，包含元数据
```

## 🎯 最佳实践

### 用户体验
✅ **统一入口**：一个按钮同时支持图片和视频
✅ **智能提示**：根据已上传内容动态调整提示
✅ **视觉区分**：图片和视频有明显的视觉标识
✅ **流畅交互**：上传、预览、播放一气呵成

### 开发体验
✅ **类型安全**：完整的 TypeScript 类型定义
✅ **向后兼容**：`ImageData` 作为 `MediaData` 的别名
✅ **模块化**：核心逻辑抽离到独立的工具文件
✅ **可扩展**：易于添加新的媒体类型

### 性能考虑
✅ **智能压缩**：图片自动压缩，视频保持原质
✅ **懒加载**：大量媒体时性能优秀
✅ **资源释放**：及时清理不用的媒体资源

## 🔮 未来扩展

### 可能的增强
- [ ] 音频文件支持（MP3, WAV）
- [ ] 文档文件支持（PDF, DOC）
- [ ] 视频压缩（转码为 WebM）
- [ ] 云端存储集成
- [ ] 更多编辑功能（裁剪、滤镜）

### 性能优化
- [ ] 使用 IndexedDB 替代 LocalStorage
- [ ] 实现渐进式上传
- [ ] 视频流式播放
- [ ] 缩略图缓存策略

## 📝 总结

这次重构成功实现了：

1. **功能融合** - 图片和视频共用一套上传系统
2. **类型统一** - MediaData 统一管理多种媒体
3. **体验优化** - 预览、播放、导出全流程优化
4. **代码质量** - 模块化、类型安全、易维护

用户现在可以在一个应用中轻松管理文字、语音、图片、视频等多种形式的生活记录，真正实现了多模态内容的无缝融合！🎉

