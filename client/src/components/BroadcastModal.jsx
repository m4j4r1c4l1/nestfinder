import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import NotificationPopup from './NotificationPopup';

const SEEN_BROADCASTS_KEY = 'nestfinder_seen_broadcasts';

const BroadcastModal = ({ isSettled = false }) => {
    const { t } = useLanguage();
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
            if (document.hidden) return;

            try {
                const response = await api.fetch('/points/broadcast/active');
                if (response.broadcast) {
                    const seenIds = getSeenIds();
                    if (!seenIds.includes(response.broadcast.id)) {
                        setBroadcast(response.broadcast);
                        setVisible(true);
                    }
                }
            } catch (error) {
                console.error('Failed to poll broadcast:', error);
            }
        };

        const initialTimer = setTimeout(checkForBroadcast, 1000);
        const interval = setInterval(checkForBroadcast, 60 * 1000);

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
            try {
                await api.post(`/points/broadcast/${broadcast.id}/read`);
            } catch (e) {
                console.warn('Failed to mark broadcast as read:', e);
            }
        }
        setVisible(false);
    };

    if (!visible || !broadcast) return null;

    return (
        <NotificationPopup
            message={{
                id: broadcast.id,
                title: broadcast.title || t('broadcast.announcement') || 'Announcement',
                body: broadcast.message,
                created_at: broadcast.created_at || broadcast.start_time,
                image_url: broadcast.image_url
            }}
            onDismiss={handleDismiss}
            onMarkRead={handleDismiss}
        />
    );
};

export default BroadcastModal;
