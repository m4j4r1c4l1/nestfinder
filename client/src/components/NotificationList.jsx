import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const NotificationList = ({ notifications, markAsRead, markAllAsRead, settings, toggleSettings, onClose }) => {
    const { t } = useLanguage();
    return (
        <div className="card">
            {/* Header */}
            <div className="card-header flex-between items-center">
                <h3 className="card-title">{t('inbox.title')}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="notification-settings-toggle" onClick={toggleSettings} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{t('settings.popupMessages')}</span>
                        <div className={`toggle-switch ${settings.realTime ? 'active' : ''}`}></div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                padding: 0,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="card-body">
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
                            {t('inbox.markAllRead')}
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="notification-list">
                    {notifications.length === 0 ? (
                        <div className="notification-empty" style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--color-text-light)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                            {t('inbox.noMessages')}
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
                                    cursor: 'pointer',
                                    borderLeft: !n.read ? '4px solid var(--color-primary)' : '4px solid transparent',
                                    opacity: n.read ? 0.65 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div className="notification-item-header" style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px', alignItems: 'center', textAlign: 'center' }}>
                                    <span className="notification-title" style={{ fontWeight: !n.read ? 'bold' : 'normal', fontSize: '1rem', lineHeight: 1.3 }}>{n.title}</span>
                                    <span className="notification-time" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                                        {(() => {
                                            try {
                                                // Fix timezone: SQLite returns "YYYY-MM-DD HH:MM:SS" (UTC)
                                                // Convert to ISO "YYYY-MM-DDTHH:MM:SSZ" to force UTC parsing
                                                const utcTime = n.created_at.replace(' ', 'T') + 'Z';
                                                return new Date(utcTime).toLocaleString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                });
                                            } catch (e) {
                                                return n.created_at;
                                            }
                                        })()}
                                    </span>
                                </div>
                                {n.image_url && (
                                    <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                                        <img
                                            src={n.image_url}
                                            alt="Notification"
                                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                                        />
                                    </div>
                                )}
                                <div className="notification-body" style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>{n.body}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationList;
