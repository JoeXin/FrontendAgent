# Vue 3 + TSX 开发指南

## 核心架构
- 项目采用 **Vue 3 Composition API + TypeScript + TSX** 技术栈。
- 完全摒弃传统 `.vue` 单文件组件（SFC），使用纯 TypeScript 函数式组件编写 UI。
- 利用 Vue 3 的 `defineComponent` 和 `h()` / JSX 语法构建组件树。

## 关键特性
- **响应式系统**：基于 Proxy 的 `ref`、`reactive`、`computed` 提供细粒度响应。
- **逻辑复用**：通过自定义 Composables（如 `useFetch`, `useForm`）封装可复用逻辑。
- **TypeScript 深度集成**：提供完整的类型推导和 IDE 支持，减少运行时错误。
- **生命周期**：使用 `onMounted`, `onUnmounted` 等 Hooks 替代 Options API。

## 组件示例
```tsx
import { defineComponent, ref, onMounted } from 'vue';

export default defineComponent(() => {
  const count = ref(0);

  const increment = () => {
    count.value++;
  };

  onMounted(() => {
    console.log('Component mounted');
  });

  return () => (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={increment}>+</button>
    </div>
  );
});