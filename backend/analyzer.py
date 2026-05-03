import google.generativeai as genai
import os

def analyze_log_with_gemini(log_text):
    # .env에서 로드된 API 키를 설정합니다.
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    # 모델 설정 (Gemini Pro 사용)
    model = genai.GenerativeModel('gemini-pro')
    
    # AI에게 전달할 프롬프트 구성
    prompt = f"당신은 숙련된 인프라 엔지니어입니다. 다음 서버 로그를 분석하여 장애 원인과 해결책을 요약해 주세요: \n\n{log_text}"
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"분석 중 오류 발생: {str(e)}"