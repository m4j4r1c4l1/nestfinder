import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'favicon.ico', 'icons/*.png'],
            manifest: {
                name: 'NestFinder',
                short_name: 'NestFinder',
                description: 'Finding nests for those without one - Track and coordinate homeless assistance locations',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                navigateFallbackDenylist: [/^\/admin-panel/], // Don't intercept admin panel requests
                runtimeCaching: [
                    {
                        // OSM Tile caching - increased for offline areas
                        urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'osm-tiles',
                            expiration: {
                                maxEntries: 2000, // Increased for offline areas
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        // API Points caching - stale while revalidate for offline access
                        urlPattern: /\/api\/points/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-points',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            networkTimeoutSeconds: 3 // Fallback to cache if slow
                        }
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
});
