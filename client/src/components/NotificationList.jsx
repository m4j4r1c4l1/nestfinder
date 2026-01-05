import React, { useState, useEffect, useRef } from 'react';
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
                key={success ? 'submitted' : 'editing'}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder={t('feedback.placeholder') || 'Describe your feedback...'}
                maxLength={500}
                style={{
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
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

// Swipeable Message Item Component
const SwipeableMessage = ({ children, onSwipeDelete, swipeDirection = 'right' }) => {
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const [swiping, setSwiping] = useState(false);
    const SWIPE_THRESHOLD = 80;

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentX.current = e.touches[0].clientX;
        setSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!swiping) return;
        touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!swiping) return;
        setSwiping(false);

        const diff = touchCurrentX.current - touchStartX.current;
        const isRightSwipe = diff > SWIPE_THRESHOLD;
        const isLeftSwipe = diff < -SWIPE_THRESHOLD;

        if ((swipeDirection === 'right' && isRightSwipe) || (swipeDirection === 'left' && isLeftSwipe)) {
            onSwipeDelete();
        }
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {children}
        </div>
    );
};

const NotificationList = ({ notifications, markAsRead, markAllAsRead, settings, toggleSettings, onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('received');
    const [sentMessages, setSentMessages] = useState([]);
    const [loadingSent, setLoadingSent] = useState(true);
    const [retention, setRetention] = useState(() => localStorage.getItem('nestfinder_message_retention') || '1m');
    const [swipeDirection, setSwipeDirection] = useState(() => localStorage.getItem('nestfinder_swipe_direction') || 'right');

    // Listen for setting changes
    useEffect(() => {
        const handleStorage = () => {
            setRetention(localStorage.getItem('nestfinder_message_retention') || '1m');
            setSwipeDirection(localStorage.getItem('nestfinder_swipe_direction') || 'right');
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
        return items.filter(item => new Date(item.created_at) > cutoff);
    };

    // Deletion state
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [deletedIds, setDeletedIds] = useState(new Set());

    const handleDeleteClick = (e, id, type) => {
        if (e) e.stopPropagation();
        setMessageToDelete({ id, type });
    };

    const confirmDelete = async (e) => {
        if (e) e.stopPropagation();
        if (!messageToDelete) return;
        const { id, type } = messageToDelete;
        try {
            if (type === 'received') {
                await api.deleteNotification(id);
                setDeletedIds(prev => new Set(prev).add(id));
            } else {
                await api.deleteFeedback(id);
                setSentMessages(prev => prev.filter(m => m.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete', err);
        } finally {
            setMessageToDelete(null);
        }
    };

    const cancelDelete = (e) => {
        if (e) e.stopPropagation();
        setMessageToDelete(null);
    };

    const filteredNotifications = filterByRetention(notifications).filter(n => !deletedIds.has(n.id));
    const filteredSent = filterByRetention(sentMessages);

    const tabs = [
        { id: 'received', icon: '🦜', label: t('inbox.received') || 'Received' },
        { id: 'sent', icon: '🦩', label: t('inbox.sent') || 'Sent' },
        { id: 'compose', icon: '🪶', label: t('inbox.compose') || 'Compose' }
    ];

    // Error-style delete button (matches SettingsPanel invalid key style)
    const deleteButtonStyle = {
        padding: 'var(--space-2)',
        paddingLeft: '12px',
        paddingRight: '12px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-md)',
        color: '#ef4444',
        fontSize: '0.85rem',
        textAlign: 'center',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500
    };

    // Render deletion overlay for a message
    const renderDeletionOverlay = (itemId) => {
        if (!messageToDelete || messageToDelete.id !== itemId) return null;

        return (
            <div
                onClick={cancelDelete}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%', // Full width coverage
                    height: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 20,
                    borderRadius: 'var(--radius-md)' // Match container radius
                }}
            >
                <button
                    onClick={confirmDelete}
                    style={deleteButtonStyle}
                >
                    {t('inbox.delete.yes') || 'Delete'}
                </button>
            </div>
        );
    };

    // Helper: Format Time (DD/MM/YYYY HH:MM:SS CET/CEST)
    const formatTime = (dateString) => {
        try {
            const d = new Date(dateString);
            // Check for DST (Central European Time)
            const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
            const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
            const parisOffset = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
            const isDST = Math.max(jan, jul) !== parisOffset;

            const datePart = d.toLocaleDateString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                timeZone: 'Europe/Paris'
            });
            const timePart = d.toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZone: 'Europe/Paris', hour12: false
            });

            return `${datePart} ${timePart} ${isDST ? 'CEST' : 'CET'}`;
        } catch (e) {
            return '';
        }
    };

    // Helper: Map Feedback Type to Title
    const getFeedbackTitle = (type) => {
        if (!type) return 'Feedback';
        const map = {
            'bug': 'Bug',
            'suggestion': 'Idea',
            'other': 'Other'
        };
        return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Helper: Render Status Badge
    const renderStatusBadge = (item, type) => {
        let status = 'SENT';
        let color = 'gray';

        if (type === 'received') {
            if (!item.read) {
                status = 'NEW'; // Equiv to DELIVERED/Unread
                color = 'green';
            } else {
                status = 'READ';
                color = 'blue';
            }
        } else {
            // Sent items
            const s = (item.status || '').toLowerCase();
            if (s === 'resolved' || s === 'read') {
                status = 'READ';
                color = 'blue';
            } else if (s === 'new' || s === 'pending' || s === 'delivered') {
                status = 'DELIVERED';
                color = 'green';
            } else {
                status = 'SENT';
                color = 'gray';
            }
        }

        const bgColors = {
            gray: 'rgba(148, 163, 184, 0.15)',
            green: 'rgba(34, 197, 94, 0.15)',
            blue: 'rgba(59, 130, 246, 0.15)'
        };
        const textColors = {
            gray: '#64748b',
            green: '#16a34a',
            blue: '#2563eb'
        };
        const borderColors = {
            gray: 'rgba(148, 163, 184, 0.2)',
            green: 'rgba(34, 197, 94, 0.2)',
            blue: 'rgba(59, 130, 246, 0.2)'
        };

        return (
            <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: bgColors[color],
                color: textColors[color],
                border: `1px solid ${borderColors[color]}`,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Sticky Header & Tabs */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0
            }}>
                <div className="card-header flex-between items-center" style={{ borderBottom: 'none', padding: '0.75rem 1rem 0.25rem 1rem' }}>
                    <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{t('inbox.title') || 'Inbox'}</h3>
                    {onClose && (
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                            &times;
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', paddingBottom: '0.25rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: 'var(--space-2)', background: 'transparent', border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s ease',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem', lineHeight: 1.2 }}>{tab.icon}</span>
                            <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem 1rem' }}>

                {/* RECEIVED TAB */}
                {activeTab === 'received' && (
                    <div className="notification-list" style={{ marginTop: '1rem', height: '100%' }}>
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪹</span>
                                <p style={{ fontSize: '1.1rem', margin: 0 }}>{t('inbox.empty') || 'Your nest is empty'}</p>
                            </div>
                        ) : (
                            <>
                                {filteredNotifications.map(notification => {
                                    const isDeleting = messageToDelete?.id === notification.id;
                                    return (
                                        <SwipeableMessage
                                            key={notification.id}
                                            swipeDirection={swipeDirection}
                                            onSwipeDelete={() => handleDeleteClick(null, notification.id, 'received')}
                                        >
                                            <div
                                                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                                onClick={() => markAsRead(notification.id)}
                                                style={{
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)',
                                                    marginBottom: '0.75rem',
                                                    background: '#0f172a'
                                                }}
                                            >
                                                {/* 1. Header Row: Icon/Title + Timestamp (Baseline Aligned) */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                                        <span className="notification-icon" style={{ fontSize: '1.4rem', margin: 0, width: 'auto', height: 'auto', background: 'none' }}>
                                                            {notification.type === 'alert' ? '🚨' : notification.type === 'success' ? '✅' : notification.type === 'reward' ? '🏆' : '📩'}
                                                        </span>
                                                        <span className="notification-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                                            {notification.title}
                                                        </span>
                                                    </div>
                                                    <div className="notification-time" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                                                        {formatTime(notification.created_at)}
                                                    </div>
                                                </div>

                                                {/* 2. Body Row: Message Content */}
                                                <div style={{
                                                    background: 'var(--color-bg-tertiary)',
                                                    border: '1px solid #334155',
                                                    borderRadius: '6px',
                                                    padding: '0.75rem',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.85rem',
                                                    color: '#cbd5e1',
                                                    marginTop: '0.4rem',
                                                    marginBottom: '0.4rem',
                                                    whiteSpace: 'pre-wrap',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {notification.body}
                                                </div>

                                                {/* 3. Footer Row: Stars (Left) | Badge (Center) | Bin (Right) */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', height: '24px' }}>
                                                    {/* Left: Placeholder for Stars */}
                                                    <div style={{ justifySelf: 'start' }}></div>

                                                    {/* Center: Status Badge */}
                                                    <div style={{ justifySelf: 'center' }}>
                                                        {renderStatusBadge(notification, 'received')}
                                                    </div>

                                                    {/* Right: Bin Icon */}
                                                    <div style={{ justifySelf: 'end' }}>
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, notification.id, 'received')}
                                                            style={{
                                                                background: 'none', border: 'none', cursor: 'pointer',
                                                                fontSize: '1rem', padding: '4px', opacity: isDeleting ? 1 : 0.6,
                                                                transition: 'opacity 0.2s', display: 'flex', alignItems: 'center'
                                                            }}
                                                            title={t('common.delete') || 'Delete'}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                {renderDeletionOverlay(notification.id)}
                                            </div>
                                        </SwipeableMessage>
                                    );
                                })}
                                {filteredNotifications.some(n => !n.read) && (
                                    <button onClick={markAllAsRead} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
                                        {t('inbox.markAllRead') || 'Mark all as read'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* SENT TAB */}
                {activeTab === 'sent' && (
                    <div className="notification-list" style={{ marginTop: '1rem', height: '100%' }}>
                        {loadingSent ? (
                            <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                <span style={{ fontSize: '2rem' }}>⌛</span>
                                <p>{t('common.loading') || 'Loading...'}</p>
                            </div>
                        ) : filteredSent.length === 0 ? (
                            <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪹</span>
                                <p style={{ fontSize: '1.1rem', margin: 0 }}>{t('inbox.noSent') || 'No contributions yet'}</p>
                            </div>
                        ) : (
                            filteredSent.map(msg => {
                                const isDeleting = messageToDelete?.id === msg.id;
                                return (
                                    <SwipeableMessage
                                        key={msg.id}
                                        swipeDirection={swipeDirection}
                                        onSwipeDelete={() => handleDeleteClick(null, msg.id, 'sent')}
                                    >
                                        <div className="notification-item read" style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            marginBottom: '0.75rem',
                                            background: '#0f172a'
                                        }}>
                                            {/* 1. Header Row: Icon/Title + Timestamp (Baseline Aligned) */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                                    <span className="notification-icon" style={{ fontSize: '1.4rem', margin: 0, width: 'auto', height: 'auto', background: 'none' }}>
                                                        {msg.type === 'bug' ? '🐛' : msg.type === 'suggestion' ? '💡' : '💭'}
                                                    </span>
                                                    <span className="notification-title" style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--color-text)' }}>
                                                        {getFeedbackTitle(msg.type)}
                                                    </span>
                                                </div>
                                                <div className="notification-time" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                                                    {formatTime(msg.created_at)}
                                                </div>
                                            </div>

                                            {/* 2. Body Row: Message Content */}
                                            <div style={{
                                                background: 'var(--color-bg-tertiary)',
                                                border: '1px solid #334155',
                                                borderRadius: '6px',
                                                padding: '0.75rem',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                color: '#cbd5e1',
                                                marginTop: '0.4rem',
                                                marginBottom: '0.4rem',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: '1.5'
                                            }}>
                                                {msg.message}
                                            </div>

                                            {/* 3. Footer Row: Stars (Left) | Badge (Center) | Bin (Right) */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', height: '24px' }}>
                                                {/* Left: Stars */}
                                                <div style={{ justifySelf: 'start' }}>
                                                    {msg.rating && (
                                                        <div style={{ fontSize: '0.9rem', color: '#f59e0b', lineHeight: 1 }}>
                                                            {'⭐'.repeat(msg.rating)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Center: Status Badge */}
                                                <div style={{ justifySelf: 'center' }}>
                                                    {renderStatusBadge(msg, 'sent')}
                                                </div>

                                                {/* Right: Bin Icon */}
                                                <div style={{ justifySelf: 'end' }}>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, msg.id, 'sent')}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            fontSize: '1rem', padding: '4px', opacity: isDeleting ? 1 : 0.6,
                                                            transition: 'opacity 0.2s', display: 'flex', alignItems: 'center'
                                                        }}
                                                        title={t('common.delete') || 'Delete'}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>

                                            {renderDeletionOverlay(msg.id)}
                                        </div>
                                    </SwipeableMessage>
                                );
                            })
                        )}
                    </div>
                )}

                {/* COMPOSE TAB */}
                {activeTab === 'compose' && (
                    <FeedbackSection onFeedbackSent={fetchSent} />
                )}
            </div>
        </div>
    );
};

export default NotificationList;
