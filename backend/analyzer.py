from google import genai
import os

def analyze_log_with_gemini(log_text):
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        return "분석 실패: 환경 변수에서 GEMINI_API_KEY를 찾을 수 없습니다."

    client = genai.Client(api_key=api_key)
    
    prompt = f"당신은 숙련된 인프라 엔지니어입니다. 다음 로그를 분석하고 해결책을 제시하세요: \n\n{log_text}"
    
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"분석 오류 상세: {str(e)}"