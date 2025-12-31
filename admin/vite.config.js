import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/admin-panel/',
    server: {
        port: 5174, // Different port from client
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
    resolve: {
        alias: {
            qrcode: path.resolve(__dirname, 'node_modules/qrcode')
        }
    }
});
