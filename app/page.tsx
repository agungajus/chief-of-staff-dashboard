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
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col items-center py-6 md:py-10">
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="w-full max-w-7xl px-4 md:px-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Chief of Staff Portal</h1>
          <p className="text-neutral-400 mt-1">Live Integration Sandbox</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={fetchHubspot} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            1. Sync HubSpot
          </button>
          <button onClick={loginXero} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${xeroData ? 'bg-green-600' : 'bg-orange-600'}`}>
            {xeroData ? "✓ Xero Connected" : "2. Connect Xero"}
          </button>
          <button onClick={generateSummary} disabled={!hubspotData || !xeroData} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            3. Generate Briefing
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <main className="w-full max-w-7xl px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        
        {/* KOLOM KIRI (Briefing AI - Span 2) */}
        <section className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Greeting Card */}
          <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-neutral-800 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Good morning, Thom</h2>
              <p className="text-neutral-400 text-sm mt-1">{today} • AI briefing ready</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-lg hidden md:flex">MR</div>
          </div>

          {/* AI Briefing Content */}
          <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-neutral-800 min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-neutral-500 animate-pulse text-lg">Synthesizing data...</p>
              </div>
            ) : aiSummary ? (
              <>
                <div className="bg-[#2C2C2E] rounded-xl p-5 mb-6">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Today's Summary</h3>
                  <p className="text-base leading-relaxed text-neutral-200">{aiSummary.todaysSummary}</p>
                </div>

                {/* Metrics Grid - 2 kolom di HP, 4 kolom di Desktop */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#2C2C2E] rounded-xl p-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Pipeline</p>
                    <p className="text-2xl font-bold">{aiSummary.metrics.pipelineValue}</p>
                    <p className="text-sm text-neutral-400 mt-1">{aiSummary.metrics.pipelineOpenDeals}</p>
                  </div>
                  <div className="bg-[#2C2C2E] rounded-xl p-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Cash (Xero)</p>
                    <p className="text-2xl font-bold text-green-400">{aiSummary.metrics.cashBalance}</p>
                    <p className="text-sm text-neutral-400 mt-1">{aiSummary.metrics.cashDueToday}</p>
                  </div>
                  <div className="bg-[#2C2C2E] rounded-xl p-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Needs Action</p>
                    <p className="text-2xl font-bold text-yellow-500">{aiSummary.metrics.needsActionCount}</p>
                    <p className="text-sm text-neutral-400 mt-1">deals stalled</p>
                  </div>
                  <div className="bg-[#2C2C2E] rounded-xl p-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Overdue Inv.</p>
                    <p className="text-2xl font-bold text-red-400">{aiSummary.metrics.overdueInvValue}</p>
                    <p className="text-sm text-neutral-400 mt-1">unpaid</p>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Priority Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {aiSummary.priorityAlerts.map((alert: any, idx: number) => (
                    <div key={idx} className="bg-[#2C2C2E] rounded-xl p-4 flex gap-3 items-start">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${alert.status === 'danger' ? 'bg-red-500' : alert.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div>
                        <p className="font-semibold text-base text-white">{alert.title}</p>
                        <p className="text-sm text-neutral-400 mt-1">{alert.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chatbox Khusus */}
                <div className="border-t border-neutral-700/50 pt-6 mt-6">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Ask Chief of Staff</h3>
                  {chatResponse && (
                    <div className="bg-blue-900/20 border border-blue-800/50 text-blue-100 p-4 rounded-xl text-sm mb-5 leading-relaxed">
                      {chatResponse}
                    </div>
                  )}
                  <form onSubmit={askAI} className="flex gap-3">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="e.g. Which invoices should I chase today?" 
                      className="flex-1 bg-[#2C2C2E] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    />
                    <button type="submit" disabled={chatLoading} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 text-sm font-semibold transition-colors">
                      {chatLoading ? 'Thinking...' : 'Ask'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64 text-neutral-500 text-sm">
                Sync CRM & Finance data, then click Generate Briefing to see your dashboard.
              </div>
            )}
          </div>
        </section>

        {/* KOLOM KANAN (Raw Data & Charts - Span 1) */}
        <section className="col-span-1 flex flex-col space-y-6">
          
          <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-lg font-semibold mb-4 text-white">Xero Connection Status</h2>
            {xeroData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <span className="text-neutral-400 text-sm">Status</span>
                  <span className="text-green-400 font-medium text-sm px-2 py-1 bg-green-400/10 rounded-md">Connected</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <span className="text-neutral-400 text-sm">Real-time Cash</span>
                  <span className="text-blue-400 font-bold text-lg">{xeroData.cash}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Overdue Invoices</span>
                  <span className="text-red-400 font-bold text-lg">{xeroData.invoicesOverdue}</span>
                </div>
              </div>
            ) : <p className="text-neutral-500 text-sm">Connect via OAuth to fetch live financial data.</p>}
          </div>

          <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-neutral-800 flex-1 min-h-[400px] flex flex-col">
            <h2 className="text-lg font-semibold mb-6 text-white">Live Pipeline Value (HubSpot)</h2>
            {hubspotData ? (
              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#525252" tick={{fill: '#a3a3a3', fontSize: 11}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" tick={{fill: '#a3a3a3', fontSize: 11}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#262626'}} contentStyle={{backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px'}} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-neutral-500 text-sm">Sync HubSpot to generate real-time pipeline chart.</p>}
          </div>
          
        </section>
      </main>
    </div>
  );
}