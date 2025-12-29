import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [popupMessage, setPopupMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('nestfinder_notify_settings');
        return saved ? JSON.parse(saved) : { realTime: true };
    });

    const maxKnownIdRef = useRef(0);

    const toggleSettings = () => {
        const newSettings = { ...settings, realTime: !settings.realTime };
        setSettings(newSettings);
        localStorage.setItem('nestfinder_notify_settings', JSON.stringify(newSettings));
    };

    const fetchNotifications = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/push/notifications?userId=${userId}`);
            const data = await res.json();

            if (data.notifications && data.notifications.length > 0) {
                const latestId = data.notifications[0].id;

                // Detect NEW messages for popup
                if (maxKnownIdRef.current > 0 && latestId > maxKnownIdRef.current) {
                    const newMsg = data.notifications[0];
                    if (settings.realTime && !newMsg.read) {
                        setPopupMessage(newMsg);
                    }
                }

                maxKnownIdRef.current = Math.max(maxKnownIdRef.current, latestId);
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (userId && maxKnownIdRef.current === 0) {
            fetch(`${API_URL}/api/push/notifications?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.notifications && data.notifications.length > 0) {
                        maxKnownIdRef.current = data.notifications[0].id;
                        setNotifications(data.notifications);
                        setUnreadCount(data.notifications.filter(n => !n.read).length);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Initial fetch failed', err);
                    setLoading(false);
                });
        }
    }, [userId]);

    // Poll every 60 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [userId]);

    // Listen for settings changes from SettingsPanel
    useEffect(() => {
        const checkSettings = () => {
            try {
                const saved = localStorage.getItem('nestfinder_notify_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.realTime !== settings.realTime) {
                        setSettings(parsed);
                    }
                }
            } catch (e) { }
        };

        // Check settings periodically (in case changed by another component)
        const settingsInterval = setInterval(checkSettings, 1000);

        // Also listen for storage events (works across tabs)
        window.addEventListener('storage', checkSettings);

        return () => {
            clearInterval(settingsInterval);
            window.removeEventListener('storage', checkSettings);
        };
    }, [settings.realTime]);

    const markAsRead = async (notification) => {
        if (!notification) return;

        // Remove from popup if it's the current one
        if (popupMessage && popupMessage.id === notification.id) {
            setPopupMessage(null);
        }

        if (notification.read) return;

        try {
            await fetch(`${API_URL}/api/push/notifications/${notification.id}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, read: 1 } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_URL}/api/push/notifications/read-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const dismissPopup = () => setPopupMessage(null);

    return {
        notifications,
        unreadCount,
        popupMessage,
        loading,
        settings,
        markAsRead,
        markAllAsRead,
        toggleSettings,
        dismissPopup
    };
};
