// Offline Queue using localStorage (simple, works everywhere)
const OFFLINE_QUEUE_KEY = 'nestfinder_offline_queue';

export const getOfflineQueue = () => {
    try {
        const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (e) {
        console.error('Failed to read offline queue', e);
        return [];
    }
};

export const addToOfflineQueue = (action) => {
    const queue = getOfflineQueue();
    queue.push({
        ...action,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return queue;
};

export const removeFromOfflineQueue = (id) => {
    const queue = getOfflineQueue().filter(item => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return queue;
};

export const clearOfflineQueue = () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

// Sync offline queue when back online
export const syncOfflineQueue = async (api) => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        try {
            switch (item.type) {
                case 'submit_point':
                    await api.submitPoint(item.data);
                    break;
                case 'confirm_point':
                    await api.confirmPoint(item.data.id);
                    break;
                case 'deactivate_point':
                    await api.deactivatePoint(item.data.id);
                    break;
                default:
                    console.warn('Unknown offline action type:', item.type);
            }
            removeFromOfflineQueue(item.id);
            synced++;
        } catch (error) {
            console.error('Failed to sync offline action:', item, error);
            failed++;
        }
    }

    return { synced, failed };
};

// Check if online
export const isOnline = () => navigator.onLine;

// Listen for online/offline events
export const addConnectivityListeners = (onOnline, onOffline) => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
};
