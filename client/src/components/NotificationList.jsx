import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';

// Feedback Section Component (moved from SettingsPanel)
const FeedbackSection = ({ onFeedbackSent }) => {
    const { t } = useLanguage();
    const [type, setType] = useState('suggestion');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;

        setLoading(true);
        try {
            await api.submitFeedback(type, message.trim(), rating);
            setSuccess(true);
            setMessage('');
            setRating(5);
            setTimeout(() => setSuccess(false), 3000);
            if (onFeedbackSent) onFeedbackSent();
        } catch (err) {
            console.error('Failed to submit feedback:', err);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '0.25rem', height: '100%', width: '100%', display: 'block' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                {t('feedback.description') || 'Report bugs or suggest improvements.'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {['bug', 'suggestion', 'other'].map(typeOption => (
                    <button
                        key={typeOption}
                        onClick={() => setType(typeOption)}
                        style={{
                            flex: 1,
                            padding: '0.4rem',
                            background: type === typeOption ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                            color: type === typeOption ? 'white' : 'var(--color-text-secondary)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                        }}
                    >
                        {typeOption === 'bug' ? '🐛 Bug' : typeOption === 'suggestion' ? '💡 Idea' : '📝 Other'}
                    </button>
                ))}
            </div>

            <textarea
                key={success ? 'submitted' : 'editing'} // Force remount on success state change
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder={t('feedback.placeholder') || 'Describe your feedback...'}
                maxLength={500}
                style={{
                    width: '100%',
                    minWidth: '100%', // Force full width in Safari
                    maxWidth: '100%', // Prevent overflow
                    boxSizing: 'border-box', // Ensure padding doesn't affect width
                    WebkitAppearance: 'none', // Remove native Safari inner styles
                    height: '120px',
                    padding: '0.75rem',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                    resize: 'none',
                    marginBottom: '0.5rem',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'right', marginBottom: '0.25rem' }}>
                {message.length}/500 {t('feedback.charLimit') || 'characters'}
            </div>

            {/* Application Rating */}
            <div style={{ marginBottom: '0.5rem', padding: '0.25rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '0.1rem', textAlign: 'center', fontWeight: 500 }}>
                    {t('feedback.rateApp') || 'Rate the App'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                padding: '0 2px',
                                transition: 'transform 0.1s',
                                transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
                                filter: rating >= star ? 'grayscale(0%)' : 'grayscale(100%) opacity(0.3)'
                            }}
                        >
                            ⭐
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: success ? 'var(--color-confirmed)' : 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    opacity: message.trim() ? 1 : 0.6,
                    fontWeight: 500
                }}
            >
                {success ? '✓ Sent!' : loading ? 'Sending...' : t('feedback.send') || 'Send Feedback'}
            </button>
        </div>
    );
};

const NotificationList = ({ notifications, markAsRead, markAllAsRead, settings, toggleSettings, onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('received');
    const [sentMessages, setSentMessages] = useState([]);
    const [loadingSent, setLoadingSent] = useState(true);
    const [retention, setRetention] = useState(() => localStorage.getItem('nestfinder_message_retention') || '1m');

    // Listen for retention setting changes
    useEffect(() => {
        const handleStorage = () => {
            setRetention(localStorage.getItem('nestfinder_message_retention') || '1m');
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Fetch sent messages
    const fetchSent = async () => {
        setLoadingSent(true);
        try {
            const data = await api.getFeedback();
            if (data && data.feedback) {
                setSentMessages(data.feedback);
            }
        } catch (err) {
            console.error('Failed to fetch sent messages', err);
        } finally {
            setLoadingSent(false);
        }
    };

    useEffect(() => {
        fetchSent();
    }, []);

    // Helper: Filter by retention
    const filterByRetention = (items) => {
        if (retention === 'forever') return items;

        const now = new Date();
        const cutoff = new Date();

        if (retention === '1m') cutoff.setMonth(now.getMonth() - 1);
        else if (retention === '3m') cutoff.setMonth(now.getMonth() - 3);
        else if (retention === '6m') cutoff.setMonth(now.getMonth() - 6);

        return items.filter(item => {
            const date = new Date(item.created_at);
            return date > cutoff;
        });
    };

    const handleDelete = async (e, id, type) => {
        e.stopPropagation(); // Prevent opening message
        if (!window.confirm(t('common.confirmDelete') || 'Delete this message?')) return;

        try {
            if (type === 'received') {
                await api.deleteNotification(id);
                // Optimistic update handled by markDeleted logic for local state
                setDeletedIds(prev => new Set(prev).add(id));
            } else {
                await api.deleteFeedback(id);
                setSentMessages(prev => prev.filter(m => m.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    // Since we can't easily modify `notifications` prop, we use a local filter for deleted IDs
    const [deletedIds, setDeletedIds] = useState(new Set());
    const markDeleted = async (e, id) => {
        handleDelete(e, id, 'received');
    };

    const filteredNotifications = filterByRetention(notifications).filter(n => !deletedIds.has(n.id));
    const filteredSent = filterByRetention(sentMessages);

    const tabs = [
        { id: 'received', icon: '🦜', label: t('inbox.received') || 'Received' },
        { id: 'sent', icon: '🦩', label: t('inbox.sent') || 'Sent' },
        { id: 'compose', icon: '🪶', label: t('inbox.compose') || 'Compose' }
    ];

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Sticky Header & Tabs Container */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0
            }}>
                {/* Header - Compact */}
                <div className="card-header flex-between items-center" style={{ borderBottom: 'none', padding: '0.75rem 1rem 0.25rem 1rem' }}>
                    <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{t('inbox.title') || 'Inbox'}</h3>
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

                {/* Tabs */}
                <div style={{ display: 'flex', paddingBottom: '0.25rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1,
                                padding: 'var(--space-2)',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                height: 'auto'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem', lineHeight: 1.2 }}>{tab.icon}</span>
                            <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem 1rem' }}>

                {/* RECEIVED TAB */}
                {activeTab === 'received' && (
                    <div className="notification-list" style={{ marginTop: '1rem' }}>
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">
                                <span style={{ fontSize: '2rem' }}>📭</span>
                                <p>{t('inbox.empty') || 'No messages'}</p>
                            </div>
                        ) : (
                            <>
                                {filteredNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                        onClick={() => markAsRead(notification.id)}
                                        style={{ position: 'relative' }}
                                    >
                                        <div className="notification-icon">
                                            {notification.type === 'alert' ? '🚨' :
                                                notification.type === 'success' ? '✅' :
                                                    notification.type === 'reward' ? '🏆' : '📩'}
                                        </div>
                                        <div className="notification-content" style={{ paddingRight: '20px' }}>
                                            <div className="notification-header">
                                                <span className="notification-title">{notification.title}</span>
                                                <span className="notification-time">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="notification-body">{notification.body}</p>
                                        </div>
                                        {!notification.read && <div className="unread-dot"></div>}

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => markDeleted(e, notification.id)}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                right: '10px',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                opacity: 0.3,
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                padding: '4px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = 1}
                                            onMouseLeave={(e) => e.target.style.opacity = 0.3}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                                {filteredNotifications.some(n => !n.read) && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="btn btn-secondary btn-sm"
                                        style={{ width: '100%', marginTop: '1rem' }}
                                    >
                                        {t('inbox.markAllRead') || 'Mark all as read'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* SENT TAB */}
                {activeTab === 'sent' && (
                    <div className="notification-list" style={{ marginTop: '1rem' }}>
                        {loadingSent ? (
                            <div className="empty-state">
                                <span style={{ fontSize: '2rem' }}>⌛</span>
                                <p>Loading...</p>
                            </div>
                        ) : filteredSent.length === 0 ? (
                            <div className="empty-state">
                                <span style={{ fontSize: '2rem' }}>🪁</span>
                                <p>{t('inbox.noSent') || 'No sent messages'}</p>
                            </div>
                        ) : (
                            filteredSent.map(msg => (
                                <div key={msg.id} className="notification-item read" style={{ position: 'relative' }}>
                                    <div className="notification-icon">
                                        {msg.type === 'bug' ? '🐛' : msg.type === 'suggestion' ? '💡' : '💭'}
                                    </div>
                                    <div className="notification-content" style={{ paddingRight: '20px' }}>
                                        <div className="notification-header">
                                            <span className="notification-title" style={{ textTransform: 'capitalize' }}>
                                                {msg.type || 'Feedback'}
                                            </span>
                                            <span className="notification-time">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="notification-body">{msg.message}</p>
                                        {msg.rating && (
                                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#f59e0b' }}>
                                                {'⭐'.repeat(msg.rating)}
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div style={{
                                            fontSize: '0.7rem',
                                            marginTop: '0.5rem',
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: msg.status === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                            color: msg.status === 'resolved' ? '#22c55e' : 'var(--color-text-secondary)'
                                        }}>
                                            {msg.status ? msg.status.toUpperCase() : 'SENT'}
                                        </div>
                                    </div>
                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => handleDelete(e, msg.id, 'sent')}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            right: '10px',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            opacity: 0.3,
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            padding: '4px'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = 1}
                                        onMouseLeave={(e) => e.target.style.opacity = 0.3}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* COMPOSE TAB */}
                {activeTab === 'compose' && (
                    <FeedbackSection t={t} onFeedbackSent={fetchSent} />
                )}
            </div>
        </div>
    );
};

export default NotificationList;
