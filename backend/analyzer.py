from google import genai
import os

def analyze_log_with_gemini(log_text):
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        return "분석 실패: 환경 변수에서 GEMINI_API_KEY를 찾을 수 없습니다."

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    다음 로그를 분석하여 '원인'과 '조치방법'만 핵심 위주로 요약해서 답하세요.
    
    [출력 규칙]
    1. 마크다운 기호(**, ###, #, *)는 절대 사용하지 마십시오.
    2. 불필요한 인사말이나 서론은 모두 생략하고 본론만 말하십시오.
    3. 단계별 조치사항은 '1., 2.' 와 같이 숫자로만 구분하십시오.
    4. 전문적인 기술 용어는 유지하되, 문장은 간결하게 작성하십시오.

    분석할 로그:
    {log_text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt
        )
        return response.text
    except Exception as e:
        # 에러 발생 시 사용자에게 노출되는 메시지를 정돈
        if "429" in str(e):
            return "오늘의 AI 진단 할당량을 모두 소진했습니다. 내일 다시 시도해주세요."
        return f"분석 중 오류 발생: {str(e)}"