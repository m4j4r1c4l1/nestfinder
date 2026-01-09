import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { get } from '../database.js';

const execAsync = promisify(exec);

const countCodeStats = (dirPath) => {
    let stats = { files: 0, lines: 0, components: 0, apiEndpoints: 0, socketEvents: 0 };

    if (!fs.existsSync(dirPath)) return stats;

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (['node_modules', '.git', 'dist', 'build', '.vite', 'coverage'].includes(file)) continue;

        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            const subStats = countCodeStats(fullPath);
            stats.files += subStats.files;
            stats.lines += subStats.lines;
            stats.components += subStats.components;
            stats.apiEndpoints += subStats.apiEndpoints;
            stats.socketEvents += subStats.socketEvents;
        } else if (stat.isFile()) {
            if (/\.(js|jsx|ts|tsx|css|scss|html)$/.test(file)) {
                stats.files++;
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    stats.lines += content.split('\n').length;

                    if (/\.(js|jsx|ts|tsx)$/.test(file)) {
                        // Additive detection: sum all occurrences of all patterns
                        const apiPatterns = [/router\.(get|post|put|delete|patch)/g];
                        apiPatterns.forEach(p => {
                            const matches = content.match(p);
                            if (matches) stats.apiEndpoints += matches.length;
                        });

                        const socketPatterns = [
                            /socket\.(on|emit)\(/g,
                            /io\.on\(/g,
                            /useWebSocket\(/g,
                            /ws\.on\(/g,
                            /broadcast\(/g
                        ];
                        socketPatterns.forEach(p => {
                            const matches = content.match(p);
                            if (matches) stats.socketEvents += matches.length;
                        });
                    }
                } catch (e) { /* ignore */ }
            }
            if (/\.(jsx|tsx)$/.test(file)) {
                stats.components++;
            }
        }
    }
    return stats;
};

export const calculateDevMetrics = async (rootDir) => {
    let devMetrics = { commits: 0, components: 0, loc: 0, files: 0, apiEndpoints: 0, socketEvents: 0 };

    // Attempt to get live git data first (most accurate for local/non-shallow)
    let gitSucceeded = false;
    try {
        const { stdout: isShallowRaw } = await execAsync('git rev-parse --is-shallow-repository', { cwd: rootDir });
        const isShallow = isShallowRaw.trim() === 'true';

        if (!isShallow) {
            const { stdout: count } = await execAsync('git rev-list --count HEAD', { cwd: rootDir });
            devMetrics.commits = parseInt(count.trim(), 10);
            const { stdout: hash } = await execAsync('git rev-parse --short HEAD', { cwd: rootDir });
            devMetrics.lastCommit = hash.trim();
            gitSucceeded = true;
        }
    } catch (e) {
        // Git failed or not available
    }

    // 1. If Git failed OR is shallow, attempt GitHub API Fallback (Best for Render)
    if (!gitSucceeded || !devMetrics.commits) {
        const headers = { 'User-Agent': 'nestfinder-admin' };
        const token = process.env.GITHUB_TOKEN || process.env.NEST_TRACKER;
        if (token) headers['Authorization'] = `token ${token}`;

        try {
            // per_page=1 and Rel=Last trick to get total count
            const response = await fetch('https://api.github.com/repos/m4j4r1c4l1/nestfinder/commits?per_page=1', { headers });
            if (response.ok) {
                const linkHeader = response.headers.get('Link');
                if (linkHeader) {
                    const links = linkHeader.split(',');
                    const lastLink = links.find(link => link.includes('rel="last"'));
                    if (lastLink) {
                        const match = lastLink.match(/[?&]page=(\d+)/);
                        if (match) devMetrics.commits = parseInt(match[1], 10);
                    }
                }
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    if (!devMetrics.commits) devMetrics.commits = data.length;
                    devMetrics.lastCommit = data[0].sha.substring(0, 7);
                }
                if (devMetrics.commits > 0) gitSucceeded = true;
            }
        } catch (e) {
            console.error('GitHub API metrics fallback failed:', e.message);
        }
    }

    try {
        // 2. If Git and API both failed, fallback to stored metrics (Last resort, might be stale)
        if (!gitSucceeded) {
            const storedMetrics = get('SELECT * FROM dev_metrics WHERE id = 1');
            if (storedMetrics && storedMetrics.total_commits > 0) {
                devMetrics.commits = storedMetrics.total_commits;
                devMetrics.lastCommit = storedMetrics.last_commit_hash || '-';
            }
        }

        // 3. Code Stats
        const clientStats = countCodeStats(path.join(rootDir, 'client/src'));
        const adminStats = countCodeStats(path.join(rootDir, 'admin/src'));
        const serverStats = countCodeStats(path.join(rootDir, 'server'));

        devMetrics.components = (clientStats.components || 0) + (adminStats.components || 0);
        devMetrics.loc = (clientStats.lines || 0) + (adminStats.lines || 0) + (serverStats.lines || 0);
        devMetrics.files = (clientStats.files || 0) + (adminStats.files || 0) + (serverStats.files || 0);
        devMetrics.apiEndpoints = (clientStats.apiEndpoints || 0) + (adminStats.apiEndpoints || 0) + (serverStats.apiEndpoints || 0);
        devMetrics.socketEvents = (clientStats.socketEvents || 0) + (adminStats.socketEvents || 0) + (serverStats.socketEvents || 0);

    } catch (err) {
        console.error('Dev metrics calculation failed:', err);
    }

    return devMetrics;
};
