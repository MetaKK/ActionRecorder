# 调试面板关闭错误修复

## 🐛 问题描述

在调试面板关闭时出现 React hooks 错误：

```
Uncaught Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
```

## 🔍 问题原因

React hooks 必须在每次渲染时以相同的顺序调用。当调试面板关闭时，组件提前返回 `null`，但此时 hooks 已经被调用，导致 hooks 顺序不一致。

### 问题代码示例：

```typescript
export function DebugPanel({ ... }) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  // ... 其他 hooks

  // ❌ 问题：在 hooks 调用后提前返回
  if (!isDebugEnabled() || isClosed) {
    return null;
  }

  // 这些 hooks 在关闭时不会被调用
  const handleClose = useCallback(() => { ... }, []);
  const toggleCollapse = useCallback(() => { ... }, []);
  // ...
}
```

## ✅ 解决方案

### 方案1: 使用 useMemo 控制渲染（推荐）

```typescript
export function DebugPanel({ ... }) {
  // 所有 hooks 都在这里调用
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isClosed, setIsClosed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);

  // 所有回调函数
  const handleClose = useCallback(() => {
    setIsClosed(true);
    onClose?.();
  }, [onClose]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // ✅ 使用 useMemo 来决定是否渲染
  const shouldRender = useMemo(() => {
    return isDebugEnabled() && !isClosed;
  }, [isClosed]);

  // 在最后进行条件渲染
  if (!shouldRender) {
    return null;
  }

  return (
    // JSX 内容
  );
}
```

### 方案2: 条件渲染包装器

```typescript
// 创建一个包装器组件
function ConditionalDebugPanel({ children, ...props }) {
  if (!isDebugEnabled()) {
    return null;
  }
  
  return <DebugPanel {...props}>{children}</DebugPanel>;
}

// 使用
<ConditionalDebugPanel title="调试面板">
  <div>内容</div>
</ConditionalDebugPanel>
```

## 🛠 修复实施

### 1. 创建安全版本

创建了 `src/components/debug-panel-safe.tsx`，使用 `useMemo` 来控制渲染：

```typescript
// 使用 useMemo 来决定是否渲染，避免 hooks 顺序问题
const shouldRender = useMemo(() => {
  return isDebugEnabled() && !isClosed;
}, [isClosed]);

if (!shouldRender) {
  return null;
}
```

### 2. 更新主页面

更新 `src/app/page.tsx` 使用安全版本：

```typescript
// 调试面板 - 只在开发环境加载（使用安全版本）
const PerformanceDebugPanel = isDebugEnabled() 
  ? dynamic(
      () => import("@/components/debug-panel-safe").then(mod => ({ default: mod.PerformanceDebugPanel })),
      { ssr: false }
    )
  : () => null;
```

### 3. 修复 SSR 问题

修复了服务端渲染时 `window` 对象不可用的问题：

```typescript
// 修复前
initialPosition = { x: window.innerWidth - 320, y: 80 }

// 修复后
const defaultPosition = useMemo(() => {
  if (initialPosition) return initialPosition;
  return {
    x: typeof window !== 'undefined' ? window.innerWidth - 320 : 100,
    y: 80
  };
}, [initialPosition]);
```

## 🧪 测试验证

### 测试步骤

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **打开调试面板**：
   - 访问 `http://localhost:3000`
   - 右侧应显示调试面板

3. **测试关闭功能**：
   - 点击调试面板右上角的 ❌ 按钮
   - 面板应该关闭，不出现错误

4. **测试折叠功能**：
   - 点击最小化按钮
   - 面板应该折叠/展开

5. **测试拖动功能**：
   - 点击标题栏拖动
   - 面板应该跟随鼠标移动

### 预期结果

- ✅ 调试面板正常显示
- ✅ 关闭功能正常工作，无错误
- ✅ 折叠功能正常工作
- ✅ 拖动功能正常工作
- ✅ 生产环境不显示调试面板

## 📚 最佳实践

### 1. Hooks 规则

```typescript
// ✅ 正确：所有 hooks 在条件判断之前
function MyComponent({ shouldRender }) {
  const [state, setState] = useState(0);
  const callback = useCallback(() => {}, []);
  
  // 条件渲染在最后
  if (!shouldRender) {
    return null;
  }
  
  return <div>{state}</div>;
}

// ❌ 错误：hooks 在条件判断之后
function MyComponent({ shouldRender }) {
  if (!shouldRender) {
    return null; // 提前返回
  }
  
  const [state, setState] = useState(0); // hooks 在条件判断之后
  return <div>{state}</div>;
}
```

### 2. 条件渲染模式

```typescript
// ✅ 推荐：使用 useMemo
const shouldRender = useMemo(() => {
  return condition1 && condition2;
}, [condition1, condition2]);

if (!shouldRender) {
  return null;
}

// ✅ 推荐：使用包装器组件
function ConditionalWrapper({ children, condition }) {
  if (!condition) return null;
  return children;
}
```

### 3. 动态导入模式

```typescript
// ✅ 推荐：双重保护
const DebugComponent = isDebugEnabled()
  ? dynamic(() => import('./debug-component'), { ssr: false })
  : () => null;

// 使用时再次检查
{isDebugEnabled() && <DebugComponent />}
```

## 🔧 故障排除

### 如果仍然出现 hooks 错误

1. **检查 hooks 顺序**：
   ```typescript
   // 确保所有 hooks 在条件判断之前
   const [state1] = useState();
   const [state2] = useState();
   const callback = useCallback(() => {}, []);
   
   if (condition) return null; // 条件判断在最后
   ```

2. **使用 React DevTools**：
   - 安装 React DevTools 浏览器扩展
   - 检查组件树中的 hooks 调用

3. **检查动态导入**：
   ```typescript
   // 确保动态导入正确
   const Component = isDebugEnabled()
     ? dynamic(() => import('./component'), { ssr: false })
     : () => null;
   ```

### 常见错误模式

```typescript
// ❌ 错误：hooks 在条件判断中
function Component({ show }) {
  if (show) {
    const [state] = useState(); // 错误！
  }
  return <div />;
}

// ❌ 错误：hooks 在循环中
function Component({ items }) {
  items.forEach(item => {
    const [state] = useState(); // 错误！
  });
  return <div />;
}

// ❌ 错误：hooks 在嵌套函数中
function Component() {
  const handleClick = () => {
    const [state] = useState(); // 错误！
  };
  return <div />;
}
```

## 📝 总结

通过使用 `useMemo` 来控制条件渲染，我们解决了 React hooks 顺序问题。这种方法确保了：

1. **Hooks 顺序一致** - 所有 hooks 在每次渲染时都以相同顺序调用
2. **性能优化** - `useMemo` 避免不必要的重新计算
3. **代码清晰** - 条件渲染逻辑集中在一处
4. **类型安全** - TypeScript 类型检查通过

修复后的调试面板现在可以安全地关闭，不会出现 React hooks 错误。

---

**修复文件**：
- `src/components/debug-panel-safe.tsx` - 安全版本的调试面板
- `src/app/page.tsx` - 更新使用安全版本

**测试命令**：
```bash
npm run dev
# 访问 http://localhost:3000
# 测试调试面板的关闭功能
```
