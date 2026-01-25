import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import NotificationPopup from './NotificationPopup';

const SEEN_BROADCASTS_KEY = 'nestfinder_seen_broadcasts';

const BroadcastModal = ({ isSettled = false, onBroadcastRead }) => {
    const { t } = useLanguage();
    const [broadcasts, setBroadcasts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const processingRef = useRef(false);

    // Get seen broadcast IDs from localStorage
    const getSeenIds = () => {
        try {
            const stored = localStorage.getItem(SEEN_BROADCASTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    // Check settings - default to TRUE if missing
    const isRealTimeEnabled = () => {
        try {
            const saved = localStorage.getItem('nestfinder_notify_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.realTime !== false;
            }
            return true;
        } catch (e) { return true; }
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

        const checkForBroadcasts = async () => {
            // STOP if tab hidden or Real-Time disabled
            if (document.hidden || !isRealTimeEnabled()) return;

            try {
                // Fetch ALL active broadcasts (modified endpoint needed or we check persistence)
                // For now, we rely on the single active logic but loop it on client? 
                // Actually, the server only returns ONE active broadcast at a time based on priority.
                // To support sequential, we need to fetch -> dismiss -> fetch next.

                const response = await api.fetch('/messages/broadcast/active');
                if (response.broadcast) {
                    const seenIds = getSeenIds();
                    if (!seenIds.includes(response.broadcast.id)) {
                        // Found a new one!
                        setBroadcasts([response.broadcast]); // Currently server only gives one
                        setCurrentIndex(0);
                        setVisible(true);
                    }
                }
            } catch (error) {
                console.error('Failed to poll broadcast:', error);
            }
        };

        const initialTimer = setTimeout(checkForBroadcasts, 2000); // Wait a bit longer for app to settle
        const interval = setInterval(checkForBroadcasts, 60 * 1000); // Check every minute

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkForBroadcasts();
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
        const currentBroadcast = broadcasts[currentIndex];
        if (!currentBroadcast || processingRef.current) return;

        processingRef.current = true;
        markSeen(currentBroadcast.id);
        try {
            // Tell server we read it (so it serves the next priority one next time)
            await api.markBroadcastRead(currentBroadcast.id);
            if (onBroadcastRead) onBroadcastRead();
        } catch (e) {
            console.warn('Failed to mark broadcast as read:', e);
        } finally {
            processingRef.current = false;
        }

        // If we had a list, we would go to next. 
        // Since server serves 1 by 1, we close and let the next poll (or immediate check) find the next one.
        setVisible(false);
        setBroadcasts([]);

        // Immediate check for next priority item
        setTimeout(async () => {
            if (document.hidden || !isRealTimeEnabled()) return;
            try {
                const response = await api.fetch('/messages/broadcast/active');
                if (response.broadcast) {
                    const seenIds = getSeenIds();
                    if (!seenIds.includes(response.broadcast.id)) {
                        setBroadcasts([response.broadcast]);
                        setVisible(true);
                    }
                }
            } catch (e) { }
        }, 500);
    };

    if (!visible || broadcasts.length === 0) return null;
    const broadcast = broadcasts[0];

    return (
        <NotificationPopup
            message={{
                id: broadcast.id,
                title: broadcast.title || t('broadcast.announcement') || 'Announcement',
                body: broadcast.message,
                created_at: broadcast.created_at || broadcast.start_time,
                client_received_at: new Date().toISOString(), // Force "Received Now" display
                image_url: broadcast.image_url
            }}
            onDismiss={handleDismiss}
            onMarkRead={handleDismiss}
        />
    );
};

export default BroadcastModal;
