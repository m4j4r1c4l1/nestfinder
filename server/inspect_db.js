
import { getDb, all, initDatabase } from './database.js';

await initDatabase();
const db = getDb();

try {
    const broadcasts = all('SELECT id, title, (SELECT COUNT(*) FROM broadcast_views WHERE broadcast_id = broadcasts.id) as computed_views FROM broadcasts');
    console.log('--- Broadcasts ---');
    console.table(broadcasts);

    const views = all('SELECT id, broadcast_id, user_id, status FROM broadcast_views');
    console.log('\n--- Broadcast Views ---');
    console.table(views);

    // Check types
    if (broadcasts.length > 0) {
        console.log('\nBroadcast ID type:', typeof broadcasts[0].id);
    }
    if (views.length > 0) {
        console.log('View Broadcast ID type:', typeof views[0].broadcast_id);
    }

} catch (e) {
    console.error(e);
}
