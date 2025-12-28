import React from 'react';

const NotificationBell = ({ unreadCount, onClick, active }) => {
    return (
        <button
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={onClick}
            style={{ position: 'relative' }} // ensure badge is positioned relative to button
        >
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontSize: '1.2rem', display: 'block' }}>🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
            Messages
        </button>
    );
};

export default NotificationBell;
