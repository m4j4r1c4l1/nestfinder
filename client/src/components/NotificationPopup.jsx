import React from 'react';

const NotificationPopup = ({ message, onDismiss, onMarkRead }) => {
    if (!message) return null;

    return (
        <div className="notification-popup-overlay" onClick={onDismiss}>
            <div className="notification-popup" onClick={e => e.stopPropagation()}>
                <span className="notification-popup-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔔</span>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{message.title}</h3>
                <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.5' }}>{message.body}</p>
                <button
                    className="btn btn-primary btn-block"
                    onClick={() => onMarkRead(message)}
                    style={{ width: '100%', padding: '12px' }}
                >
                    Got it
                </button>
            </div>
        </div>
    );
};

export default NotificationPopup;
