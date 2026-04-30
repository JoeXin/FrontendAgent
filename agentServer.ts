import express from 'express';
import { OpenAI } from 'openai';
import { VectorService } from './vectorService';
import * as dotenv from 'dotenv';

import { matchSkill, globalSkills, loadAllSkills } from './utils/skill';


const app = express();
app.use(express.json());

// 跨域中间件建议只在开发环境全开
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});


const sessionStore = new Map<string, { role: string; content: string }[]>();
const MAX_HISTORY = 8;

/**
 * 优化 1: 更加严谨的查询改写
 * 增加 Few-shot 提示词，确保输出简洁
 */
async function rewriteQuery(question: string) {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一个搜索优化器。请将用户的问题转化为 3 个以内的核心关键词短语，用空格分隔。不要解释，只返回关键词。`
        },
        { role: 'user', content: `问题: "${question}"` }
      ],
      temperature: 0.3, // 降低随机性
    });
    return res.choices[0].message.content?.trim() || question;
  } catch (e) {
    return question; // 降级处理：改写失败则使用原句
  }
}

/**
 * 优化 2: 鲁棒的 Rerank 解析
 * 增加对 LLM 输出格式不规范的兼容
 */
async function rerank(question: string, docs: string[]) {
  if (docs.length <= 3) return docs; // 数量太少没必要 rerank

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个文档重排序专家。请根据与问题的相关性，从以下文档中选出最相关的 5 条。
        仅返回一个纯 JSON 数组索引，如 [0, 1, 4]。不要输出任何额外文字。`
      },
      {
        role: 'user',
        content: `问题：${question}\n\n文档列表：\n${docs.map((d, i) => `[${i}] ${d.substring(0, 300)}`).join('\n')}`
      }
    ],
    response_format: { type: "json_object" } // 如果模型支持，强制 JSON
  });

  try {
    const content = res.choices[0].message.content || '[]';
    // 匹配字符串中的数组部分，防止模型吐出 ```json [0,1] ```
    const match = content.match(/\[(\d+,\s*)*\d+\]/);
    const indices: number[] = match ? JSON.parse(match[0]) : [];

    return indices
      .map(i => docs[i])
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return docs.slice(0, 5);
  }
}


async function isChatIntent(question: string): Promise<boolean> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `判断用户问题是不是普通闲聊、自我介绍、问自己信息、上下文回忆。
只返回 true 或 false。
属于：名字、自我介绍、闲聊、问刚才说过啥 → true
属于技术查询、文档知识、业务提问 → false`
      },
      { role: "user", content: question }
    ],
    temperature: 0
  });
  const ans = res.choices[0].message.content?.trim() || "false";
  return ans === "true";
}

app.post('/api/chat/stream', async (req, res) => {
  const { question, sessionId = "default" } = req.body;
  if (!question) return res.status(400).json({ error: '缺少 question 参数' });


  let history = sessionStore.get(sessionId) || [];

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendStep = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // 1. 先匹配 Skill 技能
  const hitSkill = matchSkill(question)

  const isChat = await isChatIntent(question)

  let fullAnswer = "";
  let context = "";
  try {
    if (!hitSkill && !isChat) {
      const optimizedQuery = await rewriteQuery(question);
      const rawDocs = await VectorService.query(optimizedQuery, 3);
      const validDocs = (rawDocs || []).filter(
        d => typeof d === 'string' && d.trim().length > 30
      );
      if (validDocs.length > 0) {
        const topDocs = await rerank(question, validDocs);
        context = topDocs.map((d, i) => `[文献${i + 1}]: ${d}`).join('\n\n');
      }
    }

    // 组装系统提示词 优先Skill
    let systemContent = '';
    if (hitSkill) {
      // 命中技能：用Skill规则
      systemContent = `你需要严格遵循下面的技能规则回答用户问题：\n${hitSkill.systemPrompt}`;
    } else if (context) {
      // 有知识库资料
      systemContent = `你是知识库助手，有资料就参考资料回答，禁止复制原文。资料：${context}`;
    } else {
      // 普通闲聊+记忆
      systemContent = `你是智能助手，正常闲聊对话，记住用户的个人信息、持仓、偏好等内容。`;
    }

    // 🔴 关键修复：强化提示词，禁止输出原文
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: "system",
          content:  systemContent
        },
        ...history,  // 👈 记忆在这里
        { role: "user", content: question }
      ]
    });



    for await (const chunk of stream) {
      const c = chunk.choices[0]?.delta?.content || '';
      if (c) {
        fullAnswer += c;
        sendStep({ content: c, type: "answer" });
      }
    }

    // ========== 保存记忆 ==========
    history.push({ role: "user", content: question });
    history.push({ role: "assistant", content: fullAnswer });
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);
    sessionStore.set(sessionId, history);


    sendStep({ type: 'done' });
    res.end();

  } catch (err: any) {
    console.error('错误：', err);
    sendStep({ content: '服务异常', type: 'error' });
    res.end();
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ AI Agent 服务已启动：http://localhost:${PORT}`);
  console.log(`✅ 接口地址：http://localhost:${PORT}/api/chat/stream`);
});