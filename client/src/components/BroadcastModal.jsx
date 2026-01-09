import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { api } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';

const SEEN_BROADCASTS_KEY = 'nestfinder_seen_broadcasts';

const BroadcastModal = ({ isSettled = false }) => {
    const { t } = useLanguage();
    const [broadcast, setBroadcast] = useState(null);
    const [visible, setVisible] = useState(false);
    const hasFetched = useRef(false);

    // Get seen broadcast IDs from localStorage
    const getSeenIds = () => {
        try {
            const stored = localStorage.getItem(SEEN_BROADCASTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    // Mark broadcast as seen
    const markSeen = (id) => {
        const seen = getSeenIds();
        if (!seen.includes(id)) {
            seen.push(id);
            localStorage.setItem(SEEN_BROADCASTS_KEY, JSON.stringify(seen));
        }
    };

    // Poll for broadcasts
    useEffect(() => {
        if (!isSettled) return;

        const checkForBroadcast = async () => {
            if (document.hidden) return;

            try {
                const response = await api.fetch('/points/broadcast/active');
                if (response.broadcast) {
                    const seenIds = getSeenIds();
                    if (!seenIds.includes(response.broadcast.id)) {
                        setBroadcast(response.broadcast);
                        setVisible(true);
                    }
                }
            } catch (error) {
                console.error('Failed to poll broadcast:', error);
            }
        };

        const initialTimer = setTimeout(checkForBroadcast, 1000);
        const interval = setInterval(checkForBroadcast, 60 * 1000);

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkForBroadcast();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isSettled]);

    const handleDismiss = async () => {
        if (broadcast) {
            markSeen(broadcast.id);
            try {
                await api.post(`/points/broadcast/${broadcast.id}/read`);
            } catch (e) {
                console.warn('Failed to mark broadcast as read:', e);
            }
        }
        setVisible(false);
    };

    if (!visible || !broadcast) return null;

    // Format timestamp like NotificationPopup
    const formatTimestamp = (dateStr) => {
        try {
            const utcTime = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
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
            return '';
        }
    };

    return ReactDOM.createPortal(
        <div
            className="notification-popup-overlay"
            onClick={handleDismiss}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10001,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                className="notification-popup"
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    borderRadius: 'var(--radius-xl, 16px)',
                    padding: 'var(--space-6, 24px)',
                    maxWidth: '90vw',
                    width: '400px',
                    border: '1px solid var(--color-border, #334155)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    animation: 'slideUp 0.3s ease-out'
                }}
            >
                {/* Icon */}
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px', textAlign: 'center' }}>📢</span>

                {/* Title */}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', textAlign: 'center', color: 'var(--color-text, #f8fafc)' }}>
                    {broadcast.title || t('broadcast.announcement') || 'Announcement'}
                </h3>

                {/* Timestamp */}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '12px', textAlign: 'center' }}>
                    {formatTimestamp(broadcast.created_at || broadcast.start_time)}
                </div>

                {/* Image */}
                {broadcast.image_url && (
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <img
                            src={broadcast.image_url}
                            alt="Broadcast"
                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px' }}
                        />
                    </div>
                )}

                {/* Message */}
                <p style={{
                    margin: '0 0 24px 0',
                    color: 'var(--color-text-muted, #cbd5e1)',
                    lineHeight: '1.6',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap'
                }}>
                    {broadcast.message}
                </p>

                {/* Button */}
                <button
                    className="btn btn-primary btn-block"
                    onClick={handleDismiss}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--color-primary, #3b82f6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: 'var(--font-size-md, 1rem)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    {t('common.gotIt') || 'Got it!'}
                </button>
            </div>
        </div>,
        document.body
    );
};

export default BroadcastModal;
