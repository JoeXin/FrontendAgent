import * as dotenv from 'dotenv';
import { time } from 'node:console';
dotenv.config();

export class VectorService {
  private static client: any;
  private static embedder: any;
  private static COLLECTION_NAME = "local_agent_knowledge_base";

  private static async init() {
    // 清除代理（根据实际需求保留）
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    delete process.env.all_proxy;

    if (!this.client) {
      const { ChromaClient } = require('chromadb');

      // ✅ 使用 path 参数连接 V2 API 服务端
      this.client = new ChromaClient({
        path: "http://localhost:8000"  // 👈 关键：使用 path 而不是 host/port
      });

      this.embedder = {
        name: "openai/text-embedding-3-small",
        generate: async (texts: string[]) => {
          const { OpenAI } = require('openai');
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
            timeout: 60000
          });

          try {
            const response = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: texts,
            });

            // 安全提取 embedding（兼容多种格式）
            let embeddings;
            if (Array.isArray(response.data)) {
              embeddings = response.data.map((item: any) => item.embedding);
            } else if (Array.isArray(response.embeddings)) {
              embeddings = response.embeddings;
            } else if (Array.isArray(response)) {
              embeddings = response.map((item: any) => item.embedding || item);
            } else {
              throw new Error(`未知响应结构: ${JSON.stringify(Object.keys(response)).slice(0, 100)}`);
            }

            return embeddings;
          } catch (error: any) {
            console.error("❌ Embedding 请求失败:", error.message);
            if (error.response?.data) {
              console.error("响应体:", JSON.stringify(error.response.data, null, 2));
            }
            throw error;
          }
        }
      };

      console.log("🚀 向量服务初始化完成 (V2 协议)");
    }
  }

  private static async getCollection() {
    await this.init();
    try {
      return await this.client.getOrCreateCollection({
        name: this.COLLECTION_NAME,
        embeddingFunction: this.embedder,
      });
    } catch (error) {
      console.error("获取集合失败:", error);
      throw error;
    }
  }

  static async addDocuments(documents: string[], metadatas?: any[]) {
    try {
      const collection = await this.getCollection();
      const ids = documents.map((_, i) => `doc_${Date.now()}_${i}`);

      await collection.add({
        ids,
        documents,
        metadatas: metadatas || documents.map(() => ({ source: "manual_upload" })),
      });
      console.log(`✅ 成功写入 ${documents.length} 条数据`);
    } catch (error) {
      console.error("写入失败:", error);
    }
  }

  static async query(queryText: string, limit?:number): Promise<string[]> {
    try {
      // 🔒 强制转换为数字，确保安全
      let nResults = typeof limit === 'string'
        ? parseInt(limit, 10)
        : limit || 3;

      // 🛡️ 边界校验
      if (isNaN(nResults) || nResults <= 0) {
        console.warn(`⚠️ 无效的 limit 值: ${limit}，使用默认值 3`);
        nResults = 3;
      }

      const collection = await this.getCollection();
      const enhancedQuery = `${queryText} 前端 JavaScript Vue React 解释 原理 示例`;

      const results = await collection.query({
        queryTexts: [enhancedQuery],
        nResults: nResults, // 👈 现在一定是 number
      });

      return results?.documents?.[0] || [];
    } catch (error) {
      console.error("检索失败:", error);
      return [];
    }
  }

  static async resetCollection() {
    await this.init();
    try {
      await this.client.deleteCollection({ name: this.COLLECTION_NAME });
      console.log("🧹 集合已清空");
    } catch (e:any) {
      console.warn("清空失败:", e.message.includes("not found") ? "集合不存在" : e);
    }
  }
}

export default VectorService;