import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
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

        logger.aggressive('Inbox', 'Sending feedback/message...', { type, length: message.length });
        setLoading(true);
        try {
            await api.submitFeedback(type, message.trim(), rating);

            logger.default(['Inbox', 'Composer'], 'Message sent successfully');
            setSuccess(true);
            setMessage('');
            setRating(5);
            setTimeout(() => setSuccess(false), 3000);
            if (onFeedbackSent) onFeedbackSent();
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            logger.error('Inbox', 'Failed to send message', { error: err.message });
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '0.25rem', height: '100%', width: '100%', display: 'block', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                {t('feedback.description') || 'Report bugs or suggest improvements.'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {['bug', 'suggestion', 'other'].map(typeOption => (
                    <button
                        key={typeOption}
                        onClick={() => {
                            logger.aggressive(['Inbox', 'Interaction'], 'Feedback type changed', { type: typeOption });
                            setType(typeOption);
                        }}
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
                        {typeOption === 'bug' ? (t('feedback.types.bug') || '🐛 Bug') : typeOption === 'suggestion' ? (t('feedback.types.suggestion') || '💡 Idea') : (t('feedback.types.other') || '📝 Other')}
                    </button>
                ))}
            </div>

            <textarea
                key={success ? 'submitted' : 'editing'}
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value.slice(0, 500));
                    if (e.target.value.length % 10 === 0) { // Log every 10 chars to avoid spamming aggressive inputs too much
                        logger.aggressive(['Inbox', 'Interaction'], 'Feedback input changed', { length: e.target.value.length });
                    }
                }}
                placeholder={t('feedback.placeholder') || 'Describe your feedback...'}
                maxLength={500}
                style={{
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    height: '110px',
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
            <div style={{ marginBottom: '1rem', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '0.1rem', textAlign: 'center', fontWeight: 500 }}>
                    {t('feedback.rateApp') || 'Rate the App'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => {
                                logger.aggressive(['Inbox', 'Interaction'], 'Rating selected', { rating: star });
                                setRating(star);
                            }}
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
                {success ? t('feedback.sentStatus') : loading ? t('feedback.sending') : t('feedback.send')}
            </button>
        </div>
    );
};

// Swipeable Message Item Component with Progressive Blur
const SwipeableMessage = ({ children, onSwipeDelete, onConfirm, onCancel, swipeDirection = 'right', hideButton = false, style, className, onClick, isDeleting }) => {
    const { t } = useLanguage();
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const [swiping, setSwiping] = useState(false);
    const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1
    const SWIPE_THRESHOLD = 80;

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentX.current = e.touches[0].clientX;
        setSwiping(true);
        setSwipeProgress(0);
    };

    const handleTouchMove = (e) => {
        if (!swiping) return;
        touchCurrentX.current = e.touches[0].clientX;

        const diff = touchCurrentX.current - touchStartX.current;
        const absDiff = Math.abs(diff);

        // Only track progress if swiping in the allowed direction(s)
        const isCorrectDirection =
            (swipeDirection === 'both') ||
            (swipeDirection === 'right' && diff > 0) ||
            (swipeDirection === 'left' && diff < 0);

        if (isCorrectDirection) {
            // Calculate progress as percentage of threshold (capped at 1)
            const progress = Math.min(absDiff / SWIPE_THRESHOLD, 1);
            setSwipeProgress(progress);
        } else {
            setSwipeProgress(0);
        }
    };

    const handleTouchEnd = () => {
        if (!swiping) return;
        setSwiping(false);

        const diff = touchCurrentX.current - touchStartX.current;
        const absDiff = Math.abs(diff);

        // Check if swipe met allow criteria
        const isRightSwipe = diff > SWIPE_THRESHOLD;
        const isLeftSwipe = diff < -SWIPE_THRESHOLD;

        const isValidSwipe =
            (swipeDirection === 'both' && (isRightSwipe || isLeftSwipe)) ||
            (swipeDirection === 'right' && isRightSwipe) ||
            (swipeDirection === 'left' && isLeftSwipe);

        if (isValidSwipe) {
            onSwipeDelete();
        } else {
            setSwipeProgress(0);
        }
    };

    // Reset progress when deletion cancelled
    useEffect(() => {
        if (!isDeleting) setSwipeProgress(0);
    }, [isDeleting]);

    const effectiveProgress = isDeleting ? 1 : swipeProgress;

    // Calculate blur based on progress (max 4px to match deletion overlay)
    const blurAmount = effectiveProgress * 4;

    const deleteButtonStyle = {
        padding: '0.5rem 4rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-md)',
        color: '#ef4444',
        fontSize: '0.85rem',
        cursor: 'pointer',
        fontWeight: 500,
        pointerEvents: isDeleting ? 'auto' : 'none'
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={onClick}
            className={className}
            style={{
                ...style,
                position: 'relative', // Needed for absolute overlay
                overflow: 'hidden', // Contain overlay
                transition: swiping ? 'none' : 'filter 0.2s ease-out'
            }}
        >
            {/* Darkening Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: '#0f172a', // Dark background color
                opacity: effectiveProgress * 0.7, // Target 0.7 opacity at max
                zIndex: 10,
                pointerEvents: 'none',
                transition: swiping ? 'none' : 'opacity 0.2s ease-out'
            }} />

            {/* UI Layer */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: hideButton ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20,
                opacity: effectiveProgress,
                pointerEvents: isDeleting ? 'auto' : 'none',
                transition: swiping ? 'none' : 'opacity 0.2s ease-out'
            }}
                onClick={(e) => {
                    if (isDeleting && onCancel) {
                        e.stopPropagation();
                        onCancel();
                    }
                }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onConfirm) onConfirm();
                    }}
                    style={{
                        ...deleteButtonStyle,
                        transform: `scale(${0.9 + 0.1 * effectiveProgress})`,
                        transition: swiping ? 'none' : 'transform 0.2s ease-out'
                    }}
                >
                    {t('common.delete')}
                </button>
            </div>

            {/* Content with Blur */}
            <div style={{
                filter: effectiveProgress > 0 ? `blur(${blurAmount}px)` : 'none',
                transition: swiping ? 'none' : 'filter 0.2s ease-out',
                height: '100%'
            }}>
                {children}
            </div>
        </div>
    );
};

