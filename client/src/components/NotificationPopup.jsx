import React from 'react';
import ReactDOM from 'react-dom';

const NotificationPopup = ({ message, onDismiss, onMarkRead, imageOnly = false }) => {
    if (!message) return null;

    return ReactDOM.createPortal(
        <div className="notification-popup-overlay" onClick={onDismiss} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <div className={`notification-popup ${imageOnly ? 'image-only' : ''}`} onClick={e => e.stopPropagation()} style={imageOnly ? { padding: 0, background: 'transparent', boxShadow: 'none', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
                {imageOnly ? (
                    message.image_url && <img src={message.image_url} alt="Notification" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }} />
                ) : (
                    <>
                        <span className="notification-popup-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔔</span>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{message.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                            {(() => {
                                try {
                                    // Parse and display in local timezone (CET/CEST)
                                    // Parse and display in local timezone (CET/CEST)
                                    const dateStr = message.client_received_at || message.fetched_at || message.created_at || '';
                                    // SQLite dates (fetched_at/created_at) are UTC but lack 'Z'. Ensure we treat them as UTC.
                                    let normalizedDateStr = dateStr.replace(' ', 'T');
                                    if (normalizedDateStr && !normalizedDateStr.endsWith('Z') && !normalizedDateStr.includes('+')) {
                                        normalizedDateStr += 'Z';
                                    }
                                    const date = new Date(normalizedDateStr);
                                    return date.toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                        timeZone: 'Europe/Paris'
                                    }) + ' CET';
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
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default NotificationPopup;
