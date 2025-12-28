import React from 'react';

const NotificationList = ({ notifications, markAsRead, markAllAsRead, settings, toggleSettings }) => {
    return (
        <div className="notification-list-container" style={{ padding: '0 16px 24px 16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Inbox</h3>
                <div className="notification-settings-toggle" onClick={toggleSettings}>
                    <span>Real-time Popup</span>
                    <div className={`toggle-switch ${settings.realTime ? 'active' : ''}`}></div>
                </div>
            </div>

            {/* Actions */}
            {notifications.some(n => !n.read) && (
                <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                    <button
                        onClick={markAllAsRead}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Mark all as read
                    </button>
                </div>
            )}

            {/* List */}
            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="notification-empty" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-light)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                        No notifications yet
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => markAsRead(n)}
                            style={{
                                padding: '12px',
                                borderBottom: '1px solid var(--color-border)',
                                background: !n.read ? 'var(--color-bg-secondary)' : 'transparent',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <div className="notification-item-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span className="notification-title" style={{ fontWeight: !n.read ? 'bold' : 'normal' }}>{n.title}</span>
                                <span className="notification-time" style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                                    {new Date(n.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="notification-body" style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>{n.body}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationList;
