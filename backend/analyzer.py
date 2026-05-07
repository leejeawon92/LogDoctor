from google import genai
import os

def analyze_log_with_gemini(log_text):
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        return "분석 실패: 환경 변수에서 GEMINI_API_KEY를 찾을 수 없습니다."

    client = genai.Client(api_key=api_key)
    
    # AI에게 전달할 페르소나와 출력 형식을 정의
    # 엔지니어가 즉각 판단할 수 있도록 [현상/원인/조치/위험도] 규격을 강제하기 위함
    prompt = f"""
    다음 로그를 분석하여 반드시 아래 4가지 섹션으로 구분하여 답하십시오.
    
    [출력 양식]
    1. [현상]: 어떤 에러가 발생했는지 한 줄로 요약
    2. [원인]: 에러가 발생한 기술적인 원인 분석
    3. [조치방법]: 해결을 위해 실행해야 할 단계별 가이드 (숫자로 구분)
    4. [위험도]: Low, Medium, High 중 하나를 선택하고 이유 설명

    [출력 규칙]
    - 마크다운 기호(**, ###, #, *)는 절대 사용하지 마십시오.
    - 불필요한 인사말이나 서론은 모두 생략하십시오.
    - 전문 용어는 유지하되 문장은 간결하게 작성하십시오.

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
        error_msg = str(e)
        if "503" in error_msg:
            return "현재 구글 AI 서버 부하가 높습니다. 잠시 후 'AI 진단 실행' 버튼을 다시 눌러주세요."
        return f"분석 중 오류 발생: {error_msg}"