import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Vercel builds 배포 시 출력이 /frontend/ 아래에 있으므로 base 설정
  base: process.env.NODE_ENV === 'production' ? '/frontend/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 127.0.0.1 사용 시 네트워크 인터페이스 조회를 피해 sandbox/제한 환경에서 안정적 동작
    host: process.env.VITE_DEV_HOST === 'all' ? '0.0.0.0' : '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
