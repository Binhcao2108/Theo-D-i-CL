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

    res.status(200).json({ result: response.text });
  } catch (error) {
    console.error('Error calling Gemini:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi phân tích dữ liệu.' });
  }
}
