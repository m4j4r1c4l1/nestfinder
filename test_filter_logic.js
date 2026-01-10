
const fs = require('fs');
const path = require('path');
const initSqlJs = require('./server/node_modules/sql.js');

const DB_PATH = path.join(__dirname, 'server', 'db', 'nestfinder.db');

async function runCheck() {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);

    // 1. Fetch Broadcasts (Simulate API)
    const broadcastsStatements = db.prepare("SELECT * FROM broadcasts");
    const broadcasts = [];
    while (broadcastsStatements.step()) {
        broadcasts.push(broadcastsStatements.getAsObject());
    }
    broadcastsStatements.free();

    console.log(`Fetched ${broadcasts.length} broadcasts from DB.`);

    // 2. Define Filter Logic (Copied from Messages.jsx)
    const searchFilters = {
        searchText: '',
        status: 'all',
        priority: '',
        maxViews: '',
        startDate: null,
        endDate: null
    };

    const filteredBroadcasts = broadcasts.filter(b => {
        const now = new Date();
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);

        // Text Search Filter (title or message)
        if (searchFilters.searchText) {
            const searchLower = searchFilters.searchText.toLowerCase();
            const titleMatch = (b.title || '').toLowerCase().includes(searchLower);
            const messageMatch = (b.message || '').toLowerCase().includes(searchLower);
            if (!titleMatch && !messageMatch) return false;
        }

        // Status Filter
        if (searchFilters.status !== 'all') {
            const isActive = now >= start && now <= end;
            const isPast = now > end;
            const isScheduled = now < start;

            if (searchFilters.status === 'active' && !isActive) return false;
            if (searchFilters.status === 'inactive' && !isPast) return false;
            if (searchFilters.status === 'scheduled' && !isScheduled) return false;
        }

        if (searchFilters.priority && b.priority != searchFilters.priority) return false;
        if (searchFilters.maxViews && b.max_views != searchFilters.maxViews) return false;

        if (searchFilters.startDate && new Date(b.start_time) < searchFilters.startDate) return false;
        if (searchFilters.endDate && new Date(b.end_time) > searchFilters.endDate) return false;

        return true;
    });

    console.log(`Filtered Count: ${filteredBroadcasts.length}`);

    // Check specifics
    broadcasts.forEach(b => {
        const passed = filteredBroadcasts.find(fb => fb.id === b.id);
        if (!passed) {
            console.log(`[FAILED] Broadcast ID ${b.id} was filtered out!`);
            console.log('Reason analysis:');
            // Re-run checks to debug
        } else {
            // console.log(`[PASS] Broadcast ID ${b.id}`);
        }
    });

    // 3. Simulate Pagination
    const page = 1;
    const pageSize = 50;
    const paginated = filteredBroadcasts.slice((page - 1) * pageSize, page * pageSize);
    console.log(`Paginated Count (Page 1): ${paginated.length}`);

}

runCheck();
