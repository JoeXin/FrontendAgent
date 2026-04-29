import { VectorService } from './VectorService';
import { loadDocumentsFromFiles } from './utils/documentLoader'; // 上面的函数

async function main() {
  // 🔑 检查必要环境变量（可选但推荐）
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 错误: 未设置 OPENAI_API_KEY，请配置 .env 文件');
    process.exit(1);
  }

  // const myDocs = [
  //   "项目使用的是 Vue 3 + TSX 架构，摒弃了传统的 .vue 文件。",
  //   "项目支持 React 技术栈，采用函数式组件与 Hooks 编写方式。",
  //   "项目兼容 Angular 框架，遵循模块化和依赖注入的设计原则。"
  // ];

  const myDocs = await loadDocumentsFromFiles('./docs')
  if (myDocs.length === 0) {
    console.warn("⚠️ 未找到任何文档文件，请检查 ./docs 目录");
    return;
  }
  try {
    console.log("🧹 清空现有知识库...");
    await VectorService.resetCollection();

    const BATCH_SIZE = 20;

    for (let i = 0; i < myDocs.length; i += BATCH_SIZE) {
      const batch = myDocs.slice(i, i + BATCH_SIZE);

      console.log(`📦 batch ${i / BATCH_SIZE + 1}`);

      await VectorService.addDocuments(batch);

      console.log(`📊 进度 ${Math.min(i + BATCH_SIZE, myDocs.length)}/${myDocs.length}`);
    }


    console.log("✅ 前端框架知识库初始化完成！");
    //  console.log(`   已写入 ${myDocs.length} 条文档到集合 "${VectorService.COLLECTION_NAME}"`);
  } catch (error) {
    console.error('💥 初始化失败:', error);
    process.exit(1);
  }
}

main();