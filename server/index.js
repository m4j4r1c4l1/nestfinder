import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database (must happen before routes)
import { initDatabase } from './database.js';

// Import routes
import authRoutes from './routes/auth.js';
import pointsRoutes, { setBroadcast as setPointsBroadcast } from './routes/points.js';
import settingsRoutes, { setBroadcast as setSettingsBroadcast } from './routes/settings.js';
import adminRoutes, { setBroadcast as setAdminBroadcast } from './routes/admin.js';
import notificationsRoutes, { setBroadcast as setNotificationsBroadcast } from './routes/notifications.js';
import webhookRoutes, { setBroadcast as setWebhookBroadcast } from './routes/webhook.js';
import debugRoutes from './routes/debug.js';

const app = express();
// Enable trust proxy for Render/load balancers
app.set('trust proxy', 1);
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });
app.set('wss', wss);
const clients = new Set();

// Rate limit broadcasting updates as multiple connects/disconnects can happen quickly
let broadcastTimeout = null;
const broadcastClientsUpdate = () => {
    if (broadcastTimeout) return;
    broadcastTimeout = setTimeout(() => {
        broadcastTimeout = null;
        broadcast({
            type: 'clients-update',
            count: clients.size,
            timestamp: Date.now()
        });
    }, 1000); // Debounce updates to 1s
};

import { getSystemStats } from './utils/systemStats.js';

// Broadcast System Stats every 5 seconds
setInterval(async () => {
    // Only broadcast if there are clients connected
    if (clients.size > 0) {
        const stats = await getSystemStats();
        broadcast({
            type: 'system-status',
            data: stats,
            clientCount: clients.size // Redundant but useful sync
        });
    }
}, 5000);

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total:', clients.size);

    // Send current count immediately to the new client
    ws.send(JSON.stringify({
        type: 'clients-update',
        count: clients.size,
        timestamp: Date.now()
    }));

    // Also broadcast to all other clients
    broadcastClientsUpdate();

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total:', clients.size);
        broadcastClientsUpdate();
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Handle Admin Capture Request
            if (data.type === 'capture_request') {
                console.log(`[WS] Admin requested screenshot for user: ${data.userId}`);
                // Broadcast to all clients (client will filter by ID)
                broadcast(data);
            }
        } catch (e) {
            console.error('Failed to parse WS message:', e);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
        broadcastClientsUpdate();
    });
});

// Broadcast function to send updates to all connected clients
const broadcast = (data) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
            client.send(message);
        }
    });
};

// Inject broadcast function into routes
setPointsBroadcast(broadcast);
setSettingsBroadcast(broadcast);
setWebhookBroadcast(broadcast);
setAdminBroadcast(broadcast);
setNotificationsBroadcast(broadcast);

// Import rate limiters
import { apiLimiter } from './middleware/rateLimiter.js';

// Middleware
// CORS - restrict origins in production
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://m4j4r1c4l1.github.io',
        'https://nestfinder-sa1g.onrender.com',
        process.env.CORS_ORIGIN // Allow custom origin from env
    ].filter(Boolean)
    : true; // Allow all in development

app.use(cors(allowedOrigins === true ? {} : { origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// Global API rate limiter - 120 requests/min per IP
app.use('/api', (req, res, next) => {
    // Exempt polling and admin endpoints from rate limiting
    const isExempt = req.path === '/points/broadcast/active' ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/push/admin');

    if (isExempt) {
        return next();
    }
    apiLimiter(req, res, next);
});

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', notificationsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/debug', debugRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // 1. Serve Client (Public App)
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // 2. Serve Admin Dashboard
    app.use('/admin-panel', express.static(path.join(__dirname, '../admin/dist')));

    // Handle React routing for Admin
    // Handle React routing for Admin
    app.get(['/admin-panel', '/admin-panel/*'], (req, res) => {
        res.sendFile(path.join(__dirname, '../admin/dist', 'index.html'));
    });

    // Handle React routing for Client (catch-all must be last)
    app.get('*', (req, res) => {
        // Don't intercept API requests
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    });
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        name: 'NestFinder API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from client dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all non-API requests to React app
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server after database is ready
const PORT = process.env.PORT || 3001;

// Import helpers to load settings on startup
import { getSettings } from './database.js';
import { updateLimitConfig } from './middleware/rateLimiter.js';

initDatabase().then(() => {
    // Load initial rate limits
    const settings = getSettings();
    updateLimitConfig(settings);

    server.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🪹 NestFinder API Server                            ║
║   Finding Nests ❤️ Bringing Relief                    ║
║                                                       ║
║   HTTP:      http://localhost:${PORT}                   ║
║   WebSocket: ws://localhost:${PORT}                     ║
║                                                       ║
║   Endpoints:                                          ║
║   • GET  /api/health       - Health check             ║
║   • POST /api/auth/register - Register user           ║
║   • GET  /api/points       - List points              ║
║   • POST /api/points       - Submit point             ║
║   • GET  /api/settings     - Get settings             ║
║                                                       ║
║   Admin: POST /api/auth/admin/login                   ║
║   Default: admin / admin123                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
