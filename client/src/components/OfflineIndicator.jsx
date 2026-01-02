import React, { useState, useEffect } from 'react';
import { isOnline, addConnectivityListeners, getOfflineQueue } from '../utils/offline';

const OfflineIndicator = () => {
    const [online, setOnline] = useState(isOnline());
    const [queueCount, setQueueCount] = useState(getOfflineQueue().length);

    useEffect(() => {
        const cleanup = addConnectivityListeners(
            () => {
                setOnline(true);
                setQueueCount(getOfflineQueue().length);
            },
            () => {
                setOnline(false);
            }
        );

        // Check queue periodically
        const interval = setInterval(() => {
            setQueueCount(getOfflineQueue().length);
        }, 5000);

        return () => {
            cleanup();
            clearInterval(interval);
        };
    }, []);

    if (online && queueCount === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 'var(--space-2)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            backdropFilter: 'blur(10px)',
            background: online
                ? 'rgba(34, 197, 94, 0.9)' // Green when syncing
                : 'rgba(239, 68, 68, 0.9)', // Red when offline
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            {online ? (
                <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                    Syncing {queueCount} pending...
                </>
            ) : (
                <>
                    <span>📡</span>
                    Offline Mode
                    {queueCount > 0 && ` (${queueCount} queued)`}
                </>
            )}
        </div>
    );
};

export default OfflineIndicator;
