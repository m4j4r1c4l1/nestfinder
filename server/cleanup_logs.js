import { initDatabase, run, get, saveDatabase } from './database.js';

const cleanup = async () => {
    try {
        await initDatabase();

        console.log('Cleaning up orphaned notification logs...');

        // Count orphaned logs (logs with target_id that don't satisfy existence in notifications table)
        // We only care about action='notification_sent'
        const countQuery = `
            SELECT COUNT(*) as count 
            FROM logs 
            WHERE action = 'notification_sent' 
            AND target_id NOT IN (SELECT DISTINCT batch_id FROM notifications WHERE batch_id IS NOT NULL)
        `;

        const before = get(countQuery);
        console.log(`Found ${before ? before.count : 0} orphaned log entries.`);

        if (before && before.count > 0) {
            const deleteQuery = `
                DELETE FROM logs 
                WHERE action = 'notification_sent' 
                AND target_id NOT IN (SELECT DISTINCT batch_id FROM notifications WHERE batch_id IS NOT NULL)
             `;
            run(deleteQuery);
            console.log('Cleanup completed.');

            saveDatabase();
        } else {
            console.log('No orphaned entries found.');
        }

    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanup();
