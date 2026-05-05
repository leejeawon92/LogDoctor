// useState, useEffect 외에 렌더링 사이에 값을 유지할 useRef가 추가로 필요.
// react 패키지에서 useRef를 명시적으로 불러온다.
import React, { useState, useEffect, useRef } from 'react';
// UI 구성에 필요한 아이콘 라이브러리를 불러온다.
import { Activity, ShieldAlert, Terminal, Database } from 'lucide-react';

function App() {
  const [logs, setLogs] = useState([]);
  // Gemini AI의 분석 결과 메시지를 저장하여 화면에 표시하기 위한 상태.
  const [analysis, setAnalysis] = useState("Analyzing latest logs...");
  
  // 이전 로그 문자열을 저장해두고, 내용이 변했을 때만 API를 호출하여 429 에러를 방지.
  // 초기값은 빈 문자열로 설정된 Ref 객체를 생성.
  const prevLogContentRef = useRef(""); 

  useEffect(() => {
    // 백엔드 서버에서 실시간 로그 데이터를 가져오기 위한 함수.
    const fetchLogs = async () => {
      try {
        // FastAPI의 로그 엔드포인트(8000번 포트)로 요청을 보낸다.
        const response = await fetch('http://localhost:8000/api/logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Backend connection failed:", error);
      }
    };

    // 대시보드 활성화를 위해 앱 시작 시 즉시 실행하고 3초마다 반복.
    fetchLogs();
    const logInterval = setInterval(fetchLogs, 3000);

    return () => {
        // 컴포넌트가 사라질 때 타이머를 제거하여 메모리 누수를 방지.
        clearInterval(logInterval);
    };
  }, []);

  // logs 상태가 변경될 때마다 AI 분석이 필요한 상황인지 판단.
  useEffect(() => {
    const requestAnalysis = async () => {
      if (logs.length > 0) {
        // 현재 배열 형태의 로그를 줄바꿈 문자로 합쳐 문자열로 만든다.
        const currentLogContent = logs.map(l => `[${l.level}] ${l.message}`).join('\n');
        
        // 불필요한 API 호출을 막기 위해 이전 분석 내용과 다를 때만 실행.
        if (currentLogContent !== prevLogContentRef.current) {
            try {
                setAnalysis("Requesting new analysis..."); 
                // 백엔드의 분석 엔드포인트에 로그 데이터를 담아 POST 요청을 보낸다.
                const aiResponse = await fetch('http://localhost:8000/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: currentLogContent })
                });
                const aiData = await aiResponse.json();
                
                // 할당량 초과(429) 발생 시 사용자에게 친절한 안내 문구를 출력.
                if (aiData.analysis && aiData.analysis.includes("429 RESOURCE_EXHAUSTED")) {
                    setAnalysis("API 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.");
                } else {
                    setAnalysis(aiData.analysis);
                }
                
                // 이번에 분석한 내용을 Ref에 저장하여 다음 비교에 사용.
                prevLogContentRef.current = currentLogContent;

            } catch(error){
                console.error("AI Analysis failed:", error);
                setAnalysis("분석 요청 중 오류가 발생했습니다.");
            }
        }
      }
    };

    requestAnalysis();

  }, [logs]); // logs 데이터가 변경될 때마다 이 효과가 트리거가 된다.

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 font-sans">
      <header className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-extrabold tracking-tight">LogDoctor</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {/* 시스템 연결 상태에 따라 표시등 색상을 변경. */}
            <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium">
              {logs.length > 0 ? 'System: Online' : 'System: Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-slate-400 text-sm font-semibold uppercase">Critical Issues</h2>
              <ShieldAlert className="text-red-500 w-5 h-5" />
            </div>
            {/* 에러 등급의 로그 개수만 필터링하여 실시간 숫자로 표시. */}
            <p className="text-4xl font-bold">
              {logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length}
            </p>
          </div>
          
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <h2 className="text-slate-400 text-sm font-semibold uppercase mb-4">AI Analysis</h2>
            {/* Gemini가 분석한 결과를 줄바꿈이 유지되도록 화면에 출력. */}
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {analysis}
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-black rounded-xl border border-slate-800 shadow-2xl flex flex-col">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold font-mono">Live_Log_Terminal</span>
          </div>
          
          <div className="p-5 font-mono text-xs leading-relaxed overflow-y-auto min-h-[400px]">
            {/* 로그 리스트를 순회하며 타임스탬프와 메시지를 출력 */}
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