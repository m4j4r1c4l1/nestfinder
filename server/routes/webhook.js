import express from 'express';
import crypto from 'crypto';
import { run, get } from '../database.js';
import { calculateDevMetrics } from '../utils/devMetrics.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const router = express.Router();

// Broadcast function (injected from index.js for real-time updates)
let broadcast = () => { };
export const setBroadcast = (fn) => { broadcast = fn; };

// Verify GitHub webhook signature
const verifySignature = (req, secret) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
        return false;
    }
};

// GitHub webhook endpoint for push events
router.post('/github', async (req, res) => {
    const payload = req.body;

    // Dev-only override
    if (payload.simulate) {
        const mockMetrics = {
            commits: payload.commits || 900,
            components: payload.components || 50,
            loc: payload.loc || 25000,
            files: payload.files || 100,
            apiEndpoints: payload.apiEndpoints || 80,
            socketEvents: payload.socketEvents || 20,
            lastCommit: 'SIM-001'
        };

        broadcast({
            type: 'commit-update',
            data: {
                lastCommit: 'TEST-001',
                lastCommitMessage: 'Update verification',
                lastCommitAuthor: 'System',
                lastCommitTime: new Date().toISOString(),
                commits: mockMetrics.commits,
                devMetrics: mockMetrics
            }
        });
        return res.json({ success: true });
    }

    const secret = process.env.NEST_HOOK;

    // Verify the webhook secret
    if (secret && !verifySignature(req, secret)) {
        console.warn('GitHub webhook: Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if this is a push event
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
        return res.json({ message: `Ignoring event: ${event}` });
    }

    try {
        // Extract commit info from payload
        const commits = payload.commits?.length || 0;
        const headCommit = payload.head_commit || payload.commits?.[0];
        const lastCommitHash = headCommit?.id?.substring(0, 7) || '-';
        const lastCommitMessage = headCommit?.message?.split('\n')[0] || '';
        const lastCommitAuthor = headCommit?.author?.name || 'Unknown';
        const lastCommitTime = headCommit?.timestamp || new Date().toISOString();
        const totalCommits = payload.repository?.size || 0; // Not actual commit count

        // Get current total from GitHub API info in payload or use existing
        const ref = payload.ref || 'refs/heads/master';
        const branch = ref.replace('refs/heads/', '');

        // Recalculate full dev metrics
        const fullDevMetrics = await calculateDevMetrics(rootDir);
        // Ensure the latest commit from webhook is reflected even if git lag occurs
        fullDevMetrics.lastCommit = lastCommitHash;

        // Store in database (Update with actual calculated count to prevent inflation)
        run(`
            INSERT OR REPLACE INTO dev_metrics (
                id, last_commit_hash, last_commit_message, last_commit_author, 
                last_commit_time, total_commits, updated_at
            ) VALUES (
                1, ?, ?, ?, ?, ?, datetime('now')
            )
        `, [lastCommitHash, lastCommitMessage, lastCommitAuthor, lastCommitTime, fullDevMetrics.commits]);

        console.log(`GitHub webhook: Received push with ${commits} commits. Latest: ${lastCommitHash}. Persistent total: ${fullDevMetrics.commits}`);

        // Broadcast real-time update to connected admin clients
        broadcast({
            type: 'commit-update',
            data: {
                lastCommit: lastCommitHash,
                lastCommitMessage,
                lastCommitAuthor,
                lastCommitTime,
                commits,
                devMetrics: fullDevMetrics
            }
        });

        res.json({
            success: true,
            commits_received: commits,
            last_commit: lastCommitHash,
            actual_total: fullDevMetrics.commits
        });
    } catch (err) {
        console.error('GitHub webhook error:', err);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// Get stored dev metrics (called by admin stats)
router.get('/dev-metrics', (req, res) => {
    try {
        const metrics = get('SELECT * FROM dev_metrics WHERE id = 1');
        res.json(metrics || { total_commits: 0, last_commit_hash: '-' });
    } catch (err) {
        res.json({ total_commits: 0, last_commit_hash: '-' });
    }
});

export default router;
