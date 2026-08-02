import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Step 6 Debug: Verify process.cwd()
console.log('[Vite Config Debug] process.cwd():', process.cwd());

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  console.log('[Vite Config Debug] Loaded Env Keys:', Object.keys(env));

  return {
    plugins: [react(), tailwindcss()],
    envDir: process.cwd(),
    envPrefix: ['VITE_'],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        }
      }
    }
  };
})
