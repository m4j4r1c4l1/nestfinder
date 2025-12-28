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
import adminRoutes from './routes/admin.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total:', clients.size);

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
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

// Middleware
app.use(cors());
app.use(express.json());

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

initDatabase().then(() => {
    server.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🐦 NestFinder API Server                            ║
║   Finding nests for those without one                 ║
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
