import asyncio
import os
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from analyzer import analyze_log_with_gemini
from pydantic import BaseModel

# 1. 환경 변수 로드
load_dotenv()

app = FastAPI()

# 2. 전역 상태 저장소 (AI 분석 결과 유지)
latest_diagnosis = {"analysis": "장애 대기 중... 새로운 ERROR 로그를 기다리고 있습니다."}

# 3. CORS 설정
origins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     
    allow_credentials=True,    
    allow_methods=["*"],       
    allow_headers=["*"],       
)

# 4. 로그 파일 경로 설정 (컨테이너 내부 절대 경로)
LOG_FILE_PATH = "/app/logs/server.log"

# 5. 실시간 로그 감시 로직
async def log_watcher():
    global latest_diagnosis
    last_detected_error = ""

    while True:
        await asyncio.sleep(30) # 1초마다 체크
        if not os.path.exists(LOG_FILE_PATH):
            continue

        try:
            with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()
                if not lines:
                    continue
                
                # 역순으로 검사하여 가장 최근의 ERROR 줄 확보
                current_error_line = ""
                for line in reversed(lines):
                    if "ERROR" in line:
                        current_error_line = line.strip()
                        break
                
                # 새로운 에러가 발견되었을 때만 AI 분석 실행
                if current_error_line and current_error_line != last_detected_error:
                    print(f"🚨 실시간 장애 감지 성공: {current_error_line}")
                    last_detected_error = current_error_line
                    
                    # AI 분석 실행 및 결과 저장
                    result = analyze_log_with_gemini(current_error_line)
                    latest_diagnosis = {"analysis": result}
                    
        except Exception as e:
            print(f"Watcher Error: {e}")

# 6. 서버 시작 시 감시 엔진 자동 실행
@app.on_event("startup")
async def startup_event():
    print("🚀 LogDoctor 감시 엔진 시작 중...")
    asyncio.create_task(log_watcher())

# 7. API 엔드포인트
@app.get("/")
def read_root():
    api_key = os.getenv("GEMINI_API_KEY")
    return {"status": "Online", "api_key_configured": bool(api_key)}

@app.get("/api/status")
async def get_status():
    return {"status": "Online", "critical_issues": 1, "uptime": "running"}

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

@app.post("/analyze")
def analyze_log(log_data: dict):
    log_content = log_data.get("content", "")
    if not log_content: return {"error": "내용 없음"}
    return {"analysis": analyze_log_with_gemini(log_content)}

# 7-1. 데이터 규격 정의 (인프라 표준화)
class AnalysisRequest(BaseModel):
    content: str

# 7-2. API 엔드포인트 수정
@app.post("/analyze")
async def analyze_log(request: AnalysisRequest):
    # 이제 request.content로 안전하게 접근 가능합니다.
    if not request.content: 
        return {"analysis": "분석할 내용이 없습니다."}
    
    try:
        report = analyze_log_with_gemini(request.content)
        return {"analysis": report}
    except Exception as e:
        return {"analysis": f"백엔드 처리 중 오류 발생: {str(e)}"}