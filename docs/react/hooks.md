
---

### ✅ `docs/react-hooks.md`

```markdown
# React 函数式组件与 Hooks 开发规范

## 核心范式
- 项目全面采用 **函数式组件（Functional Components） + React Hooks**。
- 禁用 Class Components，所有状态和副作用均通过 Hooks 管理。
- 基于 React 18+ 并发特性（Concurrent Features）构建高性能应用。

## 核心 Hooks
- `useState`: 管理局部状态。
- `useEffect`: 处理副作用（数据获取、订阅、DOM 操作）。
- `useContext`: 访问上下文数据，避免 prop drilling。
- `useReducer`: 管理复杂状态逻辑。
- `useCallback` / `useMemo`: 优化子组件重渲染和计算缓存。
- 自定义 Hooks: 封装可复用逻辑（如 `useLocalStorage`, `useDebounce`）。

## 组件示例
```jsx
import { useState, useEffect, useCallback } from 'react';

function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}