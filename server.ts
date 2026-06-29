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
Hãy đóng vai một chuyên gia phân tích dữ liệu vận hành. Dựa vào tóm tắt số liệu sự cố dưới đây, hãy đưa ra một đánh giá CHUYÊN SÂU và NGẮN GỌN (tối đa 3 đoạn). 
Yêu cầu:
- Tuyệt đối KHÔNG liệt kê lại hay đọc lại các con số (tỉ lệ, số lượng) một cách máy móc. 
- Tập trung phân tích xu hướng: Nguyên nhân cốt lõi là gì? Điểm nóng (hotspot) nằm ở block quản lý hay phần tử nào?
- Đưa ra 1-2 hành động chiến lược thiết thực để khắc phục vấn đề.
- Hành văn súc tích, chuyên nghiệp.

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
