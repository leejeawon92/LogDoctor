import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [logs, setLogs] = useState([]);
  const [diagnosis, setDiagnosis] = useState("장애 대기 중... 새로운 ERROR 로그를 기다리고 있습니다.");
  const [status, setStatus] = useState({ status: "Offline", critical_issues: 0 });
  
  // [무엇을 하는가]: 마지막으로 알림을 보낸 진단 내용을 저장하여 중복 알림을 방지합니다. [cite: 531, 841]
  const lastNotifiedRef = useRef("");

  // [무엇을 하는가]: AI 진단 결과의 위험도를 판단하여 브라우저 알림을 트리거합니다. [cite: 1198]
  // [왜 작성했는가]: 버튼 없이도 백엔드에서 넘어온 위험도 데이터(High)를 감지하여 즉각 알림을 띄우기 위함입니다.
  const triggerNotification = (analysisText) => {
    if (!analysisText || analysisText.includes("대기 중")) return;

    // 대소문자 구분 없이 "High" 또는 "높음"이 포함되어 있는지 팩트체크합니다. [cite: 1187, 1193]
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
    setDiagnosis("AI가 분석 중입니다...");
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        content: `${lastError.timestamp} ${lastError.level}: ${lastError.message}`
      });
      const result = response.data.analysis;
      setDiagnosis(result);
      // 수동 진단 시에도 위험도가 높으면 즉시 알림을 수행합니다. [cite: 1181]
      triggerNotification(result);
    } catch (error) {
      setDiagnosis("분석 요청 중 오류 발생.");
    }
  };

  useEffect(() => {
    // 앱 초기 로드 시 알림 권한을 확인합니다.
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const fetchData = async () => {
      try {
        const [logRes, statusRes, diagRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/logs`),
          axios.get(`${API_BASE_URL}/api/status`),
          axios.get(`${API_BASE_URL}/api/diagnosis`)
        ]);
        setLogs(logRes.data);
        setStatus(statusRes.data);
        
        // [무엇을 하는가]: 1초마다 백엔드를 확인하며 새로운 진단 결과가 오면 알림 로직을 실행합니다. 
        if (diagRes.data.analysis) {
          setDiagnosis(diagRes.data.analysis);
          triggerNotification(diagRes.data.analysis);
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
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>CRITICAL ISSUES</span>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{status.critical_issues}</div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>AI ANALYSIS</span>
              {/* [변경 사항]: 임시 '알림 테스트' 버튼을 제거하고 '진단 실행'만 남겼습니다. [cite: 944, 1147] */}
              <button onClick={handleManualAnalysis} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                진단 실행
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', height: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {diagnosis}
            </div>
          </div>
        </aside>

        <section style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '10px 20px', fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #334155' }}> {">_"} Live_Log_Terminal </div>
          <div style={{ padding: '20px', height: '500px', overflowY: 'auto', backgroundColor: '#000', fontFamily: 'monospace', fontSize: '14px' }}>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569' }}>[{log.timestamp}]</span>
                <span style={{ color: log.level === 'ERROR' ? '#ef4444' : '#22c55e', margin: '0 10px', fontWeight: 'bold' }}>{log.level}:</span>
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