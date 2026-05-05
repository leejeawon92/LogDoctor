from fastapi import FastAPI
import os
from dotenv import load_dotenv
# 브라우저 보안 정책(CORS)을 허용하여 프론트엔드와 통신하기 위해 필수적인 모듈
from fastapi.middleware.cors import CORSMiddleware

# .env 파일에 저장된 GEMINI_API_KEY 등의 환경 변수를 읽어오기 위함
load_dotenv()

# 로그 분석의 핵심 로직인 AI 모델 호출 함수를 가져온다
from analyzer import analyze_log_with_gemini 

app = FastAPI()

# React(5173 포트)에서 FastAPI(8000 포트)로의 API 요청을 허용하기 위한 설정
origins = [
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # 허용된 도메인 리스트를 설정
    allow_credentials=True,    # 쿠키 등 인증 정보 포함을 허용
    allow_methods=["*"],       # GET, POST 등 모든 전송 방식을 허용
    allow_headers=["*"],       # 모든 HTTP 헤더 요청을 허용
)

LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", r"C:\LogDoctor\logs\server.log")

@app.get("/")
def read_root():
    # 서버 구동 여부와 API 키 설정 상태를 빠르게 확인하기 위한 기본 경로
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return {"status": "success", "api_key_found": api_key[:4] + "****"}
    return {"status": "fail", "message": "API Key not found in .env"}

# --- [신규 추가] 시스템 상태 확인 엔드포인트 ---
@app.get("/api/status")
async def get_status():
    # 대시보드 우측 상단의 'System: Offline'을 'Online'으로 바꾸기 위함
    # 현재 서버가 살아있음을 알리는 시스템 상태와 발견된 이슈 개수를 반환
    return {
        "status": "Online",
        "critical_issues": 1,  # 테스트를 위해 1개로 설정
        "uptime": "running"
    }

@app.get("/api/logs")
async def get_logs():
    # [Why] 기존 하드코딩된 리스트[cite: 1] 대신 실제 파일을 읽어 처리합니다.
    # [What] server.log 파일의 마지막 10줄을 읽어 대시보드 형식에 맞춰 반환합니다.
    if not os.path.exists(LOG_FILE_PATH):
        return []

    logs = []
    try:
        with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()[-10:] # 마지막 10줄 추출
            for line in lines:
                if ":" in line:
                    # 로그 형식 가정: [2026-05-05] LEVEL: Message
                    parts = line.split(" ", 2)
                    logs.append({
                        "timestamp": parts[0].strip("[]"),
                        "level": parts[1].replace(":", ""),
                        "message": parts[2].strip()
                    })
    except Exception as e:
        print(f"Error reading log: {e}")
        
    return logs

@app.post("/analyze")
def analyze_log(log_data: dict):
    # 프론트엔드에서 보낸 로그를 Gemini AI에게 전달하여 분석 결과를 받는다
    log_content = log_data.get("content", "")
    
    if not log_content:
        return {"error": "로그 내용이 비어 있습니다."}
    
    # analyzer.py의 분석 함수를 호출하고 결과를 리턴
    result = analyze_log_with_gemini(log_content)
    return {"analysis": result}