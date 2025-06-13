// 确保这部分代码存在于 server/server.js 中
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();
// 获取人设提示
const PERSONA_PROMPT = process.env.PERSONA_PROMPT;

// 创建 Express 应用
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 验证 API 密钥
if (!DEEPSEEK_API_KEY) {
  console.error('请在 .env 文件中设置 DEEPSEEK_API_KEY');
  process.exit(1);
}

// 全局缓存：会话ID -> 人设信息
const sessionCache = new Map();

// 问答端点
app.post('/api/ask', async (req, res) => {
  console.log('[API 请求] 收到问题:', req.body.question); // 添加日志
  
  try {
    const { 
      question, 
      conversationId, 
      persona, // 可能是完整人设或简短提示
      model = 'deepseek-chat', 
      temperature = 0.7, 
      max_tokens = 1000,
    } = req.body;

    if (!question) {
      return res.status(400).json({ error: '问题不能为空' });
    }

    // 检查是否有会话缓存
    let sessionPersona = null;
    if (conversationId && sessionCache.has(conversationId)) {
      sessionPersona = sessionCache.get(conversationId);
    }

    // 如果收到人设信息，更新缓存
    if (persona) {
      // 判断是完整人设还是简短提示
      const isFullPersona = persona.length > 100; // 简单判断：长度超过100认为是完整人设
      
      if (isFullPersona) {
        // 保存完整人设到缓存
        sessionCache.set(conversationId, persona);
        sessionPersona = persona;
      } else {
        // 没有缓存，使用简短提示作为人设
        sessionPersona = persona;
      }
    }
    
    // 如果没有人设，使用默认人设
    if (!sessionPersona) {
      sessionPersona = process.env.PERSONA_PROMPT || '你是一个有帮助的AI助手。';
    }
    
    // 记录 Tokens 使用量（调试用）
    console.log('[API] 人设:', persona.length > 100,sessionPersona);
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model,
        messages: [
            { 
                role: 'system', 
                content: sessionPersona
            },
            { role: 'user', content: question }
        ],
        temperature,
        max_tokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    // 打印 Tokens 使用量（调试用）
    console.log('[API] Tokens 使用量:', response.data.usage);
    console.log('[API 响应] 成功获取 DeepSeek 回复'); // 添加日志
    
    res.status(200).json({
      answer: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage
    });
    
  } catch (error) {
    console.error('DeepSeek API 请求错误:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'API 错误'
      });
    }
    
    res.status(500).json({
      error: '服务器内部错误，请稍后再试'
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 生产环境: 提供前端静态文件
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  
  app.use(express.static(distPath));
  
  // 处理所有其他路由，返回index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 开发环境: 添加根路径处理
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.send('后端服务器正在运行。请启动前端应用访问用户界面。');
  });
}

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
});
