import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Vite no carga las variables de entorno de Node automáticamente en la raíz,
  // pero podemos usar process.env si las inyectamos mediante Docker/Vite.
  const backendUrl = process.env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/fotos': {
          target: backendUrl,
          changeOrigin: true,
        }
      }
    }
  }
})
