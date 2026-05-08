import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Vite의 파일 감시 방식을 폴링 방식으로 강제
  // Windows 도커 환경에서 파일 변경 신호가 누락되는 문제를 해결하여, 재시작 없이도 실시간 반영(HMR)이 되게 하기 위함
  server: {
    watch: {
      usePolling: true,
    },
    host: '0.0.0.0', // 도커 외부 접속 허용 [cite: 1062]
  },
})