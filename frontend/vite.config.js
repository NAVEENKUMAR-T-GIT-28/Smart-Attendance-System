import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/Smart-Attendance-System/",

  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'lorna-featureless-anastasia.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
      },
    },
  },
});