const NotificationList = ({ notifications, markAsRead, markAllAsRead, settings, toggleSettings, onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('received');
    const [sentMessages, setSentMessages] = useState([]);
    const [loadingSent, setLoadingSent] = useState(true);
    const [retention, setRetention] = useState(() => localStorage.getItem('nestfinder_message_retention') || '1m');

    const [swipeDirection, setSwipeDirection] = useState(() => {
        const val = localStorage.getItem('nestfinder_swipe_direction');
        return (val && val !== 'null') ? val : 'both';
    });
    const [swipeEnabled, setSwipeEnabled] = useState(() => {
        try {
            const stored = localStorage.getItem('nestfinder_swipe_enabled');
            return stored !== 'false';
        } catch (e) { return true; }
    });
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [viewingImageOnly, setViewingImageOnly] = useState(false);

    // Listen for setting changes
    useEffect(() => {
        const handleStorage = () => {
            setRetention(localStorage.getItem('nestfinder_message_retention') || '1m');
            const val = localStorage.getItem('nestfinder_swipe_direction');
            setSwipeDirection((val && val !== 'null') ? val : 'both');

            const storedEnabled = localStorage.getItem('nestfinder_swipe_enabled');
            setSwipeEnabled(storedEnabled !== 'false'); // Default true
        };
        handleStorage(); // Ensure initial load matches if localStorage changed elsewhere
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Fetch sent messages
    const fetchSent = async (silent = false) => {
        if (!silent) setLoadingSent(true);
        try {
            const data = await api.getFeedback();
            if (data && data.feedback) {
                setSentMessages(data.feedback);
            }
        } catch (err) {
            console.error('Failed to fetch sent messages', err);
        } finally {
            if (!silent) setLoadingSent(false);
        }
    };

    useEffect(() => {
        fetchSent();
        // Poll for status updates (e.g. delivered/read ticks) every 5s
        const interval = setInterval(() => fetchSent(true), 5000);

        // Listen for real-time updates via WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // const wsUrl = `${wsProtocol}//${window.location.host}`; // Production
        // For dev/mixed env, use API_URL base if available, else window.location
        // Assuming the app has a global WS connection or we create one here?
        // The app likely uses a global connection or context. 
        // Checking existing code... Client seems to not have a global WS Context exposed here easily?
        // OBSERVATION: The Home.jsx doesn't seem to set up a global WS. 
        // BUT `Admin` uses `useWebSocket`.
        // `NotificationList` is used in `MapView`.
        // Let's check if we can access the WS.
        // For now, let's stick to polling as the primary, but add a standalone WS listener if we want "Instant".
        // Actually, creating a new WS connection just for this component might be overkill if it mounts/unmounts often.
        // But `NotificationList` is usually a persistent modal/panel.

        const ws = new WebSocket(`${wsProtocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'feedback_update') {
                    setSentMessages(prev => prev.map(msg =>
                        msg.id === data.id ? { ...msg, status: data.status } : msg
                    ));
                }
            } catch (e) {
                // Ignore parse errors
            }
        };

        return () => {
            clearInterval(interval);
            ws.close();
        };
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

    const performDelete = async (id, type) => {
        try {
            if (type === 'received') {
                await api.deleteNotification(id);
                setDeletedIds(prev => new Set(prev).add(id));
            } else if (type === 'broadcast') {
                await api.deleteBroadcast(id);
                setDeletedIds(prev => new Set(prev).add(id));
            } else {
                await api.deleteFeedback(id);
                setSentMessages(prev => prev.filter(m => m.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const confirmDelete = async (e) => {
        if (e) e.stopPropagation();
        if (!messageToDelete) return;
        const { id, type } = messageToDelete;
        await performDelete(id, type);
        setMessageToDelete(null);
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
        { id: 'received', icon: '\u{1FABA}', label: t('inbox.received') || 'Received' },
        { id: 'sent', icon: '\u{1FAB9}', label: t('inbox.sent') || 'Sent' },
        { id: 'compose', icon: '\u{1FAB6}', label: t('inbox.compose') || 'Compose' } // Feather U+1FAB6
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
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: 'none',
                flexShrink: 0
            }}>
                <SummaryBadge label="Total" count={totalCount} color="#a855f7" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Total'); setReceivedFilter(null); }} isActive={receivedFilter === null} />
                <SummaryBadge label="Pending" count={unreadCount} color="#22c55e" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Pending'); setReceivedFilter('new'); }} isActive={receivedFilter === 'new'} />
                <SummaryBadge label="Read" count={readCount} color="#3b82f6" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Read'); setReceivedFilter('read'); }} isActive={receivedFilter === 'read'} />
            </div>
        );
    };

    // Render sticky footer badges row for Sent tab
    const renderSentSummaryBadges = () => {
        const totalCount = baseSent.length;
        if (totalCount === 0) return null;
        const sentCount = baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            return !s || s === 'sent' || s === 'new'; // 'new' kept for legacy/transitions
        }).length;
        const deliveredCount = baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            return s === 'delivered' || s === 'pending';
        }).length;
        const readCount = baseSent.filter(m => {
            const s = (m.status || '').toLowerCase();
            return s === 'read' || s === 'resolved' || s === 'reviewed';
        }).length;
        return (
            <div style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: 'none',
                flexShrink: 0
            }}>
                <SummaryBadge label="Total" count={totalCount} color="#a855f7" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Total (Sent)'); setSentFilter(null); }} isActive={sentFilter === null} />
                <SummaryBadge label="Sent" count={sentCount} color="#94a3b8" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Sent'); setSentFilter('sent'); }} isActive={sentFilter === 'sent'} />
                <SummaryBadge label="Delivered" count={deliveredCount} color="#22c55e" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Delivered'); setSentFilter('delivered'); }} isActive={sentFilter === 'delivered'} />
                <SummaryBadge label="Read" count={readCount} color="#3b82f6" onClick={() => { logger.aggressive(['Inbox', 'Interaction'], 'Filter changed: Read (Sent)'); setSentFilter('read'); }} isActive={sentFilter === 'read'} />
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
                    {t('common.delete')}
                </button>
            </div>
        );
    };

    // Helper: Format Date/Time (split into two lines)
    // Helper: Format Date/Time (split into two lines)
    const formatDateTime = (dateString) => {
        try {
            // Normalize inputs
            if (!dateString) return { date: '', time: '' };

            // Ensure YYYY-MM-DDTHH:MM:SSZ format
            const utcString = dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z');
            const d = new Date(utcString);

            if (isNaN(d.getTime())) return { date: '', time: '' }; // Safety check

            // Use native Intl for Paris formatting (handles DST automatically)
            const datePart = d.toLocaleDateString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                timeZone: 'Europe/Paris'
            });

            // timeZoneName: 'short' -> 'CET' or 'CEST' (standard in browsers)
            // But we can get just the time and append custom logic if preferred, 
            // OR trust the browser. en-GB short is usually "CET" or "CEST".
            // Let's stick to safe parsing first.
            const timePartWithZone = d.toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZone: 'Europe/Paris',
                timeZoneName: 'short',
                hour12: false
            });

            // timePartWithZone output: "14:30:00 CET" or "14:30:00 CEST"
            // We can return it directly or parse if we need specific formatting.
            // Returning directly is safest.
            const [time, zone] = timePartWithZone.split(' ');

            // If strict formatting needed:
            return { date: datePart, time: timePartWithZone };

        } catch (e) {
            console.error('Date parsing error', e);
            return { date: '', time: '' };
        }
    };

    // Helper: Get title based on feedback type
    const getFeedbackTitle = (type, t) => {
        switch (type) {
            case 'bug': return t('feedback.bugReport') || 'Bug Report';
            case 'suggestion': return t('feedback.suggestion') || 'Suggestion';
            default: return t('feedback.general') || 'Feedback';
        }
    };

    // Helper: Determine CSS class based on notification type

    const renderStatusBadge = (item, type) => {
        // Broadcasts: No ticks (Issue 1)
        // Broadcasts: No ticks for now (or maybe we add them later)
        // if (item.type === 'broadcast') return null; // ALLOW rendering for persistence

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
            if (s === 'read' || s === 'resolved' || s === 'reviewed') {
                // READ = 2 blue ticks
                ticks = '✓✓';
                tickColor = '#2563eb';
            } else if (s === 'delivered' || s === 'pending') {
                // DELIVERED = 2 green ticks
                ticks = '✓✓';
                tickColor = '#16a34a';
            } else {
                // SENT = 1 green tick (catch-all for 'sent', 'new', etc)
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
            <style>{`
                .notification-item { position: relative; }
                .delete-btn-hover { opacity: 0; transition: opacity 0.2s; }
                .notification-item:hover .delete-btn-hover { opacity: 1; }
            `}</style>
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
                            onClick={() => {
                                logger.aggressive(['Inbox', 'Interaction'], 'Tab switched', { tab: tab.id });
                                setActiveTab(tab.id);
                            }}
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
                            <span style={{ fontSize: '2rem', lineHeight: 1.2 }}>{tab.icon}</span>
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
                                            <p style={{ fontSize: '1rem', margin: 0 }}>{t('inbox.noFilterMatch')}</p>
                                        </div>
                                    ) : (
                                        filteredNotifications.map(notification => {
                                            const isDeleting = messageToDelete?.id === notification.id;
                                            console.log('Rendering Notification:', { id: notification.id, title: notification.title, image_url: notification.image_url });
                                            return (
                                                <SwipeableMessage
                                                    key={notification.id}
                                                    swipeDirection={swipeDirection} // Always enable swipe gesture
                                                    hideButton={!swipeEnabled} // Hide button UI if Instant Mode (Safe Delete OFF)
                                                    isDeleting={isDeleting}
                                                    onSwipeDelete={() => {
                                                        // If Safe Delete is OFF (Instant Mode), delete immediately
                                                        // If Safe Delete is ON, trigger confirmation/reveal (handleDeleteClick)
                                                        if (!swipeEnabled) {
                                                            performDelete(notification.id, notification.type === 'broadcast' ? 'broadcast' : 'received');
                                                        } else {
                                                            handleDeleteClick(null, notification.id, notification.type === 'broadcast' ? 'broadcast' : 'received');
                                                        }
                                                    }}
                                                    onConfirm={() => confirmDelete()}
                                                    onCancel={cancelDelete}
                                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                                    onClick={() => {
                                                        markAsRead(notification);
                                                        setSelectedMessage(notification);
                                                        setViewingImageOnly(false);
                                                    }}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--color-border)',
                                                        margin: '0 0 0.75rem 0',
                                                        background: '#0f172a',
                                                        position: 'relative' // Ensure relative for button positioning
                                                    }}
                                                >
                                                    {/* Hover Delete Button */}
                                                    {!swipeEnabled && (
                                                        <button
                                                            className="delete-btn-hover"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(null, notification.id, notification.type === 'broadcast' ? 'broadcast' : 'received');
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '0.5rem',
                                                                right: '0.5rem',
                                                                background: 'rgba(239, 68, 68, 0.9)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '28px',
                                                                height: '28px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                zIndex: 10,
                                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                            }}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                    {/* (Message Item Content Omitted for Brevity - Keeping existing structure) */}
                                                    {/* 1. Header Row */}
                                                    {/* 1. Header Row */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span className="notification-icon" style={{ fontSize: '1.4rem', margin: 0, width: 'auto', height: 'auto', background: 'none' }}>
                                                                {notification.type === 'alert' ? '🚨' : notification.type === 'success' ? '✅' : notification.type === 'reward' ? '🏆' : '🔔'}
                                                            </span>
                                                            <span className="notification-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                                                {notification.title}
                                                            </span>
                                                        </div>
                                                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.3, minWidth: '120px' }}>
                                                            <div>{formatDateTime(notification.client_received_at || notification.fetched_at || notification.created_at).date}</div>
                                                            <div>{formatDateTime(notification.client_received_at || notification.fetched_at || notification.created_at).time}</div>
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
                                                            style={{
                                                                fontSize: '1.2rem',
                                                                lineHeight: 1,
                                                                cursor: notification.image_url ? 'pointer' : 'default',
                                                                padding: '8px',
                                                                margin: '-8px',
                                                                minWidth: '40px',
                                                                minHeight: '40px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {notification.image_url ? '🖼️' : ''}
                                                        </div>
                                                        <div>{renderStatusBadge(notification, 'received')}</div>
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
                                                </SwipeableMessage>
                                            );
                                        })
                                    )}
                                    {filteredNotifications.some(n => !n.read) && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="btn btn-primary btn-sm"
                                            style={{
                                                width: '100%',
                                                marginTop: '0.75rem',
                                                marginBottom: '0.75rem'
                                            }}
                                        >
                                            Mark all as read
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
                                                    hideButton={!swipeEnabled}
                                                    isDeleting={isDeleting}
                                                    onSwipeDelete={() => {
                                                        if (!swipeEnabled) {
                                                            performDelete(msg.id, 'sent');
                                                        } else {
                                                            handleDeleteClick(null, msg.id, 'sent');
                                                        }
                                                    }}
                                                    onConfirm={() => confirmDelete()}
                                                    onCancel={cancelDelete}
                                                    className="notification-item read"
                                                    onClick={() => {
                                                        // Normalize 'Sent' message structure for the common Popup
                                                        setSelectedMessage({
                                                            ...msg,
                                                            title: getFeedbackTitle(msg.type, t),
                                                            body: msg.message
                                                        });
                                                        setViewingImageOnly(false);
                                                    }}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--color-border)',
                                                        margin: '0 0 0.75rem 0',
                                                        background: '#0f172a'
                                                    }}
                                                >
                                                    {/* 1. Header Row: Icon/Title | Stacked Timestamp */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                                                        {/* Left: Icon + Title */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span className="notification-icon" style={{ fontSize: '1.4rem', margin: 0, width: 'auto', height: 'auto', background: 'none' }}>
                                                                {msg.type === 'bug' ? '🐛' : msg.type === 'suggestion' ? '💡' : '💭'}
                                                            </span>
                                                            <span className="notification-title" style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--color-text)' }}>
                                                                {getFeedbackTitle(msg.type, t)}
                                                            </span>
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

                                                    {/* 3. Footer Row: Stars (Left) | Ticks (Center) | Bin (Right) */}
                                                    <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                                                        {/* Left: Stars */}
                                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                                                            {msg.rating && (
                                                                <div style={{ fontSize: '0.9rem', color: '#f59e0b', lineHeight: 1 }}>
                                                                    {'⭐'.repeat(msg.rating)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Center: Status Badge */}
                                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>{renderStatusBadge(msg, 'sent')}</div>

                                                        {/* Right: Bin Icon */}
                                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
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
            {
                selectedMessage && (
                    <NotificationPopup
                        message={selectedMessage}
                        imageOnly={viewingImageOnly}
                        onDismiss={() => {
                            setSelectedMessage(null);
                            setViewingImageOnly(false);
                        }}
                        onMarkRead={() => {
                            markAsRead(selectedMessage);
                            setSelectedMessage(null);
                            setViewingImageOnly(false);
                        }}
                    />
                )
            }
        </div >
    );
};

export default NotificationList;
