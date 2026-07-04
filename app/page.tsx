"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [hubspotData, setHubspotData] = useState<any>(null);
  const [xeroData, setXeroData] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
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
      console.error("Failed to check Xero", error);
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

  const askAI = async (e: any) => {
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

  const chartData = hubspotData?.map((deal: any) => ({
    name: deal.properties.dealname,
    amount: Number(deal.properties.amount) || 0
  })) || [];

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col items-center py-0 md:py-10">
      
      {/* --- HEADER & CONTROLS (RESPONSIVE) --- */}
      <div className="w-full max-w-6xl px-4 md:px-8 pt-6 md:pt-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-white tracking-tight">Chief of Staff Portal</h1>
          <p className="text-neutral-400 mt-1">Live Integration Sandbox</p>
        </div>
        
        {/* Tombol Kontrol - Di HP jadi deretan horizontal yang bisa di-scroll, di Desktop sejajar */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button onClick={fetchHubspot} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            1. Sync HubSpot
          </button>
          <button onClick={loginXero} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${xeroData ? 'bg-green-600' : 'bg-orange-600'}`}>
            {xeroData ? "✓ Xero Connected" : "2. Connect Xero"}
          </button>
          <button onClick={generateSummary} disabled={!hubspotData || !xeroData} className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            3. Generate Briefing
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT (RESPONSIVE GRID) --- */}
      {/* Di HP: 1 Kolom memanjang ke bawah. Di Desktop: Grid 3 kolom (Kiri 2/3 untuk Briefing, Kanan 1/3 untuk Data Raw) */}
      <main className="w-full max-w-6xl px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 md:pb-8">
        
        {/* KOLOM KIRI (Briefing & Chat) - Meniru Desain Thomas */}
        <section className="col-span-1 lg:col-span-2 flex justify-center lg:justify-start">
          
          {/* Container Aplikasi - Di HP penuhi layar, di Desktop bentuknya kotak dengan border */}
          <div className="w-full md:max-w-[420px] bg-[#1C1C1E] md:rounded-[40px] md:shadow-2xl md:border-[6px] md:border-black flex flex-col relative overflow-hidden min-h-[800px] md:h-[850px]">
            
            {/* App Header */}
            <div className="px-6 pt-8 md:pt-12 pb-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Good morning, Mark</h1>
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-sm">MR</div>
              </div>
              <p className="text-neutral-400 text-sm">{today} • AI briefing ready</p>
            </div>

            {/* App Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-28 no-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-neutral-500 animate-pulse">Synthesizing data...</p>
                </div>
              ) : aiSummary ? (
                <>
                  <div className="bg-[#2C2C2E] rounded-2xl p-5 mb-4">
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Today's Summary</h3>
                    <p className="text-sm leading-relaxed text-neutral-200">{aiSummary.todaysSummary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#2C2C2E] rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Pipeline</p>
                      <p className="text-xl font-bold">{aiSummary.metrics.pipelineValue}</p>
                      <p className="text-xs text-neutral-400 mt-1">{aiSummary.metrics.pipelineOpenDeals}</p>
                    </div>
                    <div className="bg-[#2C2C2E] rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Cash (Xero)</p>
                      <p className="text-xl font-bold text-green-400">{aiSummary.metrics.cashBalance}</p>
                      <p className="text-xs text-neutral-400 mt-1">{aiSummary.metrics.cashDueToday}</p>
                    </div>
                    <div className="bg-[#2C2C2E] rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Needs Action</p>
                      <p className="text-xl font-bold text-yellow-500">{aiSummary.metrics.needsActionCount}</p>
                      <p className="text-xs text-neutral-400 mt-1">deals stalled</p>
                    </div>
                    <div className="bg-[#2C2C2E] rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Overdue Inv.</p>
                      <p className="text-xl font-bold text-red-400">{aiSummary.metrics.overdueInvValue}</p>
                      <p className="text-xs text-neutral-400 mt-1">unpaid</p>
                    </div>
                  </div>

                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Priority Alerts</h3>
                  <div className="space-y-3 mb-8">
                    {aiSummary.priorityAlerts.map((alert: any, idx: number) => (
                      <div key={idx} className="bg-[#2C2C2E] rounded-2xl p-4 flex gap-3 items-start">
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${alert.status === 'danger' ? 'bg-red-500' : alert.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <div>
                          <p className="font-semibold text-sm text-white">{alert.title}</p>
                          <p className="text-xs text-neutral-400 mt-1">{alert.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Chatbox */}
                  <div className="border-t border-neutral-700/50 pt-6">
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Ask Chief of Staff</h3>
                    {chatResponse && (
                      <div className="bg-blue-900/20 border border-blue-800/50 text-blue-100 p-4 rounded-xl text-sm mb-4 leading-relaxed">
                        {chatResponse}
                      </div>
                    )}
                    <form onSubmit={askAI} className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g. Which invoices to chase?" 
                        className="flex-1 bg-[#3A3A3C] rounded-full px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button type="submit" disabled={chatLoading} className="bg-blue-600 rounded-full px-4 py-2 text-sm font-semibold">
                        {chatLoading ? '...' : 'Ask'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="bg-[#2C2C2E] rounded-2xl p-5 text-center text-neutral-500 text-sm mt-10">
                  Sync CRM & Finance data, then generate briefing.
                </div>
              )}
            </div>

            {/* App Bottom Navigation */}
            <div className="absolute bottom-0 w-full h-20 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 flex justify-around items-center px-2 pb-4">
              <div className="flex flex-col items-center text-blue-500">
                <span className="text-xl mb-1">📊</span>
                <span className="text-[10px] font-medium">Briefing</span>
              </div>
              <div className="flex flex-col items-center text-neutral-500">
                <span className="text-xl mb-1">⏱️</span>
                <span className="text-[10px] font-medium">Pipeline</span>
              </div>
              <div className="flex flex-col items-center text-neutral-500">
                <span className="text-xl mb-1">👥</span>
                <span className="text-[10px] font-medium">Team</span>
              </div>
              <div className="flex flex-col items-center text-neutral-500">
                <span className="text-xl mb-1">🎙️</span>
                <span className="text-[10px] font-medium">Capture</span>
              </div>
            </div>
          </div>
        </section>

        {/* KOLOM KANAN (Raw Data & Visualisasi) - Disembunyikan di HP, Muncul di Desktop */}
        <section className="hidden lg:flex flex-col space-y-6">
          <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-lg font-semibold mb-4 text-white">Xero Connection Status</h2>
            {xeroData ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400 text-sm">Status</span>
                  <span className="text-green-400 font-medium text-sm">Connected</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400 text-sm">Real-time Cash</span>
                  <span className="text-blue-400 font-bold">{xeroData.cash}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Overdue Invoices</span>
                  <span className="text-red-400 font-bold">{xeroData.invoicesOverdue}</span>
                </div>
              </div>
            ) : <p className="text-neutral-500 text-sm">Connect via OAuth to fetch data.</p>}
          </div>

          <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-neutral-800 flex-1 min-h-[300px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-white">Live Pipeline Value (HubSpot)</h2>
            {hubspotData ? (
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#525252" tick={{fill: '#a3a3a3', fontSize: 10}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#262626'}} contentStyle={{backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px'}} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-neutral-500 text-sm">Sync HubSpot to generate chart.</p>}
          </div>
        </section>
        
      </main>
    </div>
  );
}