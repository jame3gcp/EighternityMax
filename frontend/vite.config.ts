import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // 외부 네트워크 접근 허용
    port: 5173,
    strictPort: false, // 포트가 사용 중이면 다른 포트 사용
  },
})
