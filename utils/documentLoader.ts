
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob'; // 可选：用于通配符匹配

/**
 * 从指定目录加载 .md, .tsx, .json 文件并提取文本内容
 * @param dirPath 文档目录路径，如 './docs'
 * @returns Promise<string[]> 扁平化的文档文本片段数组
 */
export async function loadDocumentsFromFiles(dirPath: string): Promise<string[]> {
  const docs: string[] = [];

  // 支持的扩展名
  const extensions = ['.md', '.tsx', '.json', '.txt'];

  // 获取所有匹配的文件（递归）
  const files = globSync(`${dirPath}/**/*`, { nodir: true })
    .filter(file => extensions.includes(path.extname(file).toLowerCase()));

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const content = fs.readFileSync(file, 'utf-8');

    let text: string;

    switch (ext) {
      case '.md':
        // Markdown：直接使用全文（或可后续用 markdown 解析器提取正文）
        text = content;
        break;

      case '.tsx':
        // TSX：保留代码结构（可考虑用 AST 提取注释/组件说明，但简单场景直接存全文）
        text = `// File: ${file}\n${content}`;
        break;
      case '.txt':
        // 文本文件：直接使用全文
        text = content;
        break;

      case '.json':
        try {
          // JSON：转为格式化字符串或提取关键字段
          const obj = JSON.parse(content);
          text = JSON.stringify(obj, null, 2); // 或自定义逻辑，如 obj.description
        } catch (e) {
          console.warn(`⚠️ 无效 JSON 文件: ${file}`, e);
          continue;
        }
        break;

      default:
        continue;
    }

    // 【可选】分块处理（避免单个文档过大）
    // 这里先整篇加入，你可在 VectorService 内部或此处做 chunking
    docs.push(text);
  }

  return docs;
}