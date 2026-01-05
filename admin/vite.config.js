import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/admin-panel/',
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    leaflet: ['leaflet', 'react-leaflet'],
                    charts: ['chart.js', 'react-chartjs-2']
                }
            }
        }
    },
    server: {
        port: 5174, // Different port from client
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
});
