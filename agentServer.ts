import express from 'express';
import { OpenAI } from 'openai';
import { VectorService } from './vectorService';

const app = express();
app.use(express.json()); // 👈 关键！

// 开发阶段临时解决跨域问题（生产环境需配置具体域名）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

app.post('/api/chat/stream', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: '缺少 question 参数' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // const context = await VectorService.query("my_collection", question);
    const context = await VectorService.query(question, 3)
    const validContext = (context || []).filter(doc =>
      doc && typeof doc === 'string' && doc.trim().length > 0
    );

    if (validContext.length === 0) {
      // 💡 知识库无相关内容，直接返回提示
      const noContextMsg = "抱歉，我无法根据现有资料回答该问题。";
      res.write(`data: ${JSON.stringify({ content: noContextMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `你必须严格基于以下资料回答，如果没有答案就说不知道：\n${validContext.join('\n')}`

        },
        { role: 'user', content: question }
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
  } catch (error) {
    console.error('流式请求失败:', error);
    res.write(`data: ${JSON.stringify({ error: '生成失败' })}\n\n`);
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
});

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});