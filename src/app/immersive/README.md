# 沉浸式内容组件使用指南

## 功能特性

支持四种内容类型：
1. **图片** - 纯图片展示
2. **视频** - 纯视频播放
3. **图片+音乐** - 图片配背景音乐
4. **视频+音乐** - 视频配背景音乐

## 使用方法

### 基本URL格式
```
/immersive?type={类型}&{参数}
```

### 1. 图片展示
```
/immersive?type=image&imageUrl=https://example.com/image.jpg&title=美丽风景
```

### 2. 视频播放
```
/immersive?type=video&videoUrl=https://example.com/video.mp4&title=精彩视频&autoPlay=true
```

### 3. 图片+音乐
```
/immersive?type=image+music&imageUrl=https://example.com/image.jpg&audioUrl=https://example.com/music.mp3&title=音乐相册&autoPlay=true
```

### 4. 视频+音乐
```
/immersive?type=video+music&videoUrl=https://example.com/video.mp4&audioUrl=https://example.com/music.mp3&title=音乐视频&autoPlay=true&loop=true
```

## 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 内容类型：`image`, `video`, `image+music`, `video+music` |
| `imageUrl` | string | 条件 | 图片URL（图片类型必需） |
| `videoUrl` | string | 条件 | 视频URL（视频类型必需） |
| `audioUrl` | string | 条件 | 音频URL（音乐类型必需） |
| `title` | string | ❌ | 内容标题 |
| `description` | string | ❌ | 内容描述 |
| `autoPlay` | boolean | ❌ | 是否自动播放（默认false） |
| `loop` | boolean | ❌ | 是否循环播放（默认false） |
| `muted` | boolean | ❌ | 是否静音（默认false） |
| `volume` | number | ❌ | 音量0-1（默认0.7） |

## 控制功能

- **播放/暂停**：点击播放按钮控制音频/视频播放
- **音量控制**：点击音量按钮静音/取消静音，拖动滑块调节音量
- **全屏模式**：点击全屏按钮进入/退出全屏
- **返回按钮**：左上角返回主页面

## 示例场景

### 冥想空间
```
/immersive?type=image+music&imageUrl=https://example.com/meditation.jpg&audioUrl=https://example.com/nature-sounds.mp3&title=自然冥想&autoPlay=true&loop=true
```

### 音乐视频
```
/immersive?type=video+music&videoUrl=https://example.com/concert.mp4&audioUrl=https://example.com/concert-audio.mp3&title=音乐会&autoPlay=true
```

### 风景展示
```
/immersive?type=image&imageUrl=https://example.com/landscape.jpg&title=美丽风景&description=享受宁静的自然风光
```
