import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';

// Feedback Section Component (moved from SettingsPanel)
const FeedbackSection = () => {
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
    useEffect(() => {
        const fetchSent = async () => {
            try {
                const data = await api.getFeedback();
                if (data && data.feedback) {
                    setSentMessages(data.feedback);
                }
            } catch (err) {
                console.error('Failed to fetch sent messages', err);
            }
        };
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

    const filteredNotifications = filterByRetention(notifications);
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
                flexShrink: 0 // Prevent header from shrinking
            }}>
                {/* Header - Compact */}
                <div className="card-header flex-between items-center" style={{ borderBottom: 'none', padding: '0.75rem 1rem 0.25rem 1rem' }}>
                    <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{t('inbox.title') || 'Inbox'}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Settings Gear */}
                        <button
                            onClick={toggleSettings}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                padding: 0,
                                opacity: settings ? 1 : 0.7
                            }}
                            title={t('nav.settings')}
                        >
                            ⚙️
                        </button>
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
                            <div className="empty-state" style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--color-text-light)' }}>
                                <span style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }}>📭</span>
                                <p>{t('inbox.empty') || 'No messages'}</p>
                                {/* Retention Hint */}
                                {notifications.length > 0 && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                                        ({notifications.length - filteredNotifications.length} hidden by retention)
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {filteredNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                        onClick={() => markAsRead(notification.id)}
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid var(--color-border)',
                                            background: !notification.read ? 'var(--color-bg-secondary)' : 'transparent',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            cursor: 'pointer',
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
                    </>
                ) : activeTab === 'sent' ? (
    <div style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📤</div>
        <div>{t('inbox.sentPlaceholder') || 'Sent messages will appear here'}</div>
    </div>
) : (
    <FeedbackSection />
)}
            </div >
        </div >
    );
};

export default NotificationList;
