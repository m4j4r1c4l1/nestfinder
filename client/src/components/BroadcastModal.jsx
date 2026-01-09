import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const SEEN_BROADCASTS_KEY = 'nestfinder_seen_broadcasts';

const BroadcastModal = ({ isSettled = false }) => {
    const [broadcast, setBroadcast] = useState(null);
    const [visible, setVisible] = useState(false);
    const hasFetched = useRef(false);

    // Get seen broadcast IDs from localStorage
    const getSeenIds = () => {
        try {
            const stored = localStorage.getItem(SEEN_BROADCASTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    // Mark broadcast as seen
    const markSeen = (id) => {
        const seen = getSeenIds();
        if (!seen.includes(id)) {
            seen.push(id);
            localStorage.setItem(SEEN_BROADCASTS_KEY, JSON.stringify(seen));
        }
    };

    // Poll for broadcasts
    useEffect(() => {
        if (!isSettled) return;

        const checkForBroadcast = async () => {
            // Don't poll if tab is hidden to save resources
            if (document.hidden) return;

            try {
                const response = await api.fetch('/points/broadcast/active');
                if (response.broadcast) {
                    const seenIds = getSeenIds();
                    if (!seenIds.includes(response.broadcast.id)) {
                        setBroadcast(response.broadcast);
                        setVisible(true);
                        // Once we find one, we can stop or keep polling? 
                        // Usually good to keep polling for *new* ones, but maybe pause *while* one is visible?
                        // For simplicity, we just set state. If visible is true, modal shows.
                    }
                }
            } catch (error) {
                console.error('Failed to poll broadcast:', error);
            }
        };

        // Initial check
        const initialTimer = setTimeout(checkForBroadcast, 1000);

        // Polling interval (1 minute)
        const interval = setInterval(checkForBroadcast, 60 * 1000);

        // Check immediately when user returns to tab
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkForBroadcast();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isSettled]);

    const handleDismiss = async () => {
        if (broadcast) {
            markSeen(broadcast.id);
            // Notify server that user has read/dismissed the broadcast
            try {
                await api.post(`/points/broadcast/${broadcast.id}/read`);
            } catch (e) {
                // Non-critical, log and continue
                console.warn('Failed to mark broadcast as read:', e);
            }
        }
        setVisible(false);
    };

    if (!visible || !broadcast) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-6)',
                maxWidth: '90vw',
                width: '400px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: 'var(--space-4)'
                }}>
                    <span style={{ fontSize: '3rem' }}>📢</span>
                </div>

                <div style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--color-text)',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-6)',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap'
                }}>
                    {broadcast.message}
                </div>

                <button
                    onClick={handleDismiss}
                    style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-md)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Got it!
                </button>
            </div>
        </div>
    );
};

export default BroadcastModal;
