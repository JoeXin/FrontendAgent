# Angular Dependency Injection (DI) - Angular 17+

## 基本信息
- 框架：Angular
- 主题：Dependency Injection (DI)
- 版本：17+
- 更新时间：2026-04-29

---

## 核心概念

### 核心原则
Angular 的依赖注入系统允许在运行时自动提供类实例（服务），实现松耦合、可测试和可维护的代码。

### 注入器层级
Angular 使用分层注入器（Hierarchical Injectors）：模块级、组件级、平台级，子注入器可继承或覆盖父级提供者。

### 单例作用域
使用 providedIn: 'root' 注册的服务是应用级单例。

---

## 装饰器说明

### @Injectable()
- 作用：标记一个类为可被注入的服务
- 用法：
  ```typescript
  @Injectable({ providedIn: 'root' })
  export class MyService {}
  选项：
providedIn: 指定提供范围：'root'（全局单例）、NgModule 类（模块级）、'any'（每个模块独立实例）


### @Optional()
- 作用：标记注入参数为可选，允许在没有提供者时使用默认值
- 用法：
  ```typescript
  constructor(@Optional() private myService?: MyService) {}
  ```
- 选项：
  - 无

## 提供者类型

### Class Provider
- 定义：使用类作为提供者，Angular 会实例化该类
- 用法：
  ```typescript
  providers: [{ provide: MyService, useClass: MyService }]
  ```

### Factory Provider
- 定义：使用工厂函数作为提供者，Angular 会调用该函数来实例化服务
- 用法：
  ```typescript
  providers: [{ provide: MyService, useFactory: () => new MyService() }]
  ```

### Value Provider
- 定义：使用值作为提供者，直接将该值注入到依赖项中
- 用法：
  ```typescript
  providers: [{ provide: MyService, useValue: new MyService() }]
  ```
