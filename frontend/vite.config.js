import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // allow external connections
        port: 5173,
        allowedHosts: [
            'lorna-featureless-anastasia.ngrok-free.dev'
        ],
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
            },
        },
    },
});
