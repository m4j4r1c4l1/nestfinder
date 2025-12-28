import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const NotificationCenter = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [popupMessage, setPopupMessage] = useState(null);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('nestfinder_notify_settings');
        return saved ? JSON.parse(saved) : { realTime: true };
    });

    // Track the highest ID we've seen to detect NEW messages
    const maxKnownIdRef = useRef(0);
    const dropdownRef = useRef(null);

    const toggleSettings = () => {
        const newSettings = { ...settings, realTime: !settings.realTime };
        setSettings(newSettings);
        localStorage.setItem('nestfinder_notify_settings', JSON.stringify(newSettings));
    };

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/api/push/notifications?userId=${userId}`);
            const data = await res.json();

            if (data.notifications && data.notifications.length > 0) {
                const latestId = data.notifications[0].id;

                // Detect NEW messages
                // We only popup if we have seen messages before (maxKnownId > 0) to avoid popup storm on initial load
                // OR if it's the very first load, we might skip popup, or just popup the newest. 
                // Let's safe trigger: only if maxKnownId is set and we found a newer one.
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
        }
    };

    // Initial load
    useEffect(() => {
        if (userId && maxKnownIdRef.current === 0) {
            // First fetch, don't popup, just set baseline
            fetch(`${API_URL}/api/push/notifications?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.notifications && data.notifications.length > 0) {
                        maxKnownIdRef.current = data.notifications[0].id;
                        setNotifications(data.notifications);
                        setUnreadCount(data.notifications.filter(n => !n.read).length);
                    }
                })
                .catch(console.error);
        }
    }, [userId]);

    // Poll every 60 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [userId, settings.realTime]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notification) => {
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

    const handleMarkAllRead = async () => {
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

    if (!userId) return null;

    return (
        <>
            {/* Real-time Popup Overlay */}
            {popupMessage && (
                <div className="notification-popup-overlay" onClick={() => setPopupMessage(null)}>
                    <div className="notification-popup" onClick={e => e.stopPropagation()}>
                        <span className="notification-popup-icon">🔔</span>
                        <h3>{popupMessage.title}</h3>
                        <p>{popupMessage.body}</p>
                        <button
                            className="btn btn-primary btn-block"
                            onClick={() => handleMarkAsRead(popupMessage)}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Nav Item Wrapper */}
            <div className="notification-container nav-mode" ref={dropdownRef} style={{ flex: 1, position: 'relative' }}>
                <button
                    className={`bottom-nav-item ${isOpen ? 'active' : ''}`}
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) fetchNotifications();
                    }}
                    style={{ width: '100%', border: 'none', background: 'none' }}
                >
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <span>🔔</span>
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    Alerts
                </button>

                {isOpen && (
                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            <div className="notification-settings-toggle" onClick={toggleSettings}>
                                <span>Real-time</span>
                                <div className={`toggle-switch ${settings.realTime ? 'active' : ''}`}></div>
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                <button
                                    className="notification-action"
                                    onClick={handleMarkAllRead}
                                >
                                    Mark all read
                                </button>
                            </div>
                        )}

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="notification-empty">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`notification-item ${!n.read ? 'unread' : ''}`}
                                        onClick={() => handleMarkAsRead(n)}
                                    >
                                        <div className="notification-item-header">
                                            <span className="notification-title">{n.title}</span>
                                            <span className="notification-time">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="notification-body">{n.body}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationCenter;
