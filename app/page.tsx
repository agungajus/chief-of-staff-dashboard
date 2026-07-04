"use client";
import { useState, useEffect } from "react";

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

  // Format tanggal sesuai desain: "Saturday 4 July"
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center py-10 font-sans">
      
      {/* DEV CONTROLS - Di luar layar HP agar UI tetap bersih */}
      <div className="mb-8 flex gap-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
        <button onClick={fetchHubspot} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold">
          1. Sync HubSpot
        </button>
        <button onClick={loginXero} className={`px-4 py-2 rounded-md text-white text-sm font-semibold ${xeroData ? 'bg-green-600' : 'bg-orange-600'}`}>
          {xeroData ? "✓ Xero Connected" : "2. Connect Xero"}
        </button>
        <button onClick={generateSummary} disabled={!hubspotData || !xeroData} className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 px-4 py-2 rounded-md text-sm font-semibold">
          3. Generate Briefing
        </button>
      </div>

      {/* MOBILE APP CONTAINER - Meniru desain Thomas */}
      <div className="w-full max-w-[400px] h-[800px] bg-[#1C1C1E] rounded-[40px] shadow-2xl border-[6px] border-black overflow-hidden flex flex-col relative text-white">
        
        {/* Header */}
        <div className="px-6 pt-12 pb-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Good morning, Mark</h1>
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-sm">MR</div>
          </div>
          <p className="text-neutral-400 text-sm">{today} • AI briefing ready</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-neutral-500 animate-pulse">Synthesizing data...</p>
            </div>
          ) : aiSummary ? (
            <>
              {/* Today's Summary */}
              <div className="bg-[#2C2C2E] rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Today's Summary</h3>
                <p className="text-sm leading-relaxed text-neutral-200">{aiSummary.todaysSummary}</p>
              </div>

              {/* 4 Grid Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#2C2C2E] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Pipeline</p>
                  <p className="text-2xl font-bold">{aiSummary.metrics.pipelineValue}</p>
                  <p className="text-xs text-neutral-400 mt-1">{aiSummary.metrics.pipelineOpenDeals}</p>
                </div>
                <div className="bg-[#2C2C2E] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Cash (Xero)</p>
                  <p className="text-2xl font-bold text-green-400">{aiSummary.metrics.cashBalance}</p>
                  <p className="text-xs text-neutral-400 mt-1">{aiSummary.metrics.cashDueToday}</p>
                </div>
                <div className="bg-[#2C2C2E] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Needs Action</p>
                  <p className="text-2xl font-bold text-yellow-500">{aiSummary.metrics.needsActionCount}</p>
                  <p className="text-xs text-neutral-400 mt-1">deals stalled</p>
                </div>
                <div className="bg-[#2C2C2E] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Overdue Inv.</p>
                  <p className="text-2xl font-bold text-red-400">{aiSummary.metrics.overdueInvValue}</p>
                  <p className="text-xs text-neutral-400 mt-1">unpaid</p>
                </div>
              </div>

              {/* Priority Alerts */}
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Priority Alerts</h3>
              <div className="space-y-3 mb-8">
                {aiSummary.priorityAlerts.map((alert: any, idx: number) => (
                  <div key={idx} className="bg-[#2C2C2E] rounded-2xl p-4 flex gap-3 items-start">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${alert.status === 'danger' ? 'bg-red-500' : alert.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <div>
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-xs text-neutral-400 mt-1">{alert.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-[#2C2C2E] rounded-2xl p-5 text-center text-neutral-500 text-sm mt-10">
              Sync data and generate briefing to see your dashboard.
            </div>
          )}

          {/* Chatbox Khusus */}
          {aiSummary && (
            <div className="mt-6 border-t border-neutral-800 pt-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Ask Chief of Staff</h3>
              {chatResponse && (
                <div className="bg-blue-900/30 text-blue-100 p-4 rounded-xl text-sm mb-4 leading-relaxed">
                  {chatResponse}
                </div>
              )}
              <form onSubmit={askAI} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..." 
                  className="flex-1 bg-[#2C2C2E] rounded-full px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" disabled={chatLoading} className="bg-blue-600 rounded-full px-4 py-2 text-sm font-semibold">
                  {chatLoading ? '...' : 'Ask'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Fake Bottom Navigation Bar */}
        <div className="absolute bottom-0 w-full h-20 bg-[#1C1C1E] border-t border-neutral-800 flex justify-around items-center px-2 pb-4">
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
    </div>
  );
}