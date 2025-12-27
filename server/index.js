import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Initialize database (must happen before routes)
import { initDatabase } from './database.js';

// Import routes
import authRoutes from './routes/auth.js';
import pointsRoutes, { setBroadcast as setPointsBroadcast } from './routes/points.js';
import settingsRoutes, { setBroadcast as setSettingsBroadcast } from './routes/settings.js';
import adminRoutes from './routes/admin.js';

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        name: 'NestFinder API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
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
