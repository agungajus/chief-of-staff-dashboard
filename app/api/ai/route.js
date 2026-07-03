import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { hubspotData, xeroData, question } = await request.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // JIKA ADA PERTANYAAN DARI CHATBOX (Step 3)
    if (question) {
      const chatPrompt = `
      Lo adalah Chief of Staff perusahaan. Jawab pertanyaan berikut berdasarkan data ini:
      - Data CRM (HubSpot): ${JSON.stringify(hubspotData)}
      - Data Keuangan (Xero): ${JSON.stringify(xeroData)}
      
      Pertanyaan Bos: "${question}"
      Jawab dengan insight yang tajam, profesional, namun santai. Jangan bertele-tele.
      `;
      const result = await model.generateContent(chatPrompt);
      return NextResponse.json({ answer: result.response.text() });
    }

    // JIKA TIDAK ADA PERTANYAAN (Jalankan Executive Summary Default)
    const summaryPrompt = `
    Lo adalah seorang Chief of Staff. Ini data saat ini:
    - CRM: ${JSON.stringify(hubspotData)}
    - Keuangan: ${JSON.stringify(xeroData)}

    KEMBALIKAN HANYA DALAM FORMAT JSON SEPERTI INI (tanpa markdown/backticks):
    {
      "cashBalance": "Tulis total saldo",
      "priorityAlerts": ["Alert 1", "Alert 2"],
      "pipelineInsight": "Insight singkat"
    }
    `;
    const result = await model.generateContent(summaryPrompt);
    const aiData = JSON.parse(result.response.text());
    return NextResponse.json(aiData);
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: 'Gagal memproses AI' }, { status: 500 });
  }
}