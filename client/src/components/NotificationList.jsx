import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import NotificationPopup from './NotificationPopup';

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
        <div style={{ padding: '0.25rem', height: '100%', width: '100%', display: 'block', overflowY: 'auto' }}>
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
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [viewingImageOnly, setViewingImageOnly] = useState(false);

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

    // Status filter state (null = all, 'new'/'read' for received, 'sent'/'delivered'/'read' for sent)
    const [receivedFilter, setReceivedFilter] = useState(null);
    const [sentFilter, setSentFilter] = useState(null);

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

    // Apply retention filter first, then status filter
    const baseNotifications = filterByRetention(notifications).filter(n => !deletedIds.has(n.id));
    const filteredNotifications = receivedFilter === null
        ? baseNotifications
        : receivedFilter === 'new'
            ? baseNotifications.filter(n => !n.read)
            : baseNotifications.filter(n => n.read);

    const baseSent = filterByRetention(sentMessages);
    const filteredSent = sentFilter === null
        ? baseSent
        : baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            if (sentFilter === 'read') return s === 'resolved' || s === 'read' || s === 'reviewed';
            if (sentFilter === 'delivered') return s === 'new' || s === 'pending' || s === 'delivered';
            if (sentFilter === 'sent') return !s || s === 'sent';
            return true;
        });

    const tabs = [
        { id: 'received', icon: '🦜', label: t('inbox.received') || 'Received' },
        { id: 'sent', icon: '🦩', label: t('inbox.sent') || 'Sent' },
        { id: 'compose', icon: '🪶', label: t('inbox.compose') || 'Compose' }
    ];

    // Error-style delete button (matches SettingsPanel invalid key style)
    const deleteButtonStyle = {
        padding: 'var(--space-2)',
        paddingLeft: '24px',
        paddingRight: '24px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-md)',
        color: '#ef4444',
        fontSize: '0.85rem',
        textAlign: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500,
        minWidth: '150px'
    };

    // Summary Badge Component (Dashboard style, clickable, compact)
    const SummaryBadge = ({ label, count, color, onClick, isActive }) => (
        <span
            onClick={onClick}
            style={{
                background: isActive ? `${color}35` : `${color}15`,
                color: color,
                padding: '0 0.5rem',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '24px',
                border: `1px solid ${isActive ? color : `${color}30`}`,
                gap: '0.25rem',
                userSelect: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
            }}>
            <span style={{ color: color }}>{label}</span>
            <span style={{ color: 'white', fontWeight: 700 }}>{count}</span>
        </span>
    );

    // Render sticky footer badges row for Received tab
    const renderReceivedSummaryBadges = () => {
        const totalCount = baseNotifications.length;
        if (totalCount === 0) return null;
        const unreadCount = baseNotifications.filter(n => !n.read).length;
        const readCount = baseNotifications.filter(n => n.read).length;
        return (
            <div style={{
                background: 'var(--color-bg-secondary)',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: 'none',
                flexShrink: 0
            }}>
                <SummaryBadge label="TOTAL" count={totalCount} color="#a855f7" onClick={() => setReceivedFilter(null)} isActive={receivedFilter === null} />
                <SummaryBadge label="PENDING" count={unreadCount} color="#22c55e" onClick={() => setReceivedFilter('new')} isActive={receivedFilter === 'new'} />
                <SummaryBadge label="READ" count={readCount} color="#3b82f6" onClick={() => setReceivedFilter('read')} isActive={receivedFilter === 'read'} />
            </div>
        );
    };

    // Render sticky footer badges row for Sent tab
    const renderSentSummaryBadges = () => {
        const totalCount = baseSent.length;
        if (totalCount === 0) return null;
        const sentCount = baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            return !s || s === 'sent';
        }).length;
        const deliveredCount = baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            return s === 'new' || s === 'pending' || s === 'delivered';
        }).length;
        const readCount = baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            return s === 'resolved' || s === 'read' || s === 'reviewed';
        }).length;
        return (
            <div style={{
                background: 'var(--color-bg-secondary)',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: 'none',
                flexShrink: 0
            }}>
                <SummaryBadge label="TOTAL" count={totalCount} color="#a855f7" onClick={() => setSentFilter(null)} isActive={sentFilter === null} />
                <SummaryBadge label="SENT" count={sentCount} color="#94a3b8" onClick={() => setSentFilter('sent')} isActive={sentFilter === 'sent'} />
                <SummaryBadge label="DELIVERED" count={deliveredCount} color="#22c55e" onClick={() => setSentFilter('delivered')} isActive={sentFilter === 'delivered'} />
                <SummaryBadge label="READ" count={readCount} color="#3b82f6" onClick={() => setSentFilter('read')} isActive={sentFilter === 'read'} />
            </div>
        );
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
                    width: '100%',
                    height: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 20,
                    borderRadius: 'var(--radius-md)'
                }}
            >
                <button
                    onClick={confirmDelete}
                    style={deleteButtonStyle}
                >
                    Delete
                </button>
            </div>
        );
    };

    // Helper: Format Date/Time (split into two lines)
    const formatDateTime = (dateString) => {
        try {
            const d = new Date(dateString);
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

            return { date: datePart, time: `${timePart} ${isDST ? 'CEST' : 'CET'}` };
        } catch (e) {
            return { date: '', time: '' };
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

    // Helper: Render Status Badge (Tick marks)
    const renderStatusBadge = (item, type) => {
        let ticks = '✓';
        let tickColor = '#16a34a'; // green

        if (type === 'received') {
            if (!item.read) {
                // NEW = Delivered but unread = 2 green ticks
                ticks = '✓✓';
                tickColor = '#16a34a';
            } else {
                // READ = 2 blue ticks
                ticks = '✓✓';
                tickColor = '#2563eb';
            }
        } else {
            // Sent items
            const s = (item.status || '').toLowerCase();
            if (s === 'resolved' || s === 'read' || s === 'reviewed') {
                // READ = 2 blue ticks
                ticks = '✓✓';
                tickColor = '#2563eb';
            } else if (s === 'new' || s === 'pending' || s === 'delivered') {
                // DELIVERED = 2 green ticks
                ticks = '✓✓';
                tickColor = '#16a34a';
            } else {
                // SENT = 1 green tick
                ticks = '✓';
                tickColor = '#16a34a';
            }
        }

        return (
            <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: tickColor,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-2px',
                whiteSpace: 'nowrap'
            }}>
                {ticks}
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
                background: 'var(--color-bg-secondary)',
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
                                flex: 1, padding: '1rem 0.25rem', background: activeTab === tab.id ? 'rgba(15, 23, 42, 0.95)' : 'transparent', border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                borderTopLeftRadius: activeTab === tab.id ? 'var(--radius-md)' : '0',
                                borderTopRightRadius: activeTab === tab.id ? 'var(--radius-md)' : '0',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s ease',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                            }}
                        >
                            <span style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>{tab.icon}</span>
                            <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>

                {/* RECEIVED TAB */}
                {activeTab === 'received' && (
                    <div className="notification-list" style={{ marginTop: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
                            {baseNotifications.length === 0 ? (
                                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪹</span>
                                    <p style={{ fontSize: '1.1rem', margin: 0 }}>{t('inbox.empty') || 'Your nest is empty'}</p>
                                </div>
                            ) : (
                                <>
                                    {filteredNotifications.length === 0 ? (
                                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', width: '100%', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</span>
                                            <p style={{ fontSize: '1rem', margin: 0 }}>No messages match this filter</p>
                                        </div>
                                    ) : (
                                        filteredNotifications.map(notification => {
                                            const isDeleting = messageToDelete?.id === notification.id;
                                            console.log('Rendering Notification:', { id: notification.id, title: notification.title, image_url: notification.image_url });
                                            return (
                                                <SwipeableMessage
                                                    key={notification.id}
                                                    swipeDirection={swipeDirection}
                                                    onSwipeDelete={() => handleDeleteClick(null, notification.id, 'received')}
                                                >
                                                    {/* (Message Item Content Omitted for Brevity - Keeping existing structure) */}
                                                    <div
                                                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                                        onClick={() => {
                                                            markAsRead(notification.id);
                                                            setSelectedMessage(notification);
                                                            setViewingImageOnly(false);
                                                        }}
                                                        style={{
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            padding: '0.75rem',
                                                            borderRadius: 'var(--radius-md)',
                                                            border: '1px solid var(--color-border)',
                                                            margin: '0 0 0.75rem 0',
                                                            background: '#0f172a'
                                                        }}
                                                    >
                                                        {/* 1. Header Row */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span className="notification-icon" style={{ fontSize: '1.4rem', margin: 0, width: 'auto', height: 'auto', background: 'none' }}>
                                                                    {notification.type === 'alert' ? '🚨' : notification.type === 'success' ? '✅' : notification.type === 'reward' ? '🏆' : '🔔'}
                                                                </span>
                                                                <span className="notification-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                                                    {notification.title}
                                                                </span>
                                                            </div>
                                                            <div style={{ justifySelf: 'center' }}>{renderStatusBadge(notification, 'received')}</div>
                                                            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.3, minWidth: '120px' }}>
                                                                <div>{formatDateTime(notification.created_at).date}</div>
                                                                <div>{formatDateTime(notification.created_at).time}</div>
                                                            </div>
                                                        </div>
                                                        {/* 2. Body Row */}
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
                                                            wordBreak: 'break-word',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            {notification.body}
                                                        </div>
                                                        {/* 3. Footer Row */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (notification.image_url) {
                                                                        setSelectedMessage(notification);
                                                                        setViewingImageOnly(true);
                                                                    }
                                                                }}
                                                                style={{ fontSize: '1.2rem', lineHeight: 1, cursor: notification.image_url ? 'pointer' : 'default' }}
                                                            >
                                                                {notification.image_url ? '🖼️' : ''}
                                                            </div>
                                                            <div>
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
                                        })
                                    )}
                                    {filteredNotifications.some(n => !n.read) && (
                                        <button onClick={markAllAsRead} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
                                            {t('inbox.markAllRead') || 'Mark all as read'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        {renderReceivedSummaryBadges()}
                    </div>
                )}

                {/* SENT TAB */}
                {activeTab === 'sent' && (
                    <div className="notification-list" style={{ marginTop: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
                            {loadingSent ? (
                                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                    <span style={{ fontSize: '2rem' }}>⌛</span>
                                    <p>{t('common.loading') || 'Loading...'}</p>
                                </div>
                            ) : baseSent.length === 0 ? (
                                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪹</span>
                                    <p style={{ fontSize: '1.1rem', margin: 0 }}>{t('inbox.noSent') || 'No hatchlings in the nest'}</p>
                                </div>
                            ) : (
                                <>
                                    {filteredSent.length === 0 ? (
                                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</span>
                                            <p style={{ fontSize: '1.1rem', margin: 0 }}>No messages match this filter</p>
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
                                                        margin: '0 0 0.75rem 0',
                                                        background: '#0f172a'
                                                    }}>
                                                        {/* 1. Header Row: Icon/Title | Badge | Stacked Timestamp */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                                                            {/* Left: Icon + Title */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span className="notification-icon" style={{ fontSize: '1.4rem', margin: 0, width: 'auto', height: 'auto', background: 'none' }}>
                                                                    {msg.type === 'bug' ? '🐛' : msg.type === 'suggestion' ? '💡' : '💭'}
                                                                </span>
                                                                <span className="notification-title" style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--color-text)' }}>
                                                                    {getFeedbackTitle(msg.type)}
                                                                </span>
                                                            </div>

                                                            {/* Center: Status Badge */}
                                                            <div style={{ justifySelf: 'center' }}>
                                                                {renderStatusBadge(msg, 'sent')}
                                                            </div>

                                                            {/* Right: Stacked Date/Time */}
                                                            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.3, minWidth: '120px' }}>
                                                                <div>{formatDateTime(msg.created_at).date}</div>
                                                                <div>{formatDateTime(msg.created_at).time}</div>
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
                                                            wordBreak: 'break-word',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            {msg.message}
                                                        </div>

                                                        {/* 3. Footer Row: Stars (Left) | Bin (Right) */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                                                            {/* Left: Stars */}
                                                            <div>
                                                                {msg.rating && (
                                                                    <div style={{ fontSize: '0.9rem', color: '#f59e0b', lineHeight: 1 }}>
                                                                        {'⭐'.repeat(msg.rating)}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Right: Bin Icon */}
                                                            <div>
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
                                </>
                            )}
                        </div>
                        {renderSentSummaryBadges()}
                    </div>
                )}

                {/* COMPOSE TAB */}
                {activeTab === 'compose' && (
                    <FeedbackSection onFeedbackSent={fetchSent} />
                )}
            </div>
            {/* Message Popup Modal */}
            {selectedMessage && (
                <NotificationPopup
                    message={selectedMessage}
                    imageOnly={viewingImageOnly}
                    onDismiss={() => {
                        setSelectedMessage(null);
                        setViewingImageOnly(false);
                    }}
                    onMarkRead={() => {
                        markAsRead(selectedMessage.id);
                        setSelectedMessage(null);
                        setViewingImageOnly(false);
                    }}
                />
            )}
        </div>
    );
};

export default NotificationList;
