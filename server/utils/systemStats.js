import os from 'os';
import { get } from '../database.js';

export const getSystemStats = async () => {
    // 1. Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.round((usedMem / totalMem) * 100);

    // 2. CPU Load (1 minute average)
    // os.loadavg() returns [1m, 5m, 15m]
    // Windows doesn't always report loadavg correctly, fallback to calculation if needed
    const loadAvg = os.loadavg();
    const cpuLoad = loadAvg && loadAvg.length > 0 ? loadAvg[0].toFixed(2) : 0;

    // 3. Uptime
    const uptime = os.uptime(); // System uptime in seconds

    // 4. DB Health Check
    let dbStatus = 'Unknown';
    try {
        const result = await new Promise((resolve) => {
            const res = get('SELECT 1 as health');
            resolve(res);
        });
        dbStatus = result && result.health === 1 ? 'Healthy' : 'Error';
    } catch (e) {
        dbStatus = 'Error';
        console.error('DB Health Check Failed:', e);
    }

    return {
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usage: memUsage
        },
        cpu: {
            load: cpuLoad
        },
        uptime: uptime,
        db: dbStatus,
        timestamp: Date.now()
    };
};
