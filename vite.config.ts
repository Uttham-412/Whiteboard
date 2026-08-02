import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Step 6 Debug: Verify process.cwd()
console.log('[Vite Config Debug] process.cwd():', process.cwd());

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const targetApi = env.VITE_API_URL || 'https://whiteboard-backend-10ji.onrender.com';
  const targetWs = targetApi.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');

  return {
    plugins: [react(), tailwindcss()],
    envDir: process.cwd(),
    envPrefix: ['VITE_'],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: targetApi,
          changeOrigin: true,
        },
        '/ws': {
          target: targetWs,
          ws: true,
        }
      }
    }
  };
})
