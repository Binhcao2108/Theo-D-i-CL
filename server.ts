import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.post('/api/analyze', async (req, res) => {
    try {
      const { dataSummary } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured. Vui lòng cấu hình GEMINI_API_KEY trên Vercel.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Dựa vào dữ liệu thống kê lỗi sau đây, hãy viết một nhận định ngắn gọn (khoảng 3-4 đoạn, gạch đầu dòng rõ ràng) bằng tiếng Việt.
Phân tích nguyên nhân chính gây lỗi, block quản lý nào đang gặp vấn đề nhiều nhất, và đưa ra 1-2 đề xuất khắc phục khả thi.

Dữ liệu tóm tắt:
${JSON.stringify(dataSummary, null, 2)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error calling Gemini:', error);
      res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi phân tích dữ liệu.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
