import asyncio
import os
import sys
import uvicorn
import webbrowser
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from analyzer import analyze_log_with_gemini
from pydantic import BaseModel
from database import SessionLocal, LogDiagnosis, init_db
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse


def get_base_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

BASE_DIR = get_base_path()

# 환경 변수 로드
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = FastAPI()

# 전역 상태 저장소
latest_diagnosis = {"analysis": "장애 대기 중... 새로운 ERROR 로그를 기다리고 있습니다."}
LOG_FILE_PATH = os.path.join(BASE_DIR, "logs", "server.log")
DIST_PATH = os.path.join(BASE_DIR, "dist")


# CORS 설정
origins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()
    asyncio.create_task(log_watcher())
    webbrowser.open("http://127.0.0.1:8000")


# 실시간 로그 감시 로직 보수
async def log_watcher():
    global latest_diagnosis
    last_analyzed_error = "" 

    while True:
        await asyncio.sleep(1) # 1초마다 감시
        if not os.path.exists(LOG_FILE_PATH): continue

        try:
            with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()
                if not lines: continue
                last_line = lines[-1].strip()
                
                # 새로운 에러가 발견되면 즉시 '마지막 분석 에러'로 등록
                # AI 분석이 성공하든 실패하든, 한 번 읽은 에러를 계속 AI에게 보내서 할당량을 낭비하는 스팸 현상을 막기 위함
                if "ERROR" in last_line and last_line != last_analyzed_error:
                    print(f"✅ 새로운 위험 에러 발견: {last_line}")
                    last_analyzed_error = last_line # 즉시 등록하여 스팸 방지

                    # AI 분석 실행
                    analysis_result = analyze_log_with_gemini(last_line)
                    
                    # AI 분석 결과가 에러여도 DB에 일단 저장합니다.
                    # AI 할당량이 초과되어도 "언제 어떤 에러가 났었는지" 기록은 남아야 나중에 확인이 가능하기 때문
                    db = SessionLocal()
                    try:
                        risk_val = "High" if "High" in analysis_result else "Medium"
                        if "429" in analysis_result or "RESOURCE_EXHAUSTED" in analysis_result:
                            analysis_result = "⚠️ AI 할당량 초과로 분석 실패 (내일 다시 시도하거나 키를 교체하세요)"
                            risk_val = "Unknown"

                        new_entry = LogDiagnosis(
                            log_level="ERROR",
                            original_log=last_line,
                            analysis_report=analysis_result,
                            risk_level=risk_val
                        )
                        db.add(new_entry)
                        db.commit()
                        print(f"💾 DB 저장 완료: {last_line[:30]}...")
                    except Exception as db_e:
                        print(f"❌ DB 저장 오류: {db_e}")
                    finally:
                        db.close()
                    
                    latest_diagnosis = {"analysis": analysis_result}
        except Exception as e:
            print(f"Watcher Error: {e}")


@app.get("/api/logs")
async def get_logs():
    if not os.path.exists(LOG_FILE_PATH): return []
    logs = []
    try:
        with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()[-100:]
            for line in lines:
                if ":" in line:
                    parts = line.split(" ", 2)
                    logs.append({
                        "timestamp": parts[0].strip("[]"),
                        "level": parts[1].replace(":", ""),
                        "message": parts[2].strip()
                    })
    except Exception as e:
        print(f"Error reading log: {e}")
    return logs

@app.get("/api/diagnosis")
async def get_diagnosis():
    return latest_diagnosis

@app.get("/api/status")
async def get_status():
    return {"status": "Online", "critical_issues": 1}

@app.post("/analyze")
async def analyze_log(log_data: dict):
    log_content = log_data.get("content", "")
    if not log_content: return {"error": "내용 없음"}
    return {"analysis": analyze_log_with_gemini(log_content)}


# 데이터베이스에 저장된 최근 10개의 진단 이력을 가져오는 API
# 대시보드에서 과거 장애 내역을 확인하여 반복되는 장애 패턴을 파악하기 위함
@app.get("/api/history")
async def get_history():
    db = SessionLocal()
    try:
        # 최신순으로 10개만 조회
        history = db.query(LogDiagnosis).order_by(LogDiagnosis.timestamp.desc()).limit(10).all()
        return [
            {
                "id": h.id,
                "timestamp": h.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "original_log": h.original_log,
                "risk_level": h.risk_level,
                "analysis_report": h.analysis_report[:50] + "..." # 요약본만 전달
            } for h in history
        ]
    finally:
        db.close()

# 정적 파일 서빙 (가장 하단에 배치하여 API 우선순위 확보)
if os.path.exists(DIST_PATH):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_PATH, "assets")), name="assets")

    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        # API 요청은 위에서 이미 처리됨. 그 외 모든 경로는 index.html로.
        return FileResponse(os.path.join(DIST_PATH, "index.html"))
else:
    @app.get("/")
    async def serve_index():
        return {"message": "Frontend build (dist) not found."}
    

if __name__ == "__main__":
    # 8000번 포트로 서버 가동
    uvicorn.run(app, host="127.0.0.1", port=8000)
