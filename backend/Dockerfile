# 인프라 최적화를 위해 불필요한 패키지를 제거한 경량 데비안 환경 선택
FROM python:3.11-slim

# 작업 디렉토리를 /app으로 고정(컨테이너 내부의 파일 구조를 체계화하여 관리하기 위함)
WORKDIR /app


# 소스 코드 수정 시에도 pip install 단계가 캐싱되어 빌드 속도가 빨라짐
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 실제 FastAPI 로직(main.py 등)을 이미지 내에 포함
COPY . .

# 8000번 포트 노출(FastAPI 서버가 외부(호스트 및 프론트엔드)와 통신할 통로 확보)
EXPOSE 8000

# uvicorn으로 서버 실행(--host 0.0.0.0 설정을 통해 컨테이너 외부 인터페이스의 접근을 허용)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]