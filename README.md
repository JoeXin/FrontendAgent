# FrontendAgent

一个轻量级 AI Agent，用于回答前端框架问题（Vue 3、React、Angular）。  
基于 **RAG（检索增强生成）**，使用 **ChromaDB 作为向量数据库**，以及 **OpenAI（或兼容 LLM）进行回答生成**。  

👉 所有数据本地存储，适合私有知识库场景。

---

## ✨ 功能特性

- **基于 RAG 的问答**  
  通过你的文档进行检索，减少 AI 幻觉问题

- **多框架支持**  
  默认支持 Vue 3、React、Angular 核心知识

- **流式输出（Streaming）**  
  使用 SSE 实现类似 ChatGPT 的实时输出

- **本地向量数据库**  
  使用 ChromaDB，无需额外数据库

- **极简前端界面**  
  单个 `index.html`，无需构建工具

- **简单的数据导入**  
  一条命令即可完成文档向量化

---

## 📁 项目结构

```
AGENT/
├── chroma_data/        # ChromaDB 持久化数据（自动生成）
├── node_modules/
├── .env                # 环境变量（不提交）
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── README.md
├── index.html          # 简易聊天 UI
├── agentServer.ts      # Express 服务 + RAG 逻辑
├── ingest.ts           # 文档向量化脚本
├── VectorService.ts    # ChromaDB 封装
└── chroma.log          # 可选日志
```

---

## 🚀 快速开始

### 1️⃣ 前置条件

- Node.js v20+
- PNPM  
  ```bash
  npm install -g pnpm
  ```
- OpenAI API Key（或兼容模型，如 Ollama / Anthropic）

---

### 2️⃣ 克隆项目并安装依赖

```bash
git clone https://github.com/JoeXin/FrontendAgent.git
cd FrontendAgent
pnpm install
```

---

### 3️⃣（可选）使用国内镜像安装 ChromaDB

```bash
pip install -U chromadb -i https://pypi.tuna.tsinghua.edu.cn/simple
```

启动 Chroma 服务：

```bash
chroma run --host 0.0.0.0 --port 8000
```

---

### 4️⃣ 配置环境变量

复制 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
OPENAI_API_KEY=sk-your-api-key-here
CHROMA_PATH=./chroma_data
PORT=3000
```

---

## 📚 导入你的知识库

1. 在项目根目录创建 `docs/` 文件夹  
2. 放入你的文档，例如：

```
docs/
├── vue.md
├── react.md
├── angular.md
```

支持格式：

- `.md`
- `.txt`
- `.json`

---

### 执行导入命令

```bash
pnpm run ingest
```

该过程会：

- 读取 docs 目录所有文件
- 自动切分文本
- 使用 OpenAI `text-embedding-ada-002` 生成向量
- 存入 `chroma_data/`

---

## ▶️ 启动项目

```bash
pnpm run dev
```

启动后即可在浏览器打开聊天界面，进行问答。

---

## ✅ 总结流程（推荐理解）

1. 准备文档（docs）
2. 执行 `ingest` → 向量化
3. 启动服务 `dev`
4. 前端提问 → RAG 检索 → LLM 生成答案
