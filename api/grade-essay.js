export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { passage, question, answer } = req.body;
    if (!passage || !question || !answer) return res.status(400).json({ error: 'Thiếu thông tin để chấm điểm' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Chưa cấu hình API Key' });

    try {
        const prompt = `Bạn là một giáo viên dạy Kinh Thánh và Thánh Ca tận tâm. Học sinh đã làm một bài tự luận/suy ngẫm.
Hãy đọc bài làm, chấm điểm (thang điểm 10) và đưa ra lời nhận xét khích lệ, phân tích chi tiết.

Bài Thánh Ca: "${passage}"
Câu hỏi: "${question}"
Bài làm của học sinh: "${answer}"

Yêu cầu định dạng đầu ra PHẢI LÀ MỘT OBJECT JSON HỢP LỆ.
Cấu trúc: { "score": 8.5, "feedback": "Nhận xét chi tiết của bạn ở định dạng markdown..." }`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        return res.status(200).json({ score: result.score, feedback: result.feedback });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
