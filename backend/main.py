from fastapi import FastAPI
import os
from dotenv import load_dotenv

# 1. 환경 변수를 가장 먼저 로드하여 시스템 메모리에 올린다.
load_dotenv()

# 2. 그 다음, 로드된 환경 변수를 사용할 분석 모듈을 가져온다.
from analyzer import analyze_log_with_gemini 

app = FastAPI()

@app.get("/")
def read_root():
    # 서버 상태 및 API 키 로드 여부 확인용 (Health Check)
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return {"status": "success", "api_key_found": api_key[:4] + "****"}
    return {"status": "fail", "message": "API Key not found in .env"}

@app.post("/analyze")
def analyze_log(log_data: dict):
    # 안전하게 로그 데이터 추출
    log_content = log_data.get("content", "")
    
    if not log_content:
        return {"error": "로그 내용이 비어 있습니다."}
    
    # analyzer.py의 함수를 호출하여 AI 분석 결과를 반환
    result = analyze_log_with_gemini(log_content)
    return {"analysis": result}