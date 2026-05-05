import React, { useState, useEffect } from 'react';
// [What] UI 아이콘 라이브러리를 불러옵니다.
import { Activity, ShieldAlert, Terminal, Database } from 'lucide-react';

function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // FastAPI 서버(기본 8000포트)의 로그 엔드포인트를 호출
        const response = await fetch('http://localhost:8000/api/logs');
        const data = await response.json();
        
        // 받아온 최신 데이터로 로그 상태를 업데이트
        setLogs(data);
      } catch (error) {
        console.error("Backend connection failed:", error);
      }
    };

    // 실시간 감시 느낌을 주기 위해 3초마다 백엔드에 새로운 로그가 있는지 확인
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval); // 페이지를 나갈 때 메모리 누수를 방지하기 위해 타이머를 해제
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 font-sans">
      {/* 헤더 섹션 */}
      <header className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-extrabold tracking-tight">LogDoctor</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {/* logs.length가 있으면 연결 성공으로 간주하여 녹색 불을 켠다 */}
            <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium">
              {logs.length > 0 ? 'System: Online' : 'System: Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          {/* Critical Issues 카드 */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-slate-400 text-sm font-semibold uppercase">Critical Issues</h2>
              <ShieldAlert className="text-red-500 w-5 h-5" />
            </div>
            {/* 로그 중 'ERROR'나 'CRITICAL'이 포함된 개수만 필터링하여 표시 */}
            <p className="text-4xl font-bold">
              {logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length}
            </p>
          </div>
          
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <h2 className="text-slate-400 text-sm font-semibold uppercase mb-4">AI Analysis</h2>
            <p className="text-sm text-slate-300 italic">Analyzing latest logs...</p>
          </div>
        </div>

        {/* 실시간 로그 터미널 창 */}
        <div className="lg:col-span-3 bg-black rounded-xl border border-slate-800 shadow-2xl flex flex-col">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold font-mono">Live_Log_Terminal</span>
          </div>
          
          <div className="p-5 font-mono text-xs leading-relaxed overflow-y-auto min-h-[400px]">
            {/* 배열에 담긴 로그 데이터를 한 줄씩 화면에 그림 */}
            {logs.length > 0 ? logs.map((log, index) => (
              <p key={index} className="mb-1">
                <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                <span className={log.level === 'ERROR' ? 'text-red-500' : 'text-emerald-400'}>
                  {log.level}:
                </span>{' '}
                {log.message}
              </p>
            )) : (
              <p className="text-slate-500 italic">No logs received from server...</p>
            )}
            <p className="animate-pulse">_</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;