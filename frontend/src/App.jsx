import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [logs, setLogs] = useState([]);
  const [diagnosis, setDiagnosis] = useState("로그를 확인한 후 'AI 진단 실행' 버튼을 눌러주세요.");
  const [status, setStatus] = useState({ status: "Offline", critical_issues: 0 });

  // 1. 실시간 데이터 동기화
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logRes, statusRes, diagRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/logs`),
          axios.get(`${API_BASE_URL}/api/status`),
          axios.get(`${API_BASE_URL}/api/diagnosis`)
        ]);
        setLogs(logRes.data);
        setStatus(statusRes.data);
        
        // 자동 감시 엔진의 결과가 있으면 화면에 표시
        if (diagRes.data.analysis && !diagRes.data.analysis.includes("대기 중")) {
          setDiagnosis(diagRes.data.analysis);
        }
      } catch (error) {
        console.error("Data fetching error:", error);
      }
    };
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. [추가] 버튼 클릭 시 실행될 수동 분석 함수
  const handleManualAnalysis = async () => {
    // 터미널 로그 중 가장 최근의 ERROR를 찾음
    const lastError = [...logs].reverse().find(l => l.level === 'ERROR');
    
    if (!lastError) {
      setDiagnosis("분석할 ERROR 로그가 터미널에 없습니다.");
      return;
    }

    setDiagnosis("AI가 분석 중입니다... 잠시만 기다려주세요.");

    try {
      // 백엔드 /analyze 엔드포인트 호출
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        content: `${lastError.timestamp} ${lastError.level}: ${lastError.message}`
      });
      setDiagnosis(response.data.analysis);
    } catch (error) {
      console.error("Manual analysis error:", error);
      setDiagnosis("분석 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ backgroundColor: '#020617', color: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: '#38bdf8', fontSize: '24px', fontWeight: 'bold' }}>📈 LogDoctor</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', border: '1px solid #334155' }}>
          <span style={{ color: status.status === "Online" ? "#4ad991" : "#ff4d4d", marginRight: '5px' }}>●</span>
          System: {status.status}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>CRITICAL ISSUES</span>
              <span style={{ color: '#ef4444' }}>🚫</span>
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{status.critical_issues}</div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>AI ANALYSIS</span>
              {/* 버튼에 handleManualAnalysis 함수 연결 */}
              <button 
                onClick={handleManualAnalysis}
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                AI 진단 실행
              </button>
            </div>
              <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', height: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {diagnosis}
              </div>
          </div>
        </aside>

        <section style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '10px 20px', fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
            {">_"} Live_Log_Terminal
          </div>
          <div style={{ padding: '20px', height: '500px', overflowY: 'auto', backgroundColor: '#000', fontFamily: 'monospace', fontSize: '14px' }}>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569' }}>[{log.timestamp}]</span>
                <span style={{ color: log.level === 'ERROR' ? '#ef4444' : '#22c55e', margin: '0 10px', fontWeight: 'bold' }}>
                  {log.level}:
                </span>
                <span style={{ color: '#e2e8f0' }}>{log.message}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;