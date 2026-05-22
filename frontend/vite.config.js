import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: env.USE_LOCAL_SERVER === 'true' ? 'http://localhost:3000' : 'https://2-12.ngho.dev',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.USE_LOCAL_SERVER === 'true' ? 'http://localhost:3000' : 'https://2-12.ngho.dev',
          changeOrigin: true,
        }
      }
    }
  }
})
