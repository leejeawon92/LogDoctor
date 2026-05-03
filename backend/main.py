from fastapi import FastAPI
import os
from dotenv import load_dotenv

# .env 파일을 읽어옵니다.
load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    # 환경 변수에서 키를 가져옵니다.
    api_key = os.getenv("GEMINI_API_KEY")
    
    # 키가 존재하면 앞의 4자리만 살짝 보여줍니다. (보안상 전체 출력 금지)
    if api_key:
        masked_key = api_key[:4] + "****"
        return {"status": "success", "api_key_found": masked_key}
    else:
        return {"status": "fail", "message": "API Key not found"}