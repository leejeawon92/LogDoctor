import React from 'react';
import { Activity, ShieldAlert, Terminal, Server, Cpu, Database } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 font-sans">
      
      {/* 상단 헤더: 로고 및 서버 상태 */}
      <header className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {/* [What] Activity: 실시간 분석 중임을 나타내는 심박수 모양 아이콘입니다. */}
          <Activity className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            LogDoctor <span className="text-slate-500 text-xs font-mono">v1.0.0-PRO</span>
          </h1>
        </div>
        <div className="flex gap-4">
          {/* [What] animate-pulse: 백엔드와 연결되었음을 시각적으로 보여주기 위해 깜빡이는 효과를 줍니다. */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium">Backend: Connected</span>
          </div>
        </div>
      </header>

      {/* 대시보드 그리드: 요약 카드와 로그 터미널 */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 왼쪽 섹션: 주요 지표 카드 */}
        <div className="space-y-6">
          {/* 위협 감지 카드 */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-red-500/50 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-slate-400 text-sm font-semibold uppercase">Critical Issues</h2>
              <ShieldAlert className="text-red-500 w-5 h-5" />
            </div>
            <p className="text-4xl font-bold">0</p>
          </div>
          
          {/* AI 상태 카드 */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-slate-400 text-sm font-semibold uppercase">AI Analysis</h2>
              <Database className="text-blue-400 w-5 h-5" />
            </div>
            <p className="text-sm text-slate-300">Gemini-1.5-Pro: Active</p>
          </div>
        </div>

        {/* 오른쪽 섹션: 실시간 로그 스트리밍 창 (가로 3칸 차지) */}
        <div className="lg:col-span-3 bg-black rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold font-mono">Live_Log_Terminal</span>
            </div>
          </div>
          <div className="p-5 font-mono text-xs text-emerald-400/90 leading-relaxed overflow-y-auto min-h-[400px]">
            <p className="mb-1 text-slate-500">[2026-05-04 19:40:01] INFO: LogDoctor Dashboard Initialized.</p>
            <p className="mb-1 text-emerald-500">[2026-05-04 19:40:02] SUCCESS: Tailwind v4 Engine Loaded.</p>
            <p className="mb-1 text-blue-400">[2026-05-04 19:40:03] DEBUG: Listening for FastAPI stream...</p>
            <p className="animate-pulse">_</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;