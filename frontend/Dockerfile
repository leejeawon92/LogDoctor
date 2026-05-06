# Node.js 20 경량 버전(alpine) 이미지를 베이스로 사용
FROM node:20-alpine

# 컨테이너 내 작업 디렉토리를 /app으로 설정
WORKDIR /app

# 의존성 정의 파일(package.json) 복사 및 패키지 설치
COPY package*.json ./
RUN npm install

# 프런트엔드 소스 코드 전체를 컨테이너 내부로 복사
COPY . .

# Vite 기본 포트인 5173번을 노출
EXPOSE 5173

# Vite 개발 서버 실행 
# --host 0.0.0.0 옵션이 있어야 Docker 외부(Windows 브라우저)에서 접속 가능
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]