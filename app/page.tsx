"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [hubspotData, setHubspotData] = useState(null);
  const [xeroData, setXeroData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State untuk Chatbox
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    checkXeroStatus();
  }, []);

  const checkXeroStatus = async () => {
    try {
      const res = await fetch("/api/xero/data");
      const data = await res.json();
      if (data.connected) {
        setXeroData({ cash: data.cash, invoicesOverdue: data.invoicesOverdue });
      }
    } catch (error) {
      console.error("Gagal periksa Xero", error);
    }
  };

  const fetchHubspot = async () => {
    setLoading(true);
    const res = await fetch("/api/hubspot");
    const data = await res.json();
    setHubspotData(data.results);
    setLoading(false);
  };

  const loginXero = () => window.location.href = "/api/xero/login";

  const generateSummary = async () => {
    setLoading(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hubspotData, xeroData }),
    });
    const data = await res.json();
    setAiSummary(data);
    setLoading(false);
  };

  // Fungsi Kirim Chat ke AI
  const askAI = async (e) => {
    e.preventDefault();
    if (!chatInput) return;
    setChatLoading(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hubspotData, xeroData, question: chatInput }),
    });
    const data = await res.json();
    setChatResponse(data.answer);
    setChatLoading(false);
  };

  // Persiapan Data Chart
  const chartData = hubspotData?.map(deal => ({
    name: deal.properties.dealname,
    amount: Number(deal.properties.amount) || 0
  })) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="mb-8 flex justify-between items-center border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold">Chief of Staff Portal</h1>
          <p className="text-gray-400 mt-1">Executive Summary & Pipeline Overview</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchHubspot} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold">
            1. Tarik Data CRM
          </button>
          <button onClick={loginXero} className={`px-4 py-2 rounded-md font-semibold ${xeroData ? 'bg-green-600' : 'bg-orange-600'}`}>
            {xeroData ? "✓ Xero Terhubung" : "2. Hubungkan Xero"}
          </button>
          <button onClick={generateSummary} disabled={!hubspotData || !xeroData} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-semibold">
            3. Generate AI Insight
          </button>
        </div>
      </header>

      {loading && <p className="text-yellow-400 animate-pulse mb-6">Memproses data...</p>}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Kiri: AI Summary & Chat */}
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">✨ AI Executive Summary</h2>
            {aiSummary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 col-span-2 sm:col-span-1">
                  <p className="text-sm text-gray-400">Cash Balance (Real Xero)</p>
                  <p className="text-2xl font-bold text-green-400">{aiSummary.cashBalance}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 col-span-2 sm:col-span-1">
                  <p className="text-sm text-gray-400">Priority Alerts</p>
                  <ul className="list-disc list-inside text-red-400 text-sm mt-1">
                    {aiSummary.priorityAlerts?.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 col-span-2">
                  <p className="text-sm text-gray-400">Pipeline Insight</p>
                  <p className="text-gray-300 mt-1">{aiSummary.pipelineInsight}</p>
                </div>
              </div>
            ) : <p className="text-gray-500 italic">Klik 'Generate AI Insight'.</p>}
          </div>

          {/* CHATBOX INTERAKTIF */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-pink-400">💬 Tanya Chief of Staff (AI)</h2>
            <form onSubmit={askAI} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Coba tanya: Deal mana yang harus dikejar buat nutupin invoice telat?" 
                className="flex-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-white outline-none focus:border-pink-500"
              />
              <button type="submit" disabled={!hubspotData || !xeroData || chatLoading} className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-semibold">
                Tanya
              </button>
            </form>
            {chatLoading && <p className="text-yellow-400 animate-pulse text-sm">AI sedang berpikir...</p>}
            {chatResponse && (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="text-gray-300 whitespace-pre-wrap">{chatResponse}</p>
              </div>
            )}
          </div>
        </section>

        {/* Kanan: Raw Data & Charts */}
        <section className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-orange-400">💼 Xero Financials</h2>
            {xeroData ? (
              <div className="space-y-2">
                <p>Status: <span className="text-green-400 font-bold">Connected</span></p>
                <p>Cash Balance: <span className="text-blue-400 font-bold">{xeroData.cash}</span></p>
                <p>Overdue Invoices: <span className="text-red-400 font-bold">{xeroData.invoicesOverdue} buah</span></p>
              </div>
            ) : <p className="text-gray-500 italic">Belum terhubung.</p>}
          </div>

          {/* GRAFIK DEALS */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-80 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">📈 Deals Chart (CRM)</h2>
            {hubspotData ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: '#374151'}} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151'}} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-500 italic">Tarik data CRM dulu.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}