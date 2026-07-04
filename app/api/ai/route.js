import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { hubspotData, xeroData, question } = await request.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // JIKA ADA PERTANYAAN DARI CHATBOX
    if (question) {
      const chatPrompt = `
      You are an elite AI Chief of Staff for a business owner. Answer the following question based on this live data:
      - CRM Data (HubSpot): ${JSON.stringify(hubspotData)}
      - Financial Data (Xero): ${JSON.stringify(xeroData)}
      
      Boss asks: "${question}"
      Answer with sharp, professional, yet conversational insights. Do not be overly verbose. Get straight to the point.
      `;
      const result = await model.generateContent(chatPrompt);
      return NextResponse.json({ answer: result.response.text() });
    }

    // JIKA TIDAK ADA PERTANYAAN (Executive Summary Default)
    const summaryPrompt = `
    You are an AI Chief of Staff generating a morning briefing. Analyze the following data:
    - CRM Data (HubSpot): ${JSON.stringify(hubspotData)}
    - Financial Data (Xero): ${JSON.stringify(xeroData)}

    RETURN ONLY A VALID JSON OBJECT WITH NO MARKDOWN OR BACKTICKS. The JSON must exactly match this schema:
    {
      "todaysSummary": "Write a 2-3 sentence summary covering active pipeline value, deals needing attention, and cash position.",
      "metrics": {
        "pipelineValue": "e.g., $342k",
        "pipelineOpenDeals": "e.g., 12 open deals",
        "cashBalance": "e.g., $67k",
        "cashDueToday": "e.g., $18k due today",
        "needsActionCount": "e.g., 3",
        "overdueInvValue": "e.g., $31k"
      },
      "priorityAlerts": [
        {
          "title": "Short title of the alert",
          "subtitle": "Brief context or risk",
          "status": "danger" // use "danger" for bad news, "success" for good news, "warning" for neutral
        }
      ]
    }
    Make sure to calculate realistic numbers based on the provided JSON data.
    `;
    
    const result = await model.generateContent(summaryPrompt);
    let rawText = result.response.text().trim();
    if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    const aiData = JSON.parse(rawText);
    
    return NextResponse.json(aiData);
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: 'Failed to process AI' }, { status: 500 });
  }
}