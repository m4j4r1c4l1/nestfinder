import React from 'react';
import ReactDOM from 'react-dom';

const NotificationPopup = ({ message, onDismiss, onMarkRead }) => {
    if (!message) return null;

    return ReactDOM.createPortal(
        <div className="notification-popup-overlay" onClick={onDismiss} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <div className="notification-popup" onClick={e => e.stopPropagation()}>
                <span className="notification-popup-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔔</span>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{message.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                    {(() => {
                        try {
                            const utcTime = message.created_at.replace(' ', 'T') + 'Z';
                            return new Date(utcTime).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            });
                        } catch (e) { return ''; }
                    })()}
                </div>
                {message.image_url && (
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <img
                            src={message.image_url}
                            alt="Notification"
                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px' }}
                        />
                    </div>
                )}
                <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.5' }}>{message.body}</p>
                <button
                    className="btn btn-primary btn-block"
                    onClick={() => onMarkRead(message)}
                    style={{ width: '100%', padding: '12px' }}
                >
                    Got it
                </button>
            </div>
        </div>,
        document.body
    );
};

export default NotificationPopup;
