import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { dataSummary } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel.' });
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

    res.status(200).json({ result: response.text });
  } catch (error) {
    console.error('Error calling Gemini:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi phân tích dữ liệu.' });
  }
}
