export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { passage } = req.body;
    if (!passage) return res.status(400).json({ error: 'Thiếu đoạn văn bản' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Chưa cấu hình API Key' });

    try {
        const prompt = `Dựa vào bài Thánh Ca dưới đây, hãy đặt ra MỘT câu hỏi tự luận/suy ngẫm thật sâu sắc để người học áp dụng vào đời sống cá nhân. 
Yêu cầu định dạng đầu ra PHẢI LÀ MỘT OBJECT JSON HỢP LỆ.
Cấu trúc: { "question": "Câu hỏi suy ngẫm..." }

Bài Thánh Ca:
"${passage}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        return res.status(200).json({ question: result.question });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
