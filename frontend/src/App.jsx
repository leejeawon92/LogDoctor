import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = "";

function App() {
  const [logs, setLogs] = useState([]);
  const [diagnosis, setDiagnosis] = useState("장애 대기 중... 새로운 ERROR 로그를 기다리고 있습니다.");
  const [status, setStatus] = useState({ status: "Offline", critical_issues: 0 });
  const [history, setHistory] = useState([]); // 데이터베이스에서 가져온 진단 이력을 저장하는 상태
  const lastNotifiedRef = useRef("");

  // 위험도를 판별하여 시스템 알림을 발생시킨다.
  const triggerNotification = (analysisText) => {
    if (!analysisText || analysisText.includes("대기 중")) return;

    // AI 응답이 정상적인 리포트가 아닌 API 에러 메시지인지 확인
    const isErrorMessage = analysisText.includes("오류 발생") || analysisText.includes("429") || analysisText.includes("RESOURCE_EXHAUSTED");
    if (isErrorMessage) return;

    const isHighRisk = analysisText.toLowerCase().includes("high") || analysisText.includes("높음");

    if (isHighRisk && lastNotifiedRef.current !== analysisText) {
      if (Notification.permission === "granted") {
        new Notification("🚨 LogDoctor 위협 감지", {
          body: "심각한 시스템 위협이 감지되었습니다. 진단 리포트를 확인하십시오.",
          requireInteraction: true
        });
        lastNotifiedRef.current = analysisText;
      }
    }
  };

  const handleManualAnalysis = async () => {
    const lastError = [...logs].reverse().find(l => l.level === 'ERROR');
    if (!lastError) {
      setDiagnosis("분석할 ERROR 로그가 없습니다.");
      return;
    }
    setDiagnosis("AI가 즉시 분석 중입니다...");
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        content: `${lastError.timestamp} ${lastError.level}: ${lastError.message}`
      });
      const result = response.data.analysis;
      setDiagnosis(result);
      triggerNotification(result);
    } catch (error) {
      setDiagnosis("분석 요청 중 오류 발생.");
    }
  };

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const fetchData = async () => {
      try {
        const [logRes, statusRes, diagRes,historyRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/logs`),
          axios.get(`${API_BASE_URL}/api/status`),
          axios.get(`${API_BASE_URL}/api/diagnosis`),
          axios.get(`${API_BASE_URL}/api/history`)
        ]);
        setLogs(logRes.data);
        setStatus(statusRes.data);
        setHistory(historyRes.data);
        
        const currentAnalysis = diagRes.data.analysis;
        if (currentAnalysis) {
          setDiagnosis(currentAnalysis);
          // 백엔드에서 가져온 분석 데이터를 알림 함수로 전달
          // 수동 클릭 없이도 30초마다 업데이트되는 정보를 감시하여 알림을 띄우기 위함
          triggerNotification(currentAnalysis);
        }
      } catch (error) {
        console.error("Data fetching error:", error);
      }
    };

    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);
return (
    <div style={{ backgroundColor: '#020617', color: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ color: '#38bdf8', fontSize: '24px', fontWeight: 'bold' }}>📈 LogDoctor</div>
        <div style={{ backgroundColor: '#1e293b', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', border: '1px solid #334155' }}>
          <span style={{ color: status.status === "Online" ? "#4ad991" : "#ff4d4d", marginRight: '5px' }}>●</span>
          System: {status.status}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px' }}>
        {/* 왼쪽 사이드바 */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>CRITICAL ISSUES</span>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{status.critical_issues}</div>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>AI ANALYSIS</span>
              <button onClick={handleManualAnalysis} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                진단 실행
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', height: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {diagnosis}
            </div>
          </div>
        </aside>

        {/* 오른쪽 메인 영역 */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* 실시간 로그 터미널 */}
          <section style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 20px', fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #334155' }}> {">_"} Live_Log_Terminal </div>
            <div style={{ padding: '20px', height: '400px', overflowY: 'auto', backgroundColor: '#000', fontFamily: 'monospace', fontSize: '14px' }}>
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>[{log.timestamp}]</span>
                  <span style={{ color: log.level === 'ERROR' ? '#ef4444' : '#22c55e', margin: '0 10px', fontWeight: 'bold' }}>{log.level}:</span>
                  <span style={{ color: '#e2e8f0' }}>{log.message}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 진단 이력 테이블 */}
          <section style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '15px' }}>📜 DIAGNOSIS HISTORY (Last 10)</div>
            <table style={{ width: '100%', color: '#e2e8f0', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px' }}>Time</th>
                  <th style={{ padding: '10px' }}>Risk</th>
                  <th style={{ padding: '10px' }}>Original Log</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{item.timestamp}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        color: item.risk_level === 'High' ? '#ef4444' : 
                               item.risk_level === 'Medium' ? '#eab308' : '#22c55e',
                        fontWeight: 'bold'
                      }}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{item.original_log}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;