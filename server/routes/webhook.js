import express from 'express';
import crypto from 'crypto';
import { run, get } from '../database.js';

const router = express.Router();

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
router.post('/github', (req, res) => {
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

    const payload = req.body;

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

        // Store in database
        run(`
            INSERT OR REPLACE INTO dev_metrics (
                id, last_commit_hash, last_commit_message, last_commit_author, 
                last_commit_time, total_commits, updated_at
            ) VALUES (
                1, ?, ?, ?, ?, 
                COALESCE((SELECT total_commits FROM dev_metrics WHERE id = 1), 0) + ?,
                datetime('now')
            )
        `, [lastCommitHash, lastCommitMessage, lastCommitAuthor, lastCommitTime, commits]);

        console.log(`GitHub webhook: Received push with ${commits} commits. Latest: ${lastCommitHash}`);

        res.json({
            success: true,
            commits_received: commits,
            last_commit: lastCommitHash
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
