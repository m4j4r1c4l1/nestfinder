import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { adminApi } from '../api';

const APP_URL = 'https://m4j4r1c4l1.github.io/nestfinder/';
const API_URL = import.meta.env.VITE_API_URL || '';

// --- Custom Badge Dropdown Component ---
const BadgeSelect = ({ value, onChange, options, placeholder, type = 'status' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const getBadgeStyle = (optValue, isSelected) => {
        let bg, color, border;
        const option = options.find(o => o.value === optValue);

        if (option && option.color === null) {
            return {
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.9rem', // Slightly larger to match placeholder
                fontWeight: 400, // Normal weight
                background: 'transparent',
                color: '#94a3b8',
                border: 'none',
                textTransform: 'none', // Normal case
                cursor: 'pointer',
                display: 'inline-block',
                textAlign: 'left',
                minWidth: 'auto'
            };
        }

        if (option && option.color) {
            color = option.color;
            bg = `${color}20`; // 12% opacity
            border = `${color}40`; // 25% opacity
        } else {
            // Fallback / Default
            bg = '#334155'; color = '#94a3b8'; border = '#475569';
        }

        return {
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: bg,
            color: color,
            border: `1px solid ${border}`,
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '80px'
        };
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '38px',
                    boxSizing: 'border-box'
                }}
            >
                {selectedOption && selectedOption.value !== 'all' ? (
                    <span style={getBadgeStyle(selectedOption.value, true)}>{selectedOption.label}</span>
                ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{placeholder}</span>
                )}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    marginTop: '4px',
                    zIndex: 50,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden'
                }}>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={getBadgeStyle(opt.value, false)}>{opt.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Notification templates
const templates = {
    share_app: {
        id: 'share_app',
        name: '🤝 Share App',
        title: 'Spread the Warmth 🪹',
        body: 'Know someone who could help or needs assistance? Share NestFinder with your community and help us grow our network of support.'
    },
    new_points: {
        id: 'new_points',
        name: '🪹 New Locations',
        title: '🪹 New Locations Reported',
        body: 'New assistance locations have been added. Check the map for updates!'
    },
    status_update: {
        id: 'status_update',
        name: '✅ Status Update',
        title: '✅ Status Update',
        body: 'Some locations have been confirmed or updated. Check the latest information!'
    },
    reminder: {
        id: 'reminder',
        name: '📍 Weekly Reminder',
        title: '📍 Weekly Reminder',
        body: 'Have you seen any locations that need updating? Help keep the map accurate!'
    },
    announcement: {
        id: 'announcement',
        name: '📢 Announcement',
        title: '📢 Announcement',
        body: 'We have an important update regarding the NestFinder community.'
    },
    urgent: {
        id: 'urgent',
        name: '🚨 Urgent Notice',
        title: '🚨 Urgent Notice',
        body: 'Emergency alert: Please check the app for critical information.'
    },
    new_feature: {
        id: 'new_feature',
        name: '✨ New Feature',
        title: '✨ New Feature Available!',
        body: 'We just released a new feature to help you find nests even faster.'
    },
    custom: {
        id: 'custom',
        name: '✏️ Custom Message',
        title: '',
        body: ''
    },
    happy_new_year: {
        id: 'happy_new_year',
        name: '🎉 Happy New Year',
        title: 'Happy New Year! 🎆🪹',
        body: 'Wishing everyone a bright and safe 2026! 🌟 Let\'s keep supporting each other and finding new paths to our nests 🪹. Happy New Year from NestFinder! 🏠💙'
    },
    rate_app: {
        id: 'rate_app',
        name: '⭐ Rate this App',
        title: 'Enjoying NestFinder? ⭐',
        body: 'If you find our app helpful, please take a moment to rate us! Your feedback helps us grow and reach more people.'
    },
    community_event: {
        id: 'community_event',
        name: '🎉 Community Event',
        title: '🎉 You\'re Invited!',
        body: 'Join us for a community gathering! Check the events board for more details.'
    },
    maintenance: {
        id: 'maintenance',
        name: '🔧 Maintenance',
        title: '🔧 App Maintenance',
        body: 'NestFinder will be undergoing scheduled maintenance. Expect brief interruptions.'
    }
};

const getTemplateInfo = (key) => {
    if (!key) return { icon: '❓', name: 'Unknown' };
    const map = {
        share_app: { icon: '🤝', name: 'Share App' },
        new_points: { icon: '🪹', name: 'New Locations' },
        status_update: { icon: '✅', name: 'Status Update' },
        reminder: { icon: '📍', name: 'Weekly Reminder' },
        announcement: { icon: '📢', name: 'Announcement' },
        urgent: { icon: '🚨', name: 'Urgent Notice' },
        rate_app: { icon: '⭐', name: 'Rate this App' },
        new_feature: { icon: '✨', name: 'New Feature' },
        happy_new_year: { icon: '🎉', name: 'Happy New Year' },
        custom: { icon: '✏️', name: 'Custom Message' },
        community_event: { icon: '🎉', name: 'Community Event' },
        maintenance: { icon: '🔧', name: 'Maintenance' }
    };
    return map[key] || { icon: '❓', name: key };
};


// Helper for CET time
const formatTimeCET = (dateObj) => {
    const time = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
    return `${time} CET`;
};

const formatDateTimeCET = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Europe/Paris',
        hour12: false
    }) + ' CET';
};

const Messages = () => {
    // Custom styles for DatePicker
    const datePickerStyles = `
        .react-datepicker {
            font-family: inherit;
            background-color: #1e293b;
            border: 1px solid #334155;
            color: #f8fafc;
        }
        .react-datepicker__header {
            background-color: #0f172a;
            border-bottom: 1px solid #334155;
        }
        .react-datepicker__current-month, .react-datepicker-time__header {
            color: #f8fafc;
        }
        .react-datepicker__day-name {
            color: #94a3b8;
        }
        .react-datepicker__day {
            color: #cbd5e1;
        }
        .react-datepicker__day:hover {
            background-color: #334155;
        }
        .react-datepicker__day--today {
            background-color: #334155;
            color: #f8fafc;
            border-radius: 0.3rem;
        }
        .react-datepicker__day--selected, .react-datepicker__time-list-item--selected {
            background-color: #3b82f6 !important;
            color: white !important;
        }
        .react-datepicker__time-container {
            border-left: 1px solid #334155;
        }
        .react-datepicker__time-container .react-datepicker__time {
            background-color: #1e293b;
        }
        .react-datepicker__time-list-item {
            color: #cbd5e1;
        }
        .react-datepicker__time-list-item:hover {
            background-color: #334155 !important;
        }
        .react-datepicker-wrapper {
            width: 100%;
        }
        .custom-datepicker-input {
            width: 100%;
            padding: 0.5rem;
            background-color: #0f172a;
            border: 1px solid #334155;
            border-radius: 6px;
            color: #f8fafc;
            font-size: 0.95rem;
        }
        .custom-datepicker-input:focus {
            outline: 2px solid #3b82f6;
            border-color: #3b82f6;
        }
    `;
    const [activeTab, setActiveTab] = useState('broadcasts'); // DEBUG: Default to broadcasts for testing
    const [loading, setLoading] = useState(true);
    const [justPublished, setJustPublished] = useState(false); // Feedback state for Publish button

    // Data State
    const [broadcasts, setBroadcasts] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({ totalSubscribers: 0 });

    // Pagination for Broadcasts
    const [broadcastPage, setBroadcastPage] = useState(1);
    const broadcastPageSize = 50; // Increased to 50 per request

    // Feedback Pagination & Sort State
    const [feedbackPage, setFeedbackPage] = useState(1);
    const [feedbackPageSize, setFeedbackPageSize] = useState(50);
    const [feedbackSortCol, setFeedbackSortCol] = useState('created_at');
    const [feedbackSortDir, setFeedbackSortDir] = useState('desc');
    const [totalFeedback, setTotalFeedback] = useState(0);
    const [feedbackCounts, setFeedbackCounts] = useState({ pending: 0, read: 0 });

    // Broadcast Form State
    const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', imageUrl: '', startTime: '', endTime: '', maxViews: '', priority: null });
    const [creatingBroadcast, setCreatingBroadcast] = useState(false);
    const [activeBroadcastTemplate, setActiveBroadcastTemplate] = useState('custom');
    const [showBroadcastEmojiPicker, setShowBroadcastEmojiPicker] = useState(false);

    // Custom Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    // Watch for Feedback Pagination Changes
    useEffect(() => {
        fetchFeedbackOnly();
    }, [feedbackPage, feedbackSortCol, feedbackSortDir]);

    const fetchFeedbackOnly = async () => {
        try {
            const res = await adminApi.fetch(`/admin/feedback?page=${feedbackPage}&limit=${feedbackPageSize}&sort=${feedbackSortCol}&dir=${feedbackSortDir}`);
            setFeedback(res.feedback || []);
            setTotalFeedback(res.total || 0);
            setFeedbackCounts({
                pending: res.pendingCount || 0,
                read: res.readCount || 0
            });
        } catch (err) {
            console.error('Failed to fetch feedback:', err);
        }
    };

    // Initial Load & Interval (Keep existing efficient pattern but allow independent feedback updates)
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const [broadcastRes, statsRes] = await Promise.all([
                adminApi.fetch('/admin/broadcasts'),
                fetch(`${API_URL}/api/push/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.ok ? res.json() : { subscribers: [], totalSubscribers: 0 })
            ]);

            setBroadcasts(broadcastRes.broadcasts || []);
            setSubscribers(statsRes.subscribers || []);
            setStats(statsRes);

            // Also refresh feedback in background (using current pagination)
            fetchFeedbackOnly();
        } catch (err) {
            console.error('Failed to fetch messages data:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Broadcast Handlers ---
    const handleCreateBroadcast = async (e) => {
        e.preventDefault();
        setCreatingBroadcast(true);

        try {
            // Helper to convert local input time to UTC ISO string
            const toISO = (dateStr) => {
                if (!dateStr) return null;
                return new Date(dateStr).toISOString();
            };

            // Default startTime to NOW if not provided
            const finalStartTime = newBroadcast.startTime ? toISO(newBroadcast.startTime) : new Date().toISOString();
            // Allow endTime to be null (Infinite Duration)
            const finalEndTime = newBroadcast.endTime ? toISO(newBroadcast.endTime) : null;

            await adminApi.fetch('/admin/broadcasts', {
                method: 'POST',
                body: JSON.stringify({
                    ...newBroadcast,
                    startTime: finalStartTime,
                    endTime: finalEndTime
                })
            });

            // Set success feedback
            setJustPublished(true);
            setTimeout(() => setJustPublished(false), 2000); // 2s is better for reading

            setNewBroadcast({ title: '', message: '', imageUrl: '', startTime: '', endTime: '', maxViews: '', priority: null });
            setActiveBroadcastTemplate('custom');
            fetchData();
        } catch (err) {
            console.error('Failed to create broadcast:', err);
        }
        setCreatingBroadcast(false);
    };

    const handleBroadcastTemplateChange = async (templateId) => {
        const tmpl = templates[templateId];
        if (!tmpl) return;

        setActiveBroadcastTemplate(templateId);

        // Build update object with title and message
        const updates = {
            title: tmpl.title || '',
            message: tmpl.body || '',
            imageUrl: ''
        };

        // Handle special templates
        if (templateId === 'happy_new_year') {
            updates.imageUrl = 'https://nestfinder-sa1g.onrender.com/images/new_year_2026.png';
        } else if (templateId === 'share_app') {
            // Generate QR code using the same logic as ComposeSection
            try {
                const qrDataUrl = await QRCode.toDataURL(APP_URL, {
                    width: 500,
                    margin: 0,
                    color: { dark: '#1e293b', light: '#ffffff' },
                    errorCorrectionLevel: 'H'
                });

                // Add border and emoji (simplified version)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = qrDataUrl;
                });

                const border = 30;
                canvas.width = img.width + border * 2;
                canvas.height = img.height + border * 2;

                // Gradient background
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#8b5cf6');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR
                ctx.drawImage(img, border, border);

                // Center emoji
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const radius = canvas.width / 6;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.font = `${radius * 1.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🪹', centerX, centerY + radius * 0.1);

                updates.imageUrl = canvas.toDataURL('image/png');
            } catch (err) {
                console.error('QR generation failed:', err);
            }
        }

        setNewBroadcast(prev => ({ ...prev, ...updates }));
    };

    const handleDeleteBroadcast = async (id) => {
        // if (!confirm('Delete this broadcast?')) return;
        try {
            await adminApi.fetch(`/admin/broadcasts/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            console.error('Failed to delete broadcast:', err);
        }
    };

    const handleBulkDeleteBroadcast = async (ids) => {
        try {
            await adminApi.fetch('/admin/broadcasts/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids })
            });
            fetchData();
        } catch (err) {
            console.error('Failed to bulk delete broadcasts:', err);
        }
    };

    const handleUpdateBroadcast = async (id, updates) => {
        // Optimistic Update
        setBroadcasts(prev => prev.map(b =>
            b.id === id ? { ...b, ...updates } : b
        ));

        try {
            await adminApi.fetch(`/admin/broadcasts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            await fetchData(); // Refresh data after update (AWAIT to sync with UI)
        } catch (err) {
            console.error('Failed to update broadcast:', err);
            fetchData(); // Revert on error
        }
    };

    // --- Feedback Handlers ---
    const handleDeleteFeedback = async (id) => {
        try {
            await adminApi.fetch(`/admin/feedback/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            console.error('Failed to delete feedback:', err);
        }
    };

    const handleUpdateFeedbackStatus = async (id, status) => {
        try {
            await adminApi.fetch(`/admin/feedback/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            fetchData();
        } catch (err) {
            console.error('Failed to update feedback:', err);
        }
    };

    const tabs = [
        { id: 'composer', label: '🪶 Composer', count: 0 },
        { id: 'outbox', label: '🐦 Sent', count: 0 },
        { id: 'feedback', label: '🥚 Received', count: feedbackCounts.pending },
        { id: 'broadcasts', label: '🦅 Broadcasts', count: broadcasts.length }
    ];

    return (
        <div style={{
            flex: 1,
            width: '100%',
            overflowY: 'auto', // Scroll at page edge
            overflowX: 'hidden',
            height: 'calc(100vh - 20px)'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '0'
            }}>
                <style>{datePickerStyles}</style>
                <div style={{
                    // Header is always static now as the page doesn't scroll, the content does
                    background: 'var(--color-bg-primary, #0f172a)',
                    zIndex: 100,
                    padding: '1.5rem 1.5rem 0 1.5rem'
                }}>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            🔔 Messages
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Manage communications, broadcasts, and user feedback
                        </p>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        borderBottom: '1px solid #334155',
                        paddingBottom: '1rem',
                        overflowX: 'auto'
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    background: activeTab === tab.id ? '#1e293b' : 'transparent',
                                    color: activeTab === tab.id ? '#f8fafc' : '#94a3b8',
                                    border: activeTab === tab.id ? '1px solid #334155' : '1px solid transparent',
                                    borderBottom: activeTab === tab.id ? 'none' : '1px solid transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    outline: 'none',
                                    position: 'relative',
                                    top: activeTab === tab.id ? '1px' : '0'
                                }}
                                onMouseEnter={e => {
                                    if (activeTab !== tab.id) e.currentTarget.style.color = '#e2e8f0';
                                }}
                                onMouseLeave={e => {
                                    if (activeTab !== tab.id) e.currentTarget.style.color = '#94a3b8';
                                }}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span style={{
                                        background: activeTab === tab.id ? '#3b82f6' : '#475569',
                                        color: 'white',
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: '10px',
                                        fontSize: '0.75rem',
                                        minWidth: '20px',
                                        textAlign: 'center'
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
                        Loading messaging data...
                    </div>
                ) : (
                    <div className="tab-content" style={{
                        animation: 'fadeIn 0.3s ease',
                        flex: 1, // Always take remaining space
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible',
                        padding: '0.5rem 1rem 1.25rem 1rem',
                        minHeight: 0 // Critical for flex scrolling
                    }}>

                        {/* COMPOSER TAB */}
                        {activeTab === 'composer' && (
                            <div style={{ width: '100%' }}>
                                <ComposeSection
                                    subscribers={subscribers}
                                    totalSubscribers={stats.totalSubscribers}
                                    onSent={fetchData}
                                />
                            </div>
                        )}

                        {/* OUTBOX TAB */}
                        {/* SENT (OUTBOX) TAB */}
                        {activeTab === 'outbox' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <HistorySection
                                    users={subscribers}
                                    totalSent={stats.notificationMetrics?.total || 0}
                                    setConfirmModal={setConfirmModal}
                                />
                            </div>
                        )}

                        {/* RECEIVED (FEEDBACK) TAB */}
                        {activeTab === 'feedback' && (
                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem' }}>
                                <FeedbackSection
                                    feedback={feedback}
                                    feedbackCounts={feedbackCounts}
                                    onUpdate={fetchData}
                                    onUpdateStatus={handleUpdateFeedbackStatus}
                                    onDelete={handleDeleteFeedback}
                                    page={feedbackPage}
                                    setPage={setFeedbackPage}
                                    pageSize={feedbackPageSize}
                                    totalItems={totalFeedback}
                                    sortColumn={feedbackSortCol}
                                    setSortColumn={setFeedbackSortCol}
                                    sortDirection={feedbackSortDir}
                                    setSortDirection={setFeedbackSortDir}
                                    setConfirmModal={setConfirmModal}
                                />
                            </div>
                        )}

                        {/* BROADCASTS TAB */}
                        {activeTab === 'broadcasts' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
                                {/* Create New Broadcast */}
                                <div className="card" style={{ flexShrink: 0, marginBottom: 0, overflow: 'visible', zIndex: 20 }}>
                                    <div className="card-header">
                                        <h3>🌈 Create Broadcasts</h3>
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={handleCreateBroadcast}>
                                            <div className="form-group">
                                                <label className="form-label">Template</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                                                    {Object.values(templates).map(tmpl => (
                                                        <button
                                                            key={tmpl.id}
                                                            type="button"
                                                            onClick={() => handleBroadcastTemplateChange(tmpl.id)}
                                                            style={{
                                                                padding: '0.5rem 0.2rem',
                                                                border: activeBroadcastTemplate === tmpl.id ? '2px solid #3b82f6' : '1px solid #334155',
                                                                borderRadius: '8px',
                                                                background: activeBroadcastTemplate === tmpl.id ? '#1e293b' : '#0f172a',
                                                                color: activeBroadcastTemplate === tmpl.id ? '#60a5fa' : '#94a3b8',
                                                                cursor: 'pointer',
                                                                fontWeight: activeBroadcastTemplate === tmpl.id ? 600 : 400,
                                                                fontSize: '0.85rem',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                textAlign: 'center'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if (activeBroadcastTemplate !== tmpl.id) {
                                                                    e.currentTarget.style.color = '#e2e8f0';
                                                                    e.currentTarget.style.background = '#1e293b';
                                                                }
                                                            }}
                                                            onMouseLeave={e => {
                                                                if (activeBroadcastTemplate !== tmpl.id) {
                                                                    e.currentTarget.style.color = '#94a3b8';
                                                                    e.currentTarget.style.background = '#0f172a';
                                                                }
                                                            }}
                                                        >
                                                            {tmpl.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="form-group" style={{ marginTop: '0.25rem' }}>
                                                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Title</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={newBroadcast.title || ''}
                                                    onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                                                    placeholder="Broadcast title..."
                                                />
                                            </div>

                                            <div className="form-group" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                                                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Image</label>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={newBroadcast.imageUrl}
                                                        onChange={(e) => setNewBroadcast({ ...newBroadcast, imageUrl: e.target.value })}
                                                        placeholder="Image URL..."
                                                        style={{ flex: 1 }}
                                                    />
                                                    <label className="btn btn-secondary" style={{
                                                        cursor: 'pointer',
                                                        padding: '0.4rem 1.5rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '8px'
                                                    }}>
                                                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📂</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: 'none' }}
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    if (file.size > 8 * 1024 * 1024) {
                                                                        alert('Image too large (>8MB)');
                                                                        return;
                                                                    }
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => setNewBroadcast({ ...newBroadcast, imageUrl: reader.result });
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="form-group" style={{ marginTop: '0.25rem', position: 'relative' }}>
                                                <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Message</label>
                                                <textarea
                                                    className="form-input"
                                                    value={newBroadcast.message}
                                                    onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                                                    rows={3}
                                                    style={{ width: '100%', resize: 'vertical' }}
                                                    placeholder="Enter broadcast message..."
                                                />
                                                <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowBroadcastEmojiPicker(true)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            fontSize: '1.2rem',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            opacity: 0.7,
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.target.style.opacity = 1}
                                                        onMouseLeave={e => e.target.style.opacity = 0.7}
                                                        title="Insert Emoji"
                                                    >
                                                        😀
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label className="form-label">Start Time</label>
                                                    <DatePicker
                                                        selected={newBroadcast.startTime ? new Date(newBroadcast.startTime) : null}
                                                        onChange={(date) => setNewBroadcast({ ...newBroadcast, startTime: date })}
                                                        showTimeSelect
                                                        timeFormat="HH:mm"
                                                        timeIntervals={15}
                                                        dateFormat="MMMM d, yyyy h:mm aa"
                                                        className="custom-datepicker-input"
                                                        placeholderText="Select start time"
                                                        calendarClassName="dark-theme-calendar"
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="form-label">End Time (Optional)</label>
                                                    <DatePicker
                                                        selected={newBroadcast.endTime ? new Date(newBroadcast.endTime) : null}
                                                        onChange={(date) => setNewBroadcast({ ...newBroadcast, endTime: date })}
                                                        showTimeSelect
                                                        timeFormat="HH:mm"
                                                        timeIntervals={15}
                                                        dateFormat="MMMM d, yyyy h:mm aa"
                                                        className="custom-datepicker-input"
                                                        placeholderText="Select end time"
                                                        minDate={newBroadcast.startTime ? new Date(newBroadcast.startTime) : null}
                                                        isClearable // Allow clearing the end time
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label className="form-label">Max Views (Optional)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Unlimited"
                                                            value={newBroadcast.maxViews || ''}
                                                            onChange={(e) => setNewBroadcast({ ...newBroadcast, maxViews: e.target.value })}
                                                            className="form-input"
                                                            style={{
                                                                background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem',
                                                                paddingRight: '50px', // Make room for suffix
                                                                fontSize: '0.9rem', color: '#f8fafc', width: '100%', outline: 'none', height: '38px',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                        {newBroadcast.maxViews && (
                                                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b', pointerEvents: 'none' }}>
                                                                {Number(newBroadcast.maxViews) === 1 ? 'view' : 'views'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="form-label">Priority</label>
                                                    <BadgeSelect
                                                        value={newBroadcast.priority ? String(newBroadcast.priority) : ''}
                                                        onChange={(val) => setNewBroadcast({ ...newBroadcast, priority: parseInt(val) })}
                                                        options={[
                                                            { value: '1', label: 'P1 - Critical', color: '#ef4444' },
                                                            { value: '2', label: 'P2 - High', color: '#f97316' },
                                                            { value: '3', label: 'P3 - Medium', color: '#eab308' },
                                                            { value: '4', label: 'P4 - Low', color: '#3b82f6' },
                                                            { value: '5', label: 'P5 - Minimal', color: '#22c55e' }
                                                        ]}
                                                        placeholder="Select Priority"
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                                <button
                                                    type="submit"
                                                    disabled={creatingBroadcast || justPublished}
                                                    className="btn btn-primary"
                                                    style={{
                                                        padding: '0.75rem 2rem',
                                                        minWidth: '220px',
                                                        // Maintain feedback styles
                                                        boxShadow: justPublished ? '0 0 15px rgba(34, 197, 94, 0.4)' : undefined,
                                                        background: justPublished ? '#22c55e' : undefined,
                                                        borderColor: justPublished ? '#22c55e' : undefined,
                                                    }}
                                                >
                                                    {justPublished ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            ✓ Published
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span>🚀</span> Publish Broadcast
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                        {showBroadcastEmojiPicker && (
                                            <EmojiPickerModal
                                                onSelect={(emoji) => { setNewBroadcast(prev => ({ ...prev, message: prev.message + emoji })); setShowBroadcastEmojiPicker(false); }}
                                                onClose={() => setShowBroadcastEmojiPicker(false)}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Manage Broadcasts */}
                                <BroadcastsSection
                                    broadcasts={broadcasts}
                                    page={broadcastPage}
                                    setPage={setBroadcastPage}
                                    pageSize={broadcastPageSize}
                                    onDelete={handleDeleteBroadcast}
                                    onBroadcastUpdate={handleUpdateBroadcast}
                                    setConfirmModal={setConfirmModal}
                                />
                            </div>
                        )}

                    </div>
                )}

                {/* Global Confirmation Modal */}
                {confirmModal.show && (
                    <ConfirmationModal
                        title={confirmModal.title}
                        message={confirmModal.message}
                        onConfirm={() => {
                            if (confirmModal.onConfirm) confirmModal.onConfirm();
                            setConfirmModal({ ...confirmModal, show: false });
                        }}
                        onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
                    />
                )}
            </div>
        </div>
    );
};

// --- Broadcast Component ---
function BroadcastsSection({ broadcasts, page, setPage, pageSize, onDelete, onBroadcastUpdate, setConfirmModal }) {
    // Search State
    const [searchFilters, setSearchFilters] = useState({
        searchText: '',
        status: 'all', // all, active, scheduled, inactive, filled
        priority: 'all', // all, 1, 2, 3, 4, 5
        maxViewsNum: '',
        maxViewsType: 'all', // all, limited, unlimited
        startDate: null,
        endDate: null
    });

    // Interaction State
    const [selectedBroadcast, setSelectedBroadcast] = useState(null); // For Detail Popup
    const [viewRecipientsId, setViewRecipientsId] = useState(null); // For Recipients Modal
    // const [showAdvanced, setShowAdvanced] = useState(false); // REMOVED: Filters now always visible
    const [hoveredTimelineBarId, setHoveredTimelineBarId] = useState(null); // For broadcast card highlighting
    const [hoveredCardId, setHoveredCardId] = useState(null); // For timeline bar highlighting (reverse sync)
    const [hoveredFilterGroup, setHoveredFilterGroup] = useState(null); // For stats badge highlighting

    // Layout Alignment State
    const scrollContainerRef = React.useRef(null);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);


    // Filter Logic
    const filteredBroadcasts = broadcasts.filter(b => {
        const now = new Date();
        const start = new Date(b.start_time);
        const end = b.end_time ? new Date(b.end_time) : null; // Handle null end_time

        // Text Search Filter (title or message)
        if (searchFilters.searchText) {
            const searchLower = searchFilters.searchText.toLowerCase();
            const titleMatch = (b.title || '').toLowerCase().includes(searchLower);
            const messageMatch = (b.message || '').toLowerCase().includes(searchLower);
            if (!titleMatch && !messageMatch) return false;
        }

        // Status Filter
        // Status Filter
        if (searchFilters.status !== 'all') {
            const isFilled = b.max_views && (b.total_users || 0) >= b.max_views;
            const isActive = now >= start && (!end || now <= end);
            const isPast = end && now > end;
            const isScheduled = now < start;

            if (searchFilters.status === 'filled' && !isFilled) return false;

            // "Active" means time-active AND NOT filled
            if (searchFilters.status === 'active' && (!isActive || isFilled)) return false;

            if (searchFilters.status === 'inactive' && !isPast && !isFilled) return false; // Inactive usually means ended, but let's keep it strict to time-ended based on user request "filled... must behave like inactive" visually, but logically it's its own status. User said "must behave like a inactive one -more transparent...". Logic-wise, let's keep them distinct in filter.
            // Correction: If user selects INACTIVE, should they see filled? Usually no if there's a specific filled filter.
            if (searchFilters.status === 'inactive' && !isPast) return false;

            if (searchFilters.status === 'scheduled' && !isScheduled) return false;
        }

        if (searchFilters.priority !== 'all' && (b.priority || 3) != searchFilters.priority) return false;
        // Max Views Filter
        if (searchFilters.maxViewsType === 'limited') {
            if (!b.max_views || b.max_views <= 0) return false;
        } else if (searchFilters.maxViewsType === 'unlimited') {
            if (b.max_views && b.max_views > 0) return false;
        }
        // Also respect specific number if typed
        if (searchFilters.maxViewsNum) {
            if (!b.max_views || b.max_views > parseInt(searchFilters.maxViewsNum)) return false;
        }

        if (searchFilters.startDate && new Date(b.start_time) < searchFilters.startDate) return false;
        if (searchFilters.endDate && b.end_time && new Date(b.end_time) > searchFilters.endDate) return false; // Only filter by end date if end_time exists

        return true;
    });

    const paginatedBroadcasts = filteredBroadcasts.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(filteredBroadcasts.length / pageSize);

    // Measure scrollbar to align headers
    React.useLayoutEffect(() => {
        const updateWidth = () => {
            if (scrollContainerRef.current) {
                const width = scrollContainerRef.current.offsetWidth - scrollContainerRef.current.clientWidth;
                setScrollbarWidth(width);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, [filteredBroadcasts.length]);

    // Calculate broadcast stats from ALL broadcasts (not filtered)
    const broadcastStats = React.useMemo(() => {
        const now = new Date();
        let active = 0, scheduled = 0, inactive = 0, filled = 0;
        const priorityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let withMaxViews = 0, withoutMaxViews = 0;

        broadcasts.forEach(b => {
            const start = new Date(b.start_time);
            const end = b.end_time ? new Date(b.end_time) : null;

            const isFilled = b.max_views && (b.total_users || 0) >= b.max_views;
            const isActive = now >= start && (!end || now <= end);
            const isPast = end && now > end;
            const isScheduled = now < start;

            if (isFilled) filled++;
            else if (isActive) active++;
            else if (isScheduled) scheduled++;
            else if (isPast) inactive++;

            const p = b.priority || 3;
            if (priorityCounts[p] !== undefined) priorityCounts[p]++;

            if (b.max_views) withMaxViews++;
            else withoutMaxViews++;
        });

        return { active, scheduled, inactive, filled, priorityCounts, withMaxViews, withoutMaxViews };
    }, [broadcasts]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Broadcasts List Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                <div className="card-header">
                    <h3>🎬 Manage Broadcasts</h3>
                </div>

                {/* Sticky Search Form - Below Header */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#1e293b',
                    borderBottom: '1px solid var(--color-border)',
                    padding: '0.75rem 1rem'
                }}>
                    {/* ... content ... */}
                    {/* Row 1: Search + Status + Clear */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Text Search */}
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="form-input"
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', width: '100%' }}
                                placeholder="🔍 Search title or message..."
                                value={searchFilters.searchText}
                                onChange={e => setSearchFilters(prev => ({ ...prev, searchText: e.target.value }))}
                            />
                        </div>


                        {/* Clear */}
                        {(searchFilters.searchText || searchFilters.status !== 'all' || searchFilters.startDate || searchFilters.endDate || searchFilters.maxViewsNum || searchFilters.priority !== 'all' || searchFilters.maxViewsType !== 'all') && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSearchFilters({ searchText: '', status: 'all', priority: 'all', maxViewsNum: '', maxViewsType: 'all', startDate: null, endDate: null })}
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            >
                                ✕ Clear
                            </button>
                        )}

                        {/* Toggle Advanced - REMOVED: Filters always visible */}

                    </div>

                    {/* Row 2: Advanced Filters (Always Visible) */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                        {/* Start Time Filter */}
                        <div style={{ flex: '1 1 180px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Start After</label>
                            <DatePicker
                                selected={searchFilters.startDate}
                                onChange={(date) => setSearchFilters(prev => ({ ...prev, startDate: date }))}
                                showTimeSelect
                                dateFormat="MMM d, yyyy HH:mm"
                                className="custom-datepicker-input"
                                placeholderText="Filter by start time"
                                calendarClassName="dark-theme-calendar"
                            />
                        </div>

                        {/* End Time Filter */}
                        <div style={{ flex: '1 1 180px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>End Before</label>
                            <DatePicker
                                selected={searchFilters.endDate}
                                onChange={(date) => setSearchFilters(prev => ({ ...prev, endDate: date }))}
                                showTimeSelect
                                dateFormat="MMM d, yyyy HH:mm"
                                className="custom-datepicker-input"
                                placeholderText="Filter by end time"
                                calendarClassName="dark-theme-calendar"
                            />
                        </div>

                        {/* Status Filter - Badge Style */}
                        <div style={{ flex: '0 0 140px' }}> {/* Fixed width for consistent layout */}
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>
                                Status
                            </label>
                            <BadgeSelect
                                value={searchFilters.status}
                                onChange={(val) => setSearchFilters(prev => ({ ...prev, status: val }))}
                                options={[
                                    { value: 'all', label: 'Any Status', color: null }, // No badge style
                                    { value: 'active', label: 'Active', color: '#22c55e' },
                                    { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
                                    { value: 'filled', label: 'Filled', color: '#ec4899' },
                                    { value: 'inactive', label: 'Ended', color: '#94a3b8' }
                                ]}
                                placeholder="Filter by Status"
                            />
                        </div>

                        {/* Priority Filter */}
                        <div style={{ flex: '0 0 140px' }}> {/* Fixed width */}
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>
                                Priority
                            </label>
                            <BadgeSelect
                                value={searchFilters.priority}
                                onChange={(val) => setSearchFilters(prev => ({ ...prev, priority: val }))}
                                options={[
                                    { value: 'all', label: 'Any Priority', color: null },
                                    { value: '1', label: 'P1 - Critical', color: '#ef4444' },
                                    { value: '2', label: 'P2 - High', color: '#f97316' },
                                    { value: '3', label: 'P3 - Medium', color: '#eab308' },
                                    { value: '4', label: 'P4 - Low', color: '#3b82f6' },
                                    { value: '5', label: 'P5 - Minimal', color: '#22c55e' }
                                ]}
                                placeholder="Filter by Priority"
                            />
                        </div>

                        {/* Max Views Filter */}
                        <div style={{ flex: 1, minWidth: '100px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>
                                Max Views
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Max Views..."
                                    value={searchFilters.maxViewsNum}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val < 0) return; // Prevent negative input
                                        setSearchFilters(prev => ({
                                            ...prev,
                                            maxViewsNum: e.target.value,
                                            // If typing a number, we probably mean 'limited' context, but keeping 'all' creates less friction unless we want to force it.
                                            // Let's keep type as is, or switch to 'limited' if not unlimited?
                                            // User requested toggle logic for badges. Typing here acts as a sub-filter.
                                        }));
                                    }}
                                    style={{
                                        background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem',
                                        fontSize: '0.9rem', color: '#f8fafc', width: '100%', outline: 'none', height: '38px' // Consistent height
                                    }}
                                />
                                {searchFilters.maxViewsNum && (
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}>
                                        views
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Section */}
                {/* Statistics Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem', // Increased gap to fill more space but stay safe
                    padding: '0.75rem 1rem', // Equal padding top/bottom
                    background: '#0f172a',
                    margin: `0.75rem calc(1rem + ${scrollbarWidth}px) 0.375rem 1rem`, // Dynamic Alignment
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    flexWrap: 'nowrap',
                    minWidth: 'fit-content'
                }}>
                    {/* Total Count */}
                    <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '4px',
                        fontSize: '0.75rem', fontWeight: 700,
                        background: '#eab30820', color: '#eab308',
                        border: '1px solid #eab30840',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        cursor: 'pointer', flexShrink: 0
                    }}
                        onClick={() => setSearchFilters({ searchText: '', status: 'all', priority: 'all', maxViewsNum: '', maxViewsType: 'all', startDate: null, endDate: null })}
                    >
                        TOTAL <span style={{ background: '#0f172a', padding: '0 0.3rem', borderRadius: '3px', color: '#eab308' }}>{broadcasts.length}</span>
                    </span>

                    {/* Vertical Separator */}
                    <div style={{ width: 1, height: 20, background: '#334155', flexShrink: 0 }}></div>

                    {/* Status Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: searchFilters.status === 'active' ? '#22c55e40' : '#22c55e20', // Highlight if selected
                            color: '#22c55e',
                            border: searchFilters.status === 'active' ? '1px solid #22c55e' : '1px solid #22c55e40',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                        }}
                            onClick={() => setSearchFilters(prev => ({ ...prev, status: prev.status === 'active' ? 'all' : 'active' }))}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'status', value: 'active' }); }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                        >
                            ACTIVE <span style={{ marginLeft: '0.3rem', color: '#fff', opacity: 1 }}>{broadcastStats.active}</span>
                        </span>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: searchFilters.status === 'scheduled' ? '#3b82f640' : '#3b82f620',
                            color: '#3b82f6',
                            border: searchFilters.status === 'scheduled' ? '1px solid #3b82f6' : '1px solid #3b82f640',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                        }}
                            onClick={() => setSearchFilters(prev => ({ ...prev, status: prev.status === 'scheduled' ? 'all' : 'scheduled' }))}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'status', value: 'scheduled' }); }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                        >
                            SCHEDULED <span style={{ marginLeft: '0.3rem', color: '#fff', opacity: 1 }}>{broadcastStats.scheduled}</span>
                        </span>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: searchFilters.status === 'filled' ? '#ec489940' : '#ec489910', // More transparent like inactive
                            color: '#ec4899',
                            border: searchFilters.status === 'filled' ? '1px solid #ec4899' : '1px solid #ec489920',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                        }}
                            onClick={() => setSearchFilters(prev => ({ ...prev, status: prev.status === 'filled' ? 'all' : 'filled' }))}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'status', value: 'filled' }); }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                        >
                            FILLED <span style={{ marginLeft: '0.3rem', color: '#fff', opacity: 1 }}>{broadcastStats.filled}</span>
                        </span>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: searchFilters.status === 'inactive' ? '#94a3b840' : '#94a3b820',
                            color: '#94a3b8',
                            border: searchFilters.status === 'inactive' ? '1px solid #94a3b8' : '1px solid #94a3b840',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                        }}
                            onClick={() => setSearchFilters(prev => ({ ...prev, status: prev.status === 'inactive' ? 'all' : 'inactive' }))}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'status', value: 'inactive' }); }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                        >
                            INACTIVE <span style={{ marginLeft: '0.3rem', color: '#fff', opacity: 1 }}>{broadcastStats.inactive}</span>
                        </span>
                    </div>

                    {/* Vertical Separator */}
                    <div style={{ width: 1, height: 20, background: '#334155', flexShrink: 0 }}></div>

                    {/* Priority Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {[1, 2, 3, 4, 5].map(p => {
                            let color = '#22c55e';
                            if (p === 1) color = '#ef4444';
                            if (p === 2) color = '#f97316';
                            if (p === 3) color = '#eab308';
                            if (p === 4) color = '#3b82f6';

                            return (
                                <span key={p} style={{
                                    padding: '0.2rem 0.5rem', borderRadius: '4px',
                                    fontSize: '0.7rem', fontWeight: 600,
                                    background: searchFilters.priority === String(p) ? `${color}40` : `${color}20`,
                                    color: color,
                                    border: searchFilters.priority === String(p) ? `1px solid ${color}` : `1px solid ${color}40`,
                                    cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                                }}
                                    onClick={() => setSearchFilters(prev => ({ ...prev, priority: prev.priority === String(p) ? 'all' : String(p) }))}
                                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'priority', value: p }); }}
                                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                                >
                                    P{p} <span style={{ marginLeft: '0.2rem', color: '#fff', opacity: 1 }}>{broadcastStats.priorityCounts[p]}</span>
                                </span>
                            );
                        })}
                    </div>

                    {/* Vertical Separator */}
                    <div style={{ width: 1, height: 20, background: '#334155', flexShrink: 0 }}></div>

                    {/* Max Views Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: searchFilters.maxViewsType === 'limited' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
                            color: '#06b6d4',
                            border: searchFilters.maxViewsType === 'limited' ? '1px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.3)',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                        }}
                            onClick={() => setSearchFilters(prev => ({ ...prev, maxViewsType: prev.maxViewsType === 'limited' ? 'all' : 'limited', maxViewsNum: '' }))}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'maxViews', value: 'limited' }); }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                        >
                            👁 <span style={{ marginLeft: '0.3rem', color: '#fff', opacity: 1 }}>{broadcastStats.withMaxViews}</span>
                        </span>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: searchFilters.maxViewsType === 'unlimited' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
                            color: '#06b6d4',
                            border: searchFilters.maxViewsType === 'unlimited' ? '1px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.3)',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            cursor: 'pointer', transition: 'filter 0.1s', flexShrink: 0
                        }}
                            onClick={() => setSearchFilters(prev => ({ ...prev, maxViewsType: prev.maxViewsType === 'unlimited' ? 'all' : 'unlimited', maxViewsNum: '' }))}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; setHoveredFilterGroup({ type: 'maxViews', value: 'unlimited' }); }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; setHoveredFilterGroup(null); }}
                        >
                            👁 ∞ <span style={{ marginLeft: '0.3rem', color: '#fff', opacity: 1 }}>{broadcastStats.withoutMaxViews}</span>
                        </span>
                    </div>

                    {/* Vertical Separator */}
                    <div style={{ width: 1, height: 20, background: '#334155', flexShrink: 0 }}></div>

                    {/* Bulk Delete Badge */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: '#a855f720', // Purple
                            color: '#a855f7',
                            border: '1px solid #a855f740',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            flexShrink: 0
                        }}
                            onClick={() => {
                                if (filteredBroadcasts.length === 0) return;
                                setConfirmModal({
                                    show: true,
                                    title: 'Bulk Delete Broadcasts',
                                    message: `Are you sure you want to delete ALL ${filteredBroadcasts.length} visible broadcasts? This action cannot be undone.`,
                                    onConfirm: () => {
                                        // Use new bulk delete endpoint
                                        const ids = filteredBroadcasts.map(b => b.id);
                                        handleBulkDeleteBroadcast(ids);
                                    }
                                });
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#a855f740'; e.currentTarget.style.color = '#c084fc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#a855f720'; e.currentTarget.style.color = '#a855f7'; }}
                        >
                            🗑️ DELETE VISIBLE
                        </span>
                    </div>
                </div>

                {/* Timeline Visualization */}
                <div style={{ position: 'relative', zIndex: 1, margin: `0.375rem calc(1rem + ${scrollbarWidth}px) 0.75rem 1rem` }}>
                    <Timeline
                        broadcasts={filteredBroadcasts}
                        selectedBroadcast={selectedBroadcast}
                        onBroadcastClick={setSelectedBroadcast}
                        onBroadcastUpdate={onBroadcastUpdate}
                        onHoveredBarChange={setHoveredTimelineBarId}
                        externalHoverId={hoveredCardId}
                    />
                </div>

                {/* Horizontal Separator */}
                <div style={{
                    height: '1px',
                    background: '#334155', // Match border color
                    width: '100%',
                    marginBottom: '0.75rem'
                }} />

                <div ref={scrollContainerRef} style={{ maxHeight: '560px', height: 'auto', minHeight: '200px', overflowY: 'auto', background: '#1e293b', position: 'relative', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem 1rem 1rem', boxSizing: 'border-box' }}>
                        {filteredBroadcasts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                                No broadcasts found matching filters.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {paginatedBroadcasts.map(b => {
                                    const now = new Date();
                                    const start = new Date(b.start_time);
                                    let end = b.end_time ? new Date(b.end_time) : null;
                                    if (end && end.getFullYear() > 2090) end = null;

                                    // Status Logic (Infinite Duration Support):
                                    // - Active: Now >= Start && (End is null OR Now <= End)
                                    // - Scheduled: Now < Start
                                    // - Inactive: End is NOT null AND Now > End
                                    let statusText = 'INACTIVE';
                                    let statusColor = '#94a3b8';

                                    if (end && now > end) {
                                        statusText = 'ENDED';
                                        statusColor = '#94a3b8';
                                    } else if (now < start) {
                                        statusText = 'SCHEDULED';
                                        statusColor = '#3b82f6';
                                    } else if (b.max_views && (b.total_users || 0) >= b.max_views) {
                                        // Global Cap Met
                                        statusText = 'FILLED';
                                        statusColor = '#ec4899'; // Pink
                                    } else {
                                        statusText = 'ACTIVE';
                                        statusColor = '#22c55e';
                                    }

                                    // Priority Logic (Heat Map 1=Highest)
                                    const getPriorityColor = (p) => {
                                        // Default to 3 if 0/undefined
                                        const val = p || 3;
                                        if (val <= 1) return '#ef4444'; // 1: Red (Critical)
                                        if (val === 2) return '#f97316'; // 2: Orange (High)
                                        if (val === 3) return '#eab308'; // 3: Yellow (Medium)
                                        if (val === 4) return '#3b82f6'; // 4: Blue (Normal)
                                        return '#22c55e'; // 5: Green (Low) - CHANGED P5
                                    };
                                    const priorityColor = getPriorityColor(b.priority);

                                    // Border Color: Always priority color, but 75% transparent (25% opacity) if not active
                                    const borderColor = (statusText === 'ACTIVE') ? priorityColor : `${priorityColor}40`;

                                    // Opacity for inactive/filled states
                                    const cardOpacity = (statusText === 'ACTIVE' || statusText === 'SCHEDULED') ? 1 : 0.75;

                                    // Check if this card should be highlighted (from Timeline hover OR Stats Badge hover)
                                    let isHighlighted = hoveredTimelineBarId === b.id;

                                    if (!isHighlighted && hoveredFilterGroup) {
                                        if (hoveredFilterGroup.type === 'status') {
                                            if (hoveredFilterGroup.value === 'active' && statusText === 'ACTIVE') isHighlighted = true;
                                            else if (hoveredFilterGroup.value === 'inactive' && statusText === 'ENDED') isHighlighted = true;
                                            else if (hoveredFilterGroup.value === 'scheduled' && statusText === 'SCHEDULED') isHighlighted = true;
                                            else if (hoveredFilterGroup.value === 'filled' && statusText === 'FILLED') isHighlighted = true;
                                        } else if (hoveredFilterGroup.type === 'priority') {
                                            if ((b.priority || 3) === hoveredFilterGroup.value) isHighlighted = true;
                                        } else if (hoveredFilterGroup.type === 'maxViews') {
                                            if (hoveredFilterGroup.value === 'limited' && b.max_views) isHighlighted = true;
                                            else if (hoveredFilterGroup.value === 'unlimited' && !b.max_views) isHighlighted = true;
                                        }
                                    }

                                    return (
                                        <div
                                            key={b.id}
                                            className="broadcast-card"
                                            onClick={() => setSelectedBroadcast(b)}
                                            style={{
                                                background: '#0f172a',
                                                borderRadius: '8px',
                                                padding: '0.6rem 0.75rem',
                                                cursor: 'pointer',
                                                borderTop: '1px solid #334155',
                                                borderRight: '1px solid #334155',
                                                borderBottom: '1px solid #334155',
                                                borderLeft: `4px solid ${borderColor}`,
                                                transition: 'all 0.2s ease',
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.4rem',
                                                boxShadow: isHighlighted ? `0 0 20px ${priorityColor}80, 0 0 40px ${priorityColor}40` : 'none',
                                                transform: isHighlighted ? 'scale(1.02)' : 'none',
                                                opacity: cardOpacity
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                                setHoveredCardId(b.id);
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                setHoveredCardId(null);
                                            }}
                                        >
                                            {/* Top Line: Title & Delete */}
                                            {/* Matches logic and spacing of Bottom Line */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                // border: '1px solid #ff00ff', // REMOVED DEBUG BORDER
                                                height: '26px', // Fixed height to match Blue Box
                                                padding: '0', // content centered by flex
                                                lineHeight: 1,
                                                boxSizing: 'border-box'
                                            }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '1rem' }}>
                                                    {b.title || 'Untitled Broadcast'}
                                                </div>
                                                {/* Delete button moved to bottom row */}
                                            </div>

                                            {/* Bottom Line: Professional Layout */}
                                            {/* User requested lime border REMOVED. Added background to bin area. */}
                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', marginTop: '-1px', border: 'none', height: '26px', boxSizing: 'border-box' }}>

                                                {/* Left: Status, Priority, Max Views, Attachment */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '280px', flexShrink: 0 }}>
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem 0.3rem 0.6rem', borderRadius: '4px',
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                        background: `${statusColor}20`, color: statusColor,
                                                        border: `1px solid ${statusColor}40`,
                                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                                    }}
                                                        title={statusText === 'FILLED' ? 'Inactive: Global Max Views reached' : ''}
                                                    >
                                                        {statusText}
                                                    </span>
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem 0.3rem 0.5rem', borderRadius: '4px',
                                                        fontSize: '0.7rem', fontWeight: 600,
                                                        background: `${priorityColor}20`,
                                                        color: priorityColor,
                                                        border: `1px solid ${priorityColor}40`
                                                    }}>
                                                        P{b.priority || 3}
                                                    </span>
                                                    {b.max_views ? (
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem 0.3rem 0.5rem', borderRadius: '4px',
                                                            fontSize: '0.7rem', fontWeight: 600,
                                                            background: b.total_users >= b.max_views ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                                                            color: b.total_users >= b.max_views ? '#ef4444' : '#06b6d4',
                                                            border: b.total_users >= b.max_views ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                                                            cursor: 'help'
                                                        }}
                                                            title={`Global Limit: ${b.total_users} / ${b.max_views} users viewed`}
                                                        >
                                                            👁 {b.total_users || 0} / {b.max_views}
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem 0.3rem 0.5rem', borderRadius: '4px',
                                                            fontSize: '0.7rem', fontWeight: 600,
                                                            background: 'rgba(6, 182, 212, 0.1)',
                                                            color: '#06b6d4',
                                                            border: '1px solid rgba(6, 182, 212, 0.3)',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}>
                                                            👁 ∞
                                                        </span>
                                                    )}
                                                    {b.image_url && (
                                                        <span title="Has Attachment" style={{
                                                            padding: '0.2rem 0.5rem 0.3rem 0.5rem',
                                                            fontSize: '1rem',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'help',
                                                            lineHeight: 1
                                                        }}>📎</span>
                                                    )}
                                                </div>

                                                {/* Center/Right Group: Time, Stats, Bin */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                                    {/* Time Range - Fixed Width for Vertical Alignment - Pushed to Right Group */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        color: '#94a3b8',
                                                        fontSize: '0.75rem',
                                                        fontWeight: statusText === 'ACTIVE' ? '700' : '400', // Bold container if active
                                                        width: '360px', // Reduced by ~5% (was 380px)
                                                        paddingLeft: '1rem',
                                                        boxSizing: 'border-box',
                                                        marginLeft: 'auto',
                                                        marginRight: '1rem' // Restored standard margin
                                                    }}>
                                                        <span style={{ opacity: statusText === 'ACTIVE' ? 1 : 0.7 }}>🕐</span>
                                                        <span style={{ fontWeight: statusText === 'ACTIVE' ? 700 : 400, color: statusText === 'ACTIVE' ? '#f8fafc' : 'inherit' }}>{start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                        <span style={{ fontWeight: statusText === 'ACTIVE' ? 700 : 400, color: statusText === 'ACTIVE' ? '#f8fafc' : 'inherit' }}>{formatTimeCET(start)}</span>
                                                        <span style={{ fontWeight: statusText === 'ACTIVE' ? 700 : 400, color: statusText === 'ACTIVE' ? '#f8fafc' : 'inherit' }}>→</span>
                                                        <span style={{ fontWeight: statusText === 'ACTIVE' ? 700 : 400, color: statusText === 'ACTIVE' ? '#f8fafc' : 'inherit' }}>{end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '∞'}</span>
                                                        <span style={{ fontWeight: statusText === 'ACTIVE' ? 700 : 400, color: statusText === 'ACTIVE' ? '#f8fafc' : 'inherit' }}>{end ? formatTimeCET(end) : ''}</span>
                                                    </div>

                                                    {/* Delivery Stats - Separator Line included in border */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid #334155', paddingLeft: '0.75rem' }}>
                                                        <span title="Delivered" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#22c55e' }}>
                                                            ✓✓ <span style={{ color: '#94a3b8' }}>{Math.max(0, (b.delivered_count || 0) - (b.read_count || 0))}</span>
                                                        </span>
                                                        <span title="Read" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#3b82f6' }}>
                                                            ✓✓ <span style={{ color: '#94a3b8' }}>{b.read_count || 0}</span>
                                                        </span>
                                                    </div>

                                                    {/* Vertical Separator for Delete Icon - Pushed to right by flex growth of Time Range */}
                                                    <div style={{ width: '1px', height: '12px', background: '#334155', margin: '0' }}></div>

                                                    {/* Delete Button (Moved from top) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmModal({
                                                                show: true,
                                                                title: 'Delete Broadcast',
                                                                message: 'Are you sure you want to delete this broadcast?',
                                                                onConfirm: () => onDelete(b.id)
                                                            });
                                                        }}
                                                        className="btn-icon danger"
                                                        title="Delete"
                                                        style={{
                                                            padding: '0.2rem 0.4rem', // create the "area"
                                                            fontSize: '1rem',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            lineHeight: 1,
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s',
                                                            opacity: 0.7
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {totalPages > 1 && (
                    <PaginationControls
                        page={page}
                        totalPages={totalPages}
                        setPage={setPage}
                        pageSize={pageSize}
                        totalItems={filteredBroadcasts.length}
                        currentCount={paginatedBroadcasts.length}
                    />
                )}
            </div>

            {/* Broadcast Detail Popup */}
            {
                selectedBroadcast && (
                    <BroadcastDetailPopup
                        broadcast={selectedBroadcast}
                        onClose={() => setSelectedBroadcast(null)}
                        onViewRecipients={() => {
                            setViewRecipientsId(selectedBroadcast.id);
                            setSelectedBroadcast(null);
                        }}
                        onDelete={() => {
                            setConfirmModal({
                                show: true,
                                title: 'Delete Broadcast',
                                message: 'Are you sure you want to delete this broadcast?',
                                onConfirm: () => {
                                    onDelete(selectedBroadcast.id);
                                    setSelectedBroadcast(null);
                                }
                            });
                        }}
                    />
                )
            }

            {/* Recipients Modal */}
            {
                viewRecipientsId && (
                    <BroadcastRecipientsModal
                        broadcastId={viewRecipientsId}
                        onClose={() => setViewRecipientsId(null)}
                    />
                )
            }
        </div >
    );
}

// --- Sub-components ---

const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(2, 6, 23, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000,
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onCancel}>
            <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '420px',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.2)',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span> {title}
                    </h3>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {message}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: '#e2e8f0',
                            border: '1px solid #334155',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#334155'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        Delete
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>,
        document.body
    );
};

const ComposeSection = ({ subscribers, totalSubscribers, onSent }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('share_app');
    const [title, setTitle] = useState(templates.share_app.title);
    const [body, setBody] = useState(templates.share_app.body);
    const [imageUrl, setImageUrl] = useState('');
    const [target, setTarget] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showComposeEmojiPicker, setShowComposeEmojiPicker] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [justPublished, setJustPublished] = useState(false); // Feedback state
    const userListRef = React.useRef(null);

    // Auto-scroll to users when target is set to 'selected'
    useEffect(() => {
        if (target === 'selected' && userListRef.current) {
            userListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [target]);

    // Auto-dismiss result message
    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => setResult(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    // Generate Custom QR Code with Emoji Center
    const generateQRCode = async () => {
        try {
            // 1. Generate QR Data URL using 'qrcode' package
            const qrDataUrl = await QRCode.toDataURL(APP_URL, {
                width: 500,
                margin: 0,
                color: {
                    dark: '#1e293b',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });

            // 2. Load into Image to draw on Canvas
            const img = new Image();
            img.src = qrDataUrl;
            await new Promise(r => img.onload = r);

            // 3. Create Canvas with Border
            const border = 25;
            const canvas = document.createElement('canvas');
            canvas.width = img.width + (border * 2);
            canvas.height = img.height + (border * 2);
            const ctx = canvas.getContext('2d');

            // Fill white background (border)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 4. Draw QR Centered
            ctx.drawImage(img, border, border);

            // 5. Draw Center Emoji (🪹)
            // White circle background for emoji
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = canvas.width / 6;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'white';
            ctx.fill();

            // Draw Emoji
            ctx.font = `${radius * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Offset y slightly because emojis usually sit a bit high
            ctx.fillText('🪹', centerX, centerY + (radius * 0.1));

            return canvas.toDataURL('image/png');
        } catch (err) {
            console.error('QR Generation failed:', err);
            return '';
        }
    };

    // Initial load for share_app template
    useEffect(() => {
        const init = async () => {
            if (selectedTemplate === 'share_app') {
                const qr = await generateQRCode();
                setImageUrl(qr);
            }
        };
        init();
    }, []);



    const handleTemplateChange = async (templateId) => {
        setSelectedTemplate(templateId);
        const tmpl = templates[templateId];

        // Clear fields and set new values
        setTitle(tmpl.title);
        setBody(tmpl.body || '');
        setImageUrl(''); // Reset image

        if (templateId === 'share_app') {
            const qrImage = await generateQRCode();
            setImageUrl(qrImage);
        } else if (templateId === 'happy_new_year') {
            setImageUrl('https://nestfinder-sa1g.onrender.com/images/new_year_2026.png');
        }
    };

    const toggleUser = (userId) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSend = async () => {
        if (!title.trim()) return setResult({ success: false, message: 'Title required' });
        // Removed generic body check as templates might fill it, but safe to keep if using custom
        // Relaxed EndTime check for infinite duration
        if (!target) return setResult({ success: false, message: 'Target audience required' });

        try {
            setSending(true);
            setResult(null);
            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch(`${API_URL}/api/push/admin/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    template: selectedTemplate,
                    title,
                    body,
                    imageUrl,
                    target,
                    userIds: target === 'all' ? [] : selectedUsers,
                    // maxViews: null // Not used in simple compose
                    maxViews: null
                })
            });
            const data = await response.json();
            if (response.ok) {
                setResult({ success: true, message: `✅ Sent to ${data.sent} users` });
                setBody('');
                setImageUrl('');
                setJustPublished(true); // Trigger green tick feedback
                setTimeout(() => setJustPublished(false), 1000); // Revert after 1s
                onSent && onSent();
            } else {
                setResult({ success: false, message: data.error || 'Failed' });
            }
        } catch (err) {
            setResult({ success: false, message: err.message });
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            setResult({ success: false, message: 'Image too large (>8MB)' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImageUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const filteredSubscribers = subscribers.filter(sub =>
        (sub.nickname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="card" style={{ marginBottom: '1rem', maxHeight: 'none', overflow: 'visible' }}>
            <div className="card-header"><h3>✉️ Create Notifications</h3></div>
            <div className="card-body">
                <div className="form-group">
                    <label className="form-label">Template</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                        {Object.values(templates).map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => handleTemplateChange(tmpl.id)}
                                style={{
                                    padding: '0.5rem 0.2rem',
                                    border: selectedTemplate === tmpl.id ? '2px solid #3b82f6' : '1px solid #334155',
                                    borderRadius: '8px',
                                    background: selectedTemplate === tmpl.id ? '#1e293b' : '#0f172a',
                                    color: selectedTemplate === tmpl.id ? '#60a5fa' : '#94a3b8',
                                    cursor: 'pointer',
                                    fontWeight: selectedTemplate === tmpl.id ? 600 : 400,
                                    fontSize: '0.85rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textAlign: 'center'
                                }}
                                title={tmpl.name}
                            >
                                {tmpl.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Title</label>
                    <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Image</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                        <input type="text" className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." style={{ flex: 1 }} />
                        <label className="btn btn-secondary" style={{
                            cursor: 'pointer',
                            padding: '0.4rem 1.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px'
                        }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📂</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem', position: 'relative' }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Message</label>
                    <textarea className="form-input" value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical' }} />
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                        <button
                            type="button"
                            onClick={() => setShowComposeEmojiPicker(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.7,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0.7}
                            title="Insert Emoji"
                        >
                            😀
                        </button>
                    </div>
                </div>
                {showComposeEmojiPicker && (
                    <EmojiPickerModal
                        onSelect={(emoji) => { setBody(prev => prev + emoji); setShowComposeEmojiPicker(false); }}
                        onClose={() => setShowComposeEmojiPicker(false)}
                    />
                )}


                <div className="form-group" style={{ marginTop: '0.25rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Target</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={() => setTarget('all')}
                            className={`btn ${target === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                        >
                            All Users ({totalSubscribers || subscribers.length})
                        </button>
                        <button
                            onClick={() => setTarget(target === 'selected' ? 'all' : 'selected')}
                            className={`btn ${target === 'selected' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                        >
                            {target === 'selected' ? 'Hide Users' : 'Select Users'}
                        </button>
                        <button
                            onClick={onSent}
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            title="Refresh User List"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                    {target === 'selected' && (
                        <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }} ref={userListRef}>
                            <input type="text" className="form-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {filteredSubscribers.map(sub => (
                                    <label key={sub.user_id} style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={selectedUsers.includes(sub.user_id)} onChange={() => toggleUser(sub.user_id)} />
                                        <span>{sub.nickname || sub.user_id}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {result && <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px', background: result.success ? '#dcfce7' : '#fee2e2', color: result.success ? '#166534' : '#991b1b', textAlign: 'center' }}>{result.message}</div>}

                <button onClick={handleSend} disabled={sending} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                    {sending ? 'Sending...' : 'Send Notification'}
                </button>
            </div>
        </div>
    );
};

const FeedbackSection = ({
    feedback, feedbackCounts, onUpdate, onUpdateStatus, onDelete,
    page, setPage, pageSize, totalItems,
    sortColumn, setSortColumn, sortDirection, setSortDirection,
    setConfirmModal
}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [previewItem, setPreviewItem] = useState(null);

    // Resizable columns state
    // Resizable columns state
    const [columnWidths, setColumnWidths] = useState(() => {
        const defaults = {
            checkbox: 40,
            timestamp: 130,
            status: 100,
            from: 150,
            type: 60,
            rating: 100,
            message: null, // flex
            actions: 50
        };
        try {
            const saved = localStorage.getItem('admin_received_columns');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (e) {
            return defaults;
        }
    });
    const [resizing, setResizing] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    // Resize handlers
    const handleResizeStart = (e, column) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(column);
        setStartX(e.clientX);
        setStartWidth(columnWidths[column] || 100);
    };

    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e) => {
            const diff = e.clientX - startX;
            const newWidth = Math.max(40, startWidth + diff);
            setColumnWidths(prev => {
                const updated = { ...prev, [resizing]: newWidth };
                localStorage.setItem('admin_received_columns', JSON.stringify(updated));
                return updated;
            });
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, startX, startWidth]);

    // Resize handle component
    const ResizeHandle = ({ column }) => (
        <div
            onMouseDown={(e) => handleResizeStart(e, column)}
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '5px',
                cursor: 'col-resize',
                background: resizing === column ? '#3b82f6' : 'transparent',
                transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3b82f6'}
            onMouseLeave={(e) => { if (resizing !== column) e.target.style.background = 'transparent'; }}
        />
    );

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkMarkRead = async () => {
        for (const id of selectedIds) {
            await onUpdateStatus(id, 'reviewed');
        }
        setSelectedIds([]);
        onUpdate && onUpdate();
    };

    const confirmMarkRead = () => {
        if (selectedIds.length === 0) return;
        setConfirmModal({
            show: true,
            title: 'Confirm Action',
            message: `Are you sure you want to mark ${selectedIds.length} items as read?`,
            onConfirm: () => {
                handleBulkMarkRead();
            }
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setConfirmModal({
            show: true,
            title: 'Delete Feedback',
            message: `Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`,
            onConfirm: async () => {
                for (const id of selectedIds) {
                    await onDelete(id);
                }
                setSelectedIds([]);
                onUpdate && onUpdate();
            }
        });
    };
    // Handle row click: open preview AND mark as read if sent/delivered
    const handleRowClick = async (item) => {
        setPreviewItem(item);
        if (item.status === 'sent' || item.status === 'new' || item.status === 'pending') {
            await onUpdateStatus(item.id, 'read');
            onUpdate && onUpdate();
        }
    };
    // Utility function to format timestamp in 24h format with CET/CEST
    const formatTimestamp24h = (isoString) => {
        const date = new Date(isoString);
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Paris', // CET/CEST timezone
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(date);
        const get = (type) => parts.find(p => p.type === type)?.value || '';

        // Determine if CET or CEST based on date
        const jan = new Date(date.getFullYear(), 0, 1);
        const jul = new Date(date.getFullYear(), 6, 1);
        const janOffset = jan.getTimezoneOffset();
        const julOffset = jul.getTimezoneOffset();
        const isDST = date.getTimezoneOffset() < Math.max(janOffset, julOffset);
        const tz = isDST ? 'CEST' : 'CET';

        return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')} ${tz}`;
    };

    // Sort feedback based on current column and direction
    // Server-side pagination
    const sortedFeedback = feedback;
    const paginatedFeedback = feedback;
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <h3>💬 Received History</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0 1rem',
                            borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', cursor: 'default',
                            userSelect: 'none', border: '1px solid rgba(56, 189, 248, 0.2)', width: 'auto', minWidth: '170px'
                        }}>
                            Showing {paginatedFeedback.length} of {totalItems}
                        </span>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 500 }}>
                                <span style={{ color: '#22c55e' }}>✓✓</span> <span style={{ color: '#94a3b8' }}>{feedbackCounts.pending} Received</span>
                            </span>
                            <span style={{ fontWeight: 500 }}>
                                <span style={{ color: '#3b82f6' }}>✓✓</span> <span style={{ color: '#94a3b8' }}>{feedbackCounts.read} Read</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {selectedIds.length > 0 && (
                                <>
                                    <button
                                        onClick={confirmMarkRead}
                                        className="btn btn-sm"
                                        style={{ background: '#14532d', color: 'white', border: 'none', padding: '0 0.8rem', borderRadius: '6px', fontWeight: 500, height: '32px', display: 'flex', alignItems: 'center' }}
                                    >
                                        <span style={{ color: '#3b82f6', fontWeight: 'bold', marginRight: '4px' }}>✓✓</span> Mark as Read
                                    </button>
                                    <button onClick={handleBulkDelete} className="btn btn-danger btn-sm" style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444', height: '32px', display: 'flex', alignItems: 'center', padding: '0 0.8rem' }}>🗑️ Delete ({selectedIds.length})</button>
                                </>
                            )}
                            <button
                                onClick={async () => {
                                    setConfirmModal({
                                        show: true,
                                        title: 'Clear Received History',
                                        message: 'Are you sure you want to CLEAR ALL Received History? This will remove all feedback messages from this list.',
                                        onConfirm: async () => {
                                            try {
                                                // Delete all feedback
                                                for (const item of feedback) {
                                                    await onDelete(item.id);
                                                }
                                                onUpdate && onUpdate();
                                            } catch (err) { console.error('Cleanup failed:', err); }
                                        }
                                    });
                                }}
                                className="btn btn-sm"
                                style={{ marginRight: '0.5rem', background: '#6366f1', color: 'white', width: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', height: '32px', border: 'none', borderRadius: '6px' }}
                                title="Delete all received messages"
                            >
                                🗑️ Clear History
                            </button>
                            <button onClick={onUpdate} className="btn btn-secondary btn-sm" style={{ width: '170px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>🔄 Refresh</button>
                        </div>
                    </div>
                </div>

                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <div style={{ maxHeight: 'calc(100vh - 330px)', overflowY: 'auto', background: '#1e293b', borderRadius: '0 0 8px 8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '0.75rem 1rem', width: columnWidths.checkbox, position: 'relative' }}>
                                        <input
                                            type="checkbox"
                                            checked={feedback.length > 0 && selectedIds.length === feedback.length}
                                            onChange={() => setSelectedIds(selectedIds.length === feedback.length ? [] : feedback.map(f => f.id))}
                                        />
                                    </th>
                                    <th
                                        onClick={() => { setSortColumn('created_at'); setSortDirection(d => sortColumn === 'created_at' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                        style={{ padding: '0.75rem 1rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: columnWidths.timestamp, position: 'relative' }}
                                    >
                                        Time {sortColumn === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="timestamp" />
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', width: columnWidths.status, textAlign: 'center', position: 'relative' }}>
                                        Status
                                        <ResizeHandle column="status" />
                                    </th>
                                    <th
                                        onClick={() => { setSortColumn('user_nickname'); setSortDirection(d => sortColumn === 'user_nickname' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                        style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: columnWidths.from, position: 'relative' }}
                                    >
                                        From {sortColumn === 'user_nickname' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="from" />
                                    </th>
                                    <th
                                        onClick={() => { setSortColumn('type'); setSortDirection(d => sortColumn === 'type' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                        style={{ padding: '0.75rem 1rem', width: columnWidths.type, textAlign: 'center', cursor: 'pointer', userSelect: 'none', position: 'relative' }}
                                    >
                                        Type {sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="type" />
                                    </th>
                                    <th
                                        onClick={() => { setSortColumn('rating'); setSortDirection(d => sortColumn === 'rating' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                        style={{ padding: '0.75rem 1rem', width: columnWidths.rating, textAlign: 'center', cursor: 'pointer', userSelect: 'none', position: 'relative' }}
                                    >
                                        Rating {sortColumn === 'rating' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="rating" />
                                    </th>

                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', position: 'relative' }}>Message</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '120px' }}></th>
                                </tr>
                            </thead>
                            <tbody>

                                {paginatedFeedback.map(item => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: '1px solid #334155',
                                            background: selectedIds.includes(item.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onClick={() => handleRowClick(item)}
                                    >
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                    {(() => {
                                                        const d = new Date(item.created_at);
                                                        const hours = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
                                                        const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
                                                        const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
                                                        const parisOffset = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
                                                        const isDST = Math.max(jan, jul) !== parisOffset;
                                                        return `${hours} ${isDST ? 'CEST' : 'CET'}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', width: '110px', margin: '0 auto' }}>
                                                <div style={{ flex: '0 0 30px', fontSize: '1.2rem', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
                                                    {item.status === 'sent' || item.status === 'new' ? (
                                                        <span style={{ color: '#22c55e' }}>✓</span>
                                                    ) : (item.status === 'delivered' || item.status === 'pending') ? (
                                                        <span style={{ color: '#22c55e' }}>✓✓</span>
                                                    ) : (
                                                        <span style={{ color: '#3b82f6' }}>✓✓</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0', textAlign: 'left', marginLeft: '8px' }}>
                                                    {item.status === 'sent' || item.status === 'new' ? 'Sent' : (item.status === 'delivered' || item.status === 'pending') ? 'Received' : 'Read'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                            <div style={{ fontWeight: 500, color: '#e2e8f0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.user_nickname || 'Anonymous'}>
                                                {(item.user_nickname || '').length > 30 ? (item.user_nickname.substring(0, 30) + '...') : (item.user_nickname || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Anonymous</span>)}
                                            </div>
                                            <code style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.user_id}>
                                                {item.user_id ? (item.user_id.length > 30 ? (item.user_id.substring(0, 30) + '...') : item.user_id) : ''}
                                            </code>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                                                {item.type === 'bug' ? '🐛' : item.type === 'suggestion' ? '💡' : '📝'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span
                                                        key={star}
                                                        style={{
                                                            fontSize: '0.9rem',
                                                            filter: item.rating && star <= item.rating ? 'none' : 'grayscale(100%) opacity(0.3)',
                                                            transition: 'filter 0.2s'
                                                        }}
                                                    >
                                                        ⭐
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                            <div style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {(item.message || '').replace(/\n*\[Rating:\s*\d\/5\s*⭐\]/g, '').trim()}
                                            </div>
                                        </td>

                                        <td style={{ padding: '0.5rem 0', verticalAlign: 'middle', textAlign: 'center', width: '120px' }} onClick={e => e.stopPropagation()}>
                                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        fontSize: '1.2rem', opacity: 0.8, transition: 'opacity 0.2s', padding: '4px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    onMouseEnter={e => e.target.style.opacity = 1}
                                                    onMouseLeave={e => e.target.style.opacity = 0.8}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {feedback.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No messages found</div>}
                    </div>
                </div>


                {previewItem && (
                    <MessagePreviewModal
                        message={previewItem}
                        onClose={() => setPreviewItem(null)}
                    />
                )}
            </div >
            <PaginationControls page={page} totalPages={totalPages} setPage={setPage} totalItems={totalItems} currentCount={paginatedFeedback.length} pageSize={pageSize} itemLabel="messages" />
        </>
    );
};

const HistorySection = ({ users = [], totalSent = 0, setConfirmModal }) => {
    const [history, setHistory] = useState([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [previewMessage, setPreviewMessage] = useState(null);


    // Pagination & Sort State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');


    // Resizable columns state
    // Resizable columns state
    const [columnWidths, setColumnWidths] = useState(() => {
        const defaults = {
            timestamp: 130,
            title: 200,
            body: 300, // Changed from null (flex) to fixed default
            template: 140, // [NEW]
            image: 80,
            target: 120
        };
        try {
            const saved = localStorage.getItem('admin_sent_columns');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Force body to have a value if it was previously null
                if (!parsed.body) parsed.body = 300;
                return { ...defaults, ...parsed };
            }
            return defaults;
        } catch (e) {
            return defaults;
        }
    });
    const [resizing, setResizing] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    const handleResizeStart = (e, column) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(column);
        setStartX(e.clientX);
        setStartWidth(columnWidths[column] || 100);
    };

    useEffect(() => {
        if (!resizing) return;
        const handleMouseMove = (e) => {
            const diff = e.clientX - startX;
            const newWidth = Math.max(40, startWidth + diff);
            setColumnWidths(prev => {
                const updated = { ...prev, [resizing]: newWidth };
                localStorage.setItem('admin_sent_columns', JSON.stringify(updated));
                return updated;
            });
        };
        const handleMouseUp = () => setResizing(null);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, startX, startWidth]);

    const ResizeHandle = ({ column }) => (
        <div
            onMouseDown={(e) => handleResizeStart(e, column)}
            style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px',
                cursor: 'col-resize', background: resizing === column ? '#3b82f6' : 'transparent', transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3b82f6'}
            onMouseLeave={(e) => { if (resizing !== column) e.target.style.background = 'transparent'; }}
        />
    );

    useEffect(() => {
        loadHistory();
        // Set up interval for refreshing data (10s to match Notifications)
        const interval = setInterval(loadHistory, 10000);
        return () => clearInterval(interval);
    }, [page, pageSize, sortColumn, sortDirection]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/push/admin/notifications/history?page=${page}&limit=${pageSize}&sort=${sortColumn}&dir=${sortDirection}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.logs || []);
                setTotalLogs(data.total || 0);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoading(false);
        }
    };


    const handlePreview = async (log) => {
        const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata || '{ }') : (log.metadata || {});
        let safeIso = log.created_at;
        if (typeof safeIso === 'string' && !safeIso.endsWith('Z') && !safeIso.includes('+') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(safeIso)) { safeIso += 'Z'; }
        if (typeof safeIso === 'string' && safeIso.includes('T') && !safeIso.endsWith('Z') && !safeIso.includes('+')) { safeIso += 'Z'; }
        const date = new Date(safeIso);

        let resolvedNickname = '🔔 Notification';

        // Logic to untangle User Name from Batch ID
        // The log.target_id is a Batch ID. To get the User Name, we must look up the batch details.
        if (meta.count === 1 && log.target_id) {
            try {
                // We reuse the existing endpoint that the DetailModal uses
                const token = localStorage.getItem('nestfinder_admin_token');
                const res = await fetch(`${API_URL}/api/push/admin/notifications/batch/${log.target_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        // We found the user!
                        resolvedNickname = data.messages[0].nickname || 'Anonymous';
                    }
                }
            } catch (err) {
                console.warn('Failed to resolve nickname for preview:', err);
            }
        } else if (meta.count > 1 || meta.target === 'all') {
            resolvedNickname = '📢 Broadcast';
        }

        setPreviewMessage({ ...meta, timestamp: date, target_id: log.target_id, nickname: resolvedNickname });
    };

    // Server-side pagination is now used
    const sortedLogs = history;
    const paginatedLogs = history;
    const totalPages = Math.ceil(totalLogs / pageSize);

    const handleSort = (column) => {
        setSortDirection(current => sortColumn === column && current === 'asc' ? 'desc' : 'asc');
        setSortColumn(column);
        setPage(1);
    };

    return (
        <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <h3>📜 Sent History</h3>
                    <span style={{
                        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0 1rem',
                        borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', cursor: 'default',
                        userSelect: 'none', border: '1px solid rgba(56, 189, 248, 0.2)', width: 'auto', minWidth: '170px'
                    }}>
                        Total: {totalSent}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            onClick={async () => {
                                setConfirmModal({
                                    show: true,
                                    title: 'Clear Sent History',
                                    message: 'Are you sure you want to CLEAR ALL Sent History? This will remove all records of sent notifications from this list.',
                                    onConfirm: async () => {
                                        try {
                                            const token = localStorage.getItem('nestfinder_admin_token');
                                            const res = await fetch(`${API_URL}/api/push/admin/notifications/cleanup`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                loadHistory();
                                            }
                                        } catch (err) { console.error('Cleanup failed:', err); }
                                    }
                                });
                            }}
                            className="btn btn-sm"
                            style={{ marginRight: '0.5rem', background: '#6366f1', color: 'white', width: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', height: '32px', border: 'none', borderRadius: '6px' }}
                            title="Delete all sent history logs"
                        >
                            🗑️ Clear History
                        </button>
                        <button onClick={loadHistory} className="btn btn-secondary btn-sm" style={{ width: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px' }}>🔄 Refresh</button>
                    </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <div style={{ maxHeight: 'calc(100vh - 330px)', overflow: 'auto', background: '#1e293b', borderRadius: '0 0 0 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                    <th onClick={() => handleSort('created_at')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: columnWidths.timestamp, position: 'relative' }}>
                                        Time {sortColumn === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="timestamp" />
                                    </th>
                                    <th onClick={() => handleSort('title')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: columnWidths.title, position: 'relative' }}>
                                        Title {sortColumn === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="title" />
                                    </th>
                                    <th onClick={() => handleSort('body')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: columnWidths.body, position: 'relative' }}>
                                        Body {sortColumn === 'body' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="body" />
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left', width: columnWidths.template, position: 'relative' }}>
                                        Template
                                        <ResizeHandle column="template" />
                                    </th>
                                    <th onClick={() => handleSort('image')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: columnWidths.image, position: 'relative' }}>
                                        Image {sortColumn === 'image' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="image" />
                                    </th>
                                    <th onClick={() => handleSort('target')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: columnWidths.target, position: 'relative' }}>
                                        Target {sortColumn === 'target' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                        <ResizeHandle column="target" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLogs.map(log => {
                                    const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata || '{}') : (log.metadata || {});
                                    let safeIso = log.created_at;
                                    if (typeof safeIso === 'string' && !safeIso.endsWith('Z') && !safeIso.includes('+') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(safeIso)) { safeIso += 'Z'; }
                                    if (typeof safeIso === 'string' && safeIso.includes('T') && !safeIso.endsWith('Z') && !safeIso.includes('+')) { safeIso += 'Z'; }
                                    const date = new Date(safeIso);

                                    return (
                                        <tr
                                            key={log.id}
                                            style={{
                                                borderBottom: '1px solid #334155',
                                                transition: 'all 0.2s ease',
                                                background: 'transparent'
                                            }}
                                            className="history-row"
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td
                                                style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', cursor: 'pointer' }}
                                                onClick={() => handlePreview(log)}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{date.toLocaleDateString()}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                        {(() => {
                                                            const hours = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
                                                            const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
                                                            const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
                                                            const parisOffset = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
                                                            const isDST = Math.max(jan, jul) !== parisOffset;
                                                            return `${hours} ${isDST ? 'CEST' : 'CET'}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', cursor: 'pointer' }}
                                                onClick={() => handlePreview(log)}
                                            >
                                                <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{meta.title}</div>
                                            </td>
                                            <td
                                                style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', cursor: 'pointer' }}
                                                onClick={() => handlePreview(log)}
                                            >
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                    {meta.body ? (meta.body.length > 45 ? meta.body.substring(0, 45) + '...' : meta.body) : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>-</span>}
                                                </div>
                                            </td>
                                            <td
                                                style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', cursor: 'pointer' }}
                                                onClick={() => handlePreview(log)}
                                            >
                                                {(() => {
                                                    const tInfo = getTemplateInfo(meta.template);
                                                    return (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                                            <span>{tInfo.icon}</span>
                                                            <span>{tInfo.name}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: meta.image || (meta.template && meta.template.includes('img')) ? '#4ade80' : '#64748b',
                                                    background: meta.image ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                                                    padding: '2px 8px', borderRadius: '4px'
                                                }}>
                                                    {meta.image ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <span
                                                    onClick={() => {
                                                        if (log.target_id) setSelectedBatchId(log.target_id);
                                                    }}
                                                    style={{
                                                        background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80',
                                                        padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 500,
                                                        border: '1px solid rgba(74, 222, 128, 0.2)',
                                                        cursor: log.target_id ? 'pointer' : 'default'
                                                    }}
                                                >
                                                    {meta.count} users
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {history.length === 0 && !loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No history found</div>}
                    </div>
                </div>
            </div>
            <PaginationControls page={page} totalPages={totalPages} setPage={setPage} totalItems={totalLogs} currentCount={paginatedLogs.length} pageSize={pageSize} itemLabel="messages" />

            {selectedBatchId && (
                <DetailModal batchId={selectedBatchId} onClose={() => setSelectedBatchId(null)} />
            )}

            {previewMessage && (
                <MessagePreviewModal message={previewMessage} onClose={() => setPreviewMessage(null)} />
            )}
        </>
    );
};



// --- REUSABLE PAGINATION COMPONENT ---
const PaginationControls = ({ page, totalPages, setPage, totalItems, currentCount, pageSize = 30, itemLabel = 'items' }) => {
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(start + currentCount - 1, totalItems);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0.75rem 0', marginTop: '0.5rem', borderTop: '1px solid #334155' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Showing {start}-{end} of {totalItems} {itemLabel}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', visibility: totalPages > 1 ? 'visible' : 'hidden' }}>
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: page <= 1 ? '#1e293b' : '#334155', color: page <= 1 ? '#64748b' : '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                    ◀ Prev
                </button>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', minWidth: '80px', textAlign: 'center' }}>
                    Page {page} of {totalPages || 1}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: page >= totalPages ? '#1e293b' : '#334155', color: page >= totalPages ? '#64748b' : '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                    Next ▶
                </button>
            </div>
            <div></div>
        </div>
    );
};


const EmojiPickerModal = ({ onSelect, onClose }) => {
    const categories = {
        'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'],
        'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🫀', '🫁', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'],
        'Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', 'RAM', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🐚', '🪨', '🪵', '🔥', '💧', '✨', '🌟', '💫', '⭐', '☀️', '⛅', '☁️', '⚡', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫', '🌈', '☔', '☂️', '🌊'],
        'Objects': ['👓', '🕶', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑', '🪖', '💄', '💍', '💎', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '🎙', '🎚', '🎛', '🎤', '🎧', '📻', '🎷', '🪗', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥', '🖨', '⌨️', '🖱', '🖲', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞', '📽', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞', '📑', '🔖', '🏷', '💰', '🪙', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳', '✏️', '✒️', '🖋', '🖊', '🖌', '🖍', '📝', '💼', '📁', '📂', '🗂', '📅', '📆', '🗒', '🗓', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇', '📏', '📐', '✂️', '🗃', '🗄', '🗑', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝', '🔨', '🪓', '⛏', '⚒', '🛠', '🗡', '⚔️', '🔫', '🪃', '🏹', '🛡', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜', '⚖️', '🦯', '🔗', '⛓', '🪝', '🧰', '🧲', '🪜', '🪑', '🛋', '🛌', '🧸', '🪆', '🖼', '🪞', '🧹', '🪠', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🏹']
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.1)', // Lighter backdrop
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000
        }} onClick={onClose}>
            <div style={{
                background: '#1e293b',
                borderRadius: '12px',
                padding: '1rem',
                width: 'min(900px, 95vw)',
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                border: '1px solid #334155'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0' }}>Pick an Emoji</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>&times;</button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                    {Object.entries(categories).map(([category, emojis]) => (
                        <div key={category} style={{ marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>{category}</h4>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '0.3rem',
                                // Reduce gap and padding to fit more
                            }}>
                                {emojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => onSelect(emoji)}
                                        style={{
                                            background: 'none', border: 'none',
                                            fontSize: '1.4rem', cursor: 'pointer', padding: '2px', // Compact padding
                                            transition: 'transform 0.1s',
                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

const DetailModal = ({ batchId, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('nestfinder_admin_token');
                const res = await fetch(`${API_URL}/api/push/admin/notifications/batch/${batchId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setDetails(data);
                }
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchDetails();
    }, [batchId]);

    // Format helper for 2-line date/time (Fixing SQLite UTC assumption)
    const DateTimeCell = ({ isoString, color = '#e2e8f0' }) => {
        if (!isoString) return <span style={{ color: '#64748b' }}>-</span>;

        // SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" which JS parses as Local. 
        // We must treat it as UTC by appending 'Z' if missing.
        let safeIso = isoString;
        if (typeof safeIso === 'string' && !safeIso.endsWith('Z') && !safeIso.includes('+') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(safeIso)) {
            safeIso += 'Z';
        }
        // Also handle "T" separator if standard ISO
        if (typeof safeIso === 'string' && safeIso.includes('T') && !safeIso.endsWith('Z') && !safeIso.includes('+')) {
            safeIso += 'Z';
        }

        const date = new Date(safeIso);

        // Format Time with CET/CEST
        const hours = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
        // Reliable Summer Time Calculation for Europe/Paris
        const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
        const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        const parisOffset = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
        const isDST = Math.max(jan, jul) !== parisOffset;
        const timeString = `${hours} ${isDST ? 'CEST' : 'CET'}`;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color }}>{date.toLocaleDateString()}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeString}</span>
            </div>
        );
    };

    // Modal Content
    const pendingCount = details ? details.stats.total - details.stats.delivered - details.stats.read : 0;

    const modalContent = (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
        }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '16px',
                width: '100%', maxWidth: '900px',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                border: '1px solid #334155'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Message Details</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Fixed Stats Section */}
                <div style={{ padding: '1.5rem 1.5rem 0', flexShrink: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', background: '#334155', borderRadius: '12px', textAlign: 'center', border: '1px solid #475569' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f8fafc' }}>{details?.stats?.total || 0}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                        </div>
                        {/* New SENT (Pending) Box */}
                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>{pendingCount}</div>
                            <div style={{ color: '#fbbf24', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ade80' }}>{details?.stats?.delivered || 0}</div>
                            <div style={{ color: '#4ade80', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivered</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#60a5fa' }}>{details?.stats?.read || 0}</div>
                            <div style={{ color: '#60a5fa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Read</div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Table Area */}
                <div style={{ padding: '0 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading details...</div>
                    ) : details ? (
                        <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
                                    <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>User</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Sent</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Received</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Read</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.messages.map(msg => (
                                        <tr key={msg.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '0.6rem 0.75rem', verticalAlign: 'middle' }}>
                                                <div style={{ fontWeight: 500, color: '#e2e8f0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={msg.nickname || 'Anonymous'}>
                                                    {msg.nickname ? (
                                                        msg.nickname.length > 30 ? msg.nickname.substring(0, 30) + '...' : msg.nickname
                                                    ) : (
                                                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Anonymous</span>
                                                    )}
                                                </div>
                                                <code style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={msg.device_id}>
                                                    {msg.device_id?.length > 30 ? msg.device_id.substring(0, 30) + '...' : msg.device_id}
                                                </code>
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <DateTimeCell isoString={msg.created_at || msg.timestamp} />
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <DateTimeCell isoString={msg.delivered_at} />
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <DateTimeCell isoString={msg.read_at} />
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                {/* Fixed width container centered with margin: auto to ensure vertical alignment of text across rows */}
                                                <div style={{ display: 'flex', alignItems: 'center', width: '110px', margin: '0 auto' }}>
                                                    <div style={{ flex: '0 0 30px', fontSize: '1.2rem', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
                                                        {msg.read ? (
                                                            <span style={{ color: '#3b82f6' }}>✓✓</span>
                                                        ) : msg.delivered ? (
                                                            <span style={{ color: '#22c55e' }}>✓✓</span>
                                                        ) : (
                                                            <span style={{ color: '#22c55e' }}>✓</span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8', textAlign: 'left', marginLeft: '8px' }}>
                                                        {msg.read ? 'Read' : msg.delivered ? 'Delivered' : 'Sent'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {details.messages.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No recipients found</div>}
                        </div>
                    ) : (
                        <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>Error loading details</div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

const MessagePreviewModal = ({ message, onClose }) => {
    // Helper for CET/CEST Time
    const formatTimeCET = (dateObj) => {
        if (!dateObj) return '';
        // Check if Summer Time (Approximation for EU: Last Sun March to Last Sun Oct)
        // Or simpler: use Intl.DateTimeFormat with timeZone: 'Europe/Paris' or 'CET' if supported
        try {
            const timePart = dateObj.toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZone: 'Europe/Paris'
            });
            // Determine Standard vs Summer for suffix (simplified or explicit)
            // 'Europe/Paris' handles the offset correctly. We just append the label.
            // Getting the specific zone abbreviation is tricky cross-browser without libraries.
            // We will stick to the generic CET/CEST convention based on offset or just hardcode based on date.

            // Reliable trick: check offset.
            // Paris is UTC+1 (CET) or UTC+2 (CEST)
            // We can infer from the date string representation in that timezone
            const isSummer = dateObj.toLocaleString('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'short' }).includes('GMT+2')
                || dateObj.toLocaleString('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'short' }).includes('CEST');

            return `${timePart} ${isSummer ? 'CEST' : 'CET'}`;
        } catch (e) {
            // Fallback for environments without ICU full data
            return dateObj.toLocaleTimeString() + ' (Local)';
        }
    };

    // Determine Mode
    const isFeedback = 'user_nickname' in message || 'type' in message;
    const isNotification = !isFeedback;

    // Data Parsing
    let dateObj = null;
    if (message.created_at) dateObj = new Date(message.created_at);
    else if (message.timestamp) dateObj = new Date(message.timestamp);

    // Header Content
    let headerTitle = '';
    let headerIcon = null;

    if (isFeedback) {
        // Feedback Header: [Icon] [Nickname]
        const typeIcon = message.type === 'bug' ? '🐛' : message.type === 'suggestion' ? '💡' : '📝';
        // Ensure we grab the first available nickname property
        const rawNickname = message.user_nickname || message.nickname || 'Anonymous';
        const cleanNickname = String(rawNickname).replace(/^@/, '').trim();
        headerTitle = `@${cleanNickname}`;
        headerIcon = <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>{typeIcon}</span>;
    } else {
        // Notification Header: Recipient or Bulk
        // Fallback to target_id if nickname is missing
        // Logic fix: Only show "Bulk" if count > 1 or target is clearly 'all'.
        // Do NOT assume target_id format defines bulk/single status (e.g. 'Ioscompose' is a valid single user ID).
        const isBulk = (message.count > 1) || message.target === 'all';
        headerTitle = isBulk ? 'Bulk Message' : ((message.nickname ? `@${message.nickname}` : null) || message.target_id || message.device_id?.substr(0, 8) || 'Anonymous');
    }

    // Border Color
    let borderColor = '#3b82f6'; // Default Blue
    if (isFeedback) {
        if (message.type === 'bug') borderColor = '#ef4444';
        else if (message.type === 'suggestion') borderColor = '#3b82f6';
        else borderColor = '#94a3b8';
    }

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '90%', maxWidth: '400px', background: '#1e293b',
                    borderRadius: '12px', padding: '0', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    overflow: 'hidden', border: '1px solid #334155'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1rem', borderBottom: '1px solid #334155',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {headerIcon}
                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headerTitle}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.5rem', background: '#1e293b' }}>

                    {/* FEEDBACK STYLE: [Date] [Bell] [Time] - Split Layout */}
                    {isFeedback && dateObj && (
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
                            marginBottom: '1rem', color: '#94a3b8', fontSize: '0.85rem'
                        }}>
                            <span style={{ textAlign: 'left' }}>{dateObj.toLocaleDateString()}</span>
                            <span style={{ fontSize: '1rem' }}>🔔</span>
                            <span style={{ textAlign: 'right' }}>{formatTimeCET(dateObj)}</span>
                        </div>
                    )}

                    {/* NOTIFICATION STYLE: Split Date/Time */}
                    {isNotification && dateObj && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                            <span>{dateObj.toLocaleDateString()}</span>
                            <span>{formatTimeCET(dateObj)}</span>
                        </div>
                    )}

                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid #334155',
                        background: '#334155',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${borderColor}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {/* NOTIFICATION TITLE (Inside Box) */}
                        {isNotification && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🔔</span>
                                <span style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '1rem' }}>{message.title}</span>
                            </div>
                        )}

                        {/* Image */}
                        {message.image && (
                            <div style={{ marginBottom: '0.8rem', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src={message.image} alt="Attachment" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        )}

                        {/* Message/Body */}
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {((message.message || message.body) || '').replace(/\n*\[Rating:\s*\d\/5\s*⭐\]/g, '').trim()}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Messages;

function BroadcastDetailPopup({ broadcast, onClose, onViewRecipients, onDelete }) {
    if (!broadcast) return null;

    // Helper logic (Duplicated from Broadcast Card)
    const getPriorityColor = (p) => {
        const val = p || 3;
        if (val <= 1) return '#ef4444';
        if (val === 2) return '#f97316';
        if (val === 3) return '#eab308';
        if (val === 4) return '#3b82f6';
        return '#22c55e';
    };

    const now = new Date();
    const start = new Date(broadcast.start_time);
    const end = new Date(broadcast.end_time);
    const isActive = now >= start && now <= end;
    const isEnded = now > end;

    let statusText = isActive ? 'Active' : (isEnded ? 'Ended' : 'Scheduled');
    let statusColor = isActive ? '#22c55e' : (isEnded ? '#94a3b8' : '#3b82f6');
    let priorityColor = getPriorityColor(broadcast.priority);

    // Badge styling helpers
    const badgeBg = (color) => `${color}20`;
    const badgeBorder = (color) => `${color}40`;

    // Helper for CET time (DD/MM/YYYY HH:MM:SS CET)
    const formatDateTimeCET = (dateStr) => {
        if (!dateStr) return 'N/A';
        const dateObj = new Date(dateStr);
        const datePart = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timePart = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
        return `${datePart} ${timePart} CET`;
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                background: '#1e293b', borderRadius: '12px', padding: '0',
                width: 'min(900px, 95vw)', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>📢 Broadcast Details</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* Content Body - Landscape Layout */}
                <div style={{ padding: '0', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'row', minHeight: '300px' }}>

                    {/* Left Column: Image (Flexible width, no gaps) */}
                    {broadcast.image_url && (
                        <div style={{
                            flexShrink: 0,
                            background: '#000', // Matches image bg usually
                            borderRight: '1px solid #334155',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            maxWidth: '400px' // Reasonable max width
                        }}>
                            <img
                                src={broadcast.image_url}
                                alt="Broadcast"
                                style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    height: 'auto',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    )}

                    {/* Right Column: Details */}
                    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

                        {/* Title & Badges Row (Replaces Metadata Grid) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>{broadcast.title || 'Untitled Broadcast'}</h4>

                            {/* Badges: Status, Priority, MaxViews */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {/* Status */}
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '4px',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    background: badgeBg(statusColor), color: statusColor,
                                    border: `1px solid ${badgeBorder(statusColor)}`,
                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                }}>
                                    {statusText}
                                </span>

                                {/* Priority */}
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '4px',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    background: badgeBg(priorityColor), color: priorityColor,
                                    border: `1px solid ${badgeBorder(priorityColor)}`
                                }}>
                                    P{broadcast.priority || 3}
                                </span>

                                {/* Max Views */}
                                {broadcast.max_views ? (
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px',
                                        fontSize: '0.75rem', fontWeight: 700,
                                        background: (broadcast.total_users || 0) >= broadcast.max_views ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                                        color: (broadcast.total_users || 0) >= broadcast.max_views ? '#ef4444' : '#06b6d4',
                                        border: (broadcast.total_users || 0) >= broadcast.max_views ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)'
                                    }}>
                                        👁 {broadcast.total_users || 0} / {broadcast.max_views}
                                    </span>
                                ) : (
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px',
                                        fontSize: '0.75rem', fontWeight: 700,
                                        background: 'rgba(6, 182, 212, 0.1)',
                                        color: '#06b6d4',
                                        border: '1px solid rgba(6, 182, 212, 0.3)'
                                    }}>
                                        👁 ∞
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Time Info (Kept separate as it's not a badge) */}
                        {/* Time Info - Redesigned to match Tooltip Style (Grid Layout) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'min-content auto min-content',
                            alignItems: 'center',
                            columnGap: '0.6rem', // Keep horizontal gap tight
                            rowGap: '0.3rem',    // Vertical gap
                            background: '#0f172a',
                            padding: '0.8rem 1rem 0.8rem 1.4rem', // Extra left padding for icon overhang
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            marginBottom: '1.5rem',
                            position: 'relative',
                            width: 'fit-content' // Just wrap content
                        }}>
                            {/* Floating Icon on Border */}
                            <div style={{
                                position: 'absolute',
                                left: '10px',
                                top: '-10px',
                                background: '#0f172a',
                                padding: '0 4px',
                                fontSize: '1rem',
                                lineHeight: 1,
                                color: '#94a3b8'
                            }}>
                                🕐
                            </div>

                            {/* Start Row */}
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Start</span>
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                {formatDateTimeCET(broadcast.start_time)}
                            </span>
                            <span style={{ fontSize: '0.8rem', opacity: 0 }}></span> {/* Spacer */}

                            {/* End Row */}
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>End</span>
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                {formatDateTimeCET(broadcast.end_time)}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}></span>
                        </div>


                        {/* Message Body */}
                        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', color: '#cbd5e1', whiteSpace: 'pre-wrap', marginBottom: '1.5rem', flex: 1, overflowY: 'auto' }}>
                            {broadcast.message}
                        </div>

                        {/* Redesigned Stats Area (Clickable) */}
                        {/* Redesigned Stats Cards Area */}
                        <div
                            onClick={onViewRecipients}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '1rem',
                                marginBottom: '1rem',
                                cursor: 'pointer'
                            }}
                            title="View Recipients Details"
                        >
                            {/* Total Card */}
                            <div style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.1s, border-color 0.1s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#eab308'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                                    {broadcast.total_users || 0}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#eab308', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total</span>
                            </div>

                            {/* Delivered Card */}
                            <div style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.1s, border-color 0.1s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#22c55e', fontSize: '1rem' }}>✓✓</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                                        {Math.max(0, (broadcast.delivered_count || 0) - (broadcast.read_count || 0))}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#22c55e', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Delivered</span>
                            </div>

                            {/* Read Card */}
                            <div style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.1s, border-color 0.1s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#3b82f6', fontSize: '1rem' }}>✓✓</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                                        {broadcast.read_count || 0}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Read</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions - Sticky Footer */}
                <div style={{
                    padding: '1rem 1.5rem', background: '#0f172a', borderTop: '1px solid #334155',
                    display: 'flex', gap: '1rem', justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onDelete}
                        className="btn btn-danger"
                        style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }}
                    >
                        🗑️ Delete Broadcast
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

function BroadcastRecipientsModal({ broadcastId, onClose }) {
    const [views, setViews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchViews = async () => {
            try {
                // Use adminApi to ensure correct base URL (/api) and headers
                const data = await adminApi.fetch(`/admin/broadcasts/${broadcastId}/views`);
                setViews(data.views || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchViews();
    }, [broadcastId]);

    const total = views.length;
    const readCount = views.filter(v => v.status === 'read').length;
    const deliveredCount = views.filter(v => v.status === 'delivered').length;
    const pendingCount = views.filter(v => v.status === 'sent').length;

    const DateTimeCell = ({ isoString }) => {
        if (!isoString) return <span style={{ color: '#64748b' }}>-</span>;
        const date = new Date(isoString);

        // Format Time with CET/CEST
        const hours = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
        const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
        const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        const parisOffset = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
        const isDST = Math.max(jan, jul) !== parisOffset;
        const timeString = `${hours} ${isDST ? 'CEST' : 'CET'}`;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{date.toLocaleDateString()}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeString}</span>
            </div>
        );
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                background: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '900px',
                maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #334155'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Broadcast Recipients</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>⌛</div>
                            <div style={{ fontWeight: 500 }}>Loading interactions...</div>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div style={{ padding: '1.5rem 1.5rem 0', flexShrink: 0 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '1rem', background: '#334155', borderRadius: '12px', textAlign: 'center', border: '1px solid #475569' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f8fafc' }}>{total}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ade80' }}>{deliveredCount}</div>
                                        <div style={{ color: '#4ade80', fontSize: '0.85rem', textTransform: 'uppercase' }}>Delivered</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#60a5fa' }}>{readCount}</div>
                                        <div style={{ color: '#60a5fa', fontSize: '0.85rem', textTransform: 'uppercase' }}>Read</div>
                                    </div>
                                </div>
                            </div>

                            {/* Table area */}
                            <div style={{ padding: '0 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                {views.length === 0 ? (
                                    <div style={{ padding: '3rem', border: '1px solid #334155', borderRadius: '12px', textAlign: 'center', color: '#64748b', background: '#0f172a' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                                        <div style={{ fontWeight: 500, color: '#94a3b8' }}>No interaction records found</div>
                                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Recipients have not received or viewed this broadcast yet.</div>
                                    </div>
                                ) : (
                                    <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'auto', flex: 1, background: '#1e293b' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
                                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>User</th>
                                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Received</th>
                                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Read</th>
                                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {views.map(view => (
                                                    <tr key={view.id} style={{ borderBottom: '1px solid #334155' }}>
                                                        <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                                <span style={{ fontWeight: 500, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {view.user_nickname || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Anonymous</span>}
                                                                </span>
                                                                <code style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', whiteSpace: 'nowrap' }}>{view.user_id}</code>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                            <DateTimeCell isoString={view.delivered_at || view.created_at} />
                                                        </td>
                                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                            <DateTimeCell isoString={view.status === 'read' ? view.updated_at : null} />
                                                        </td>
                                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', width: '110px', margin: '0 auto' }}>
                                                                <div style={{ flex: '0 0 30px', fontSize: '1.2rem', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
                                                                    {view.status === 'read' ? (
                                                                        <span style={{ color: '#3b82f6' }}>✓✓</span>
                                                                    ) : view.status === 'delivered' ? (
                                                                        <span style={{ color: '#22c55e' }}>✓✓</span>
                                                                    ) : (
                                                                        <span style={{ color: '#22c55e' }}>✓</span>
                                                                    )}
                                                                </div>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8', textAlign: 'left', marginLeft: '8px' }}>
                                                                    {view.status === 'read' ? 'Read' : (view.status === 'delivered' ? 'Delivered' : 'Sent')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// --- Timeline Component ---
function Timeline({ broadcasts, selectedBroadcast, onBroadcastClick, onBroadcastUpdate, onHoveredBarChange, externalHoverId }) {
    const containerRef = React.useRef(null);
    const scrollInterval = React.useRef(null);
    const latestHandleWheel = React.useRef(null);
    const lastDragTimeRef = React.useRef(0); // For click suppression
    const hoverTimeoutRef = React.useRef(null); // For tooltip delay
    const lastMousePosRef = React.useRef({ x: 0, y: 0 }); // Track mouse for tooltip placement

    // Viewport State (Time Window)
    const [viewportStart, setViewportStart] = useState(0);
    const [viewportDuration, setViewportDuration] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [initialViewportDuration, setInitialViewportDuration] = useState(3600000);

    const [manualHeight, setManualHeight] = useState(null);

    // Interaction State
    const [hoveredBarId, setHoveredBarId] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [crosshairPos, setCrosshairPos] = useState({ x: null, y: null });

    // Notify parent when hovered bar changes
    useEffect(() => {
        if (onHoveredBarChange) {
            onHoveredBarChange(hoveredBarId);
        }
    }, [hoveredBarId, onHoveredBarChange]);

    // Drag State
    const [dragging, setDragging] = useState(null); // { id, type, startX, originalStart, originalEnd, newStart, newEnd }




    // 0. Scroll Lock Effect (Must be top-level)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e) => latestHandleWheel.current && latestHandleWheel.current(e);
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [isInitialized]);

    // 1. Initial Scale (Fixed 9-hour window centered on NOW)
    useEffect(() => {
        if (isInitialized) return;

        // 9 hours total span
        const duration = 9 * 60 * 60 * 1000;
        const now = new Date().getTime();

        // Center: Start = Now - 4.5 hours
        const start = now - (duration / 2);

        setViewportStart(start);
        setViewportDuration(duration);
        setInitialViewportDuration(duration);
        setIsInitialized(true);
    }, [isInitialized]);

    // 2. Swimlane Logic
    // REF to latest handlers for global listener
    const latestHandlers = React.useRef({ move: null, up: null });

    // Update ref on every render
    React.useEffect(() => {
        latestHandlers.current.move = handleMouseMove;
        latestHandlers.current.up = handleMouseUp;
    });

    // Global Event Listeners for Dragging
    const isDragging = !!dragging;
    React.useEffect(() => {
        if (isDragging) {

            const onMove = (e) => {
                latestHandlers.current.move && latestHandlers.current.move(e);
            };
            const onUp = (e) => {
                console.log('[Timeline] Global Up');
                latestHandlers.current.up && latestHandlers.current.up(e);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            return () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
        }
    }, [isDragging]);


    const { lanes, laneCount, broadcastLaneMap } = React.useMemo(() => {
        if (!broadcasts.length) return { lanes: [], laneCount: 0, broadcastLaneMap: {} };

        const sorted = [...broadcasts].filter(b => {
            const s = new Date(b.start_time).getTime();
            // Allow null end_time (Infinite) OR Magic Date (> 2090)
            let e = b.end_time ? new Date(b.end_time).getTime() : Infinity;
            if (e > 4102444800000) e = Infinity; // > Jan 1 2100 basically

            return !isNaN(s) && (!b.end_time || !isNaN(e));
        }).sort((a, b) => {
            const sA = new Date(a.start_time).getTime();
            const sB = new Date(b.start_time).getTime();
            if (sA !== sB) return sA - sB;

            // If end time is null (Infinite) or Magic Date
            let eA = a.end_time ? new Date(a.end_time).getTime() : Number.MAX_SAFE_INTEGER;
            if (eA > 4102444800000) eA = Number.MAX_SAFE_INTEGER;

            let eB = b.end_time ? new Date(b.end_time).getTime() : Number.MAX_SAFE_INTEGER;
            if (eB > 4102444800000) eB = Number.MAX_SAFE_INTEGER;

            return (eB - sB) - (eA - sA);
        });

        // Step 1: Find max lane needed for manually assigned broadcasts
        let maxManualLane = -1;
        sorted.forEach(b => {
            if (b.lane !== null && b.lane !== undefined && b.lane >= 0) {
                maxManualLane = Math.max(maxManualLane, b.lane);
            }
        });

        // Step 2: Initialize lanes array
        const lanes = [];
        const laneEnds = [];
        for (let i = 0; i <= maxManualLane; i++) {
            lanes.push([]);
            laneEnds.push(-Infinity);
        }

        // Step 3: Place broadcasts with manual lane assignment first
        const autoPlaceBroadcasts = [];
        sorted.forEach(b => {
            if (b.lane !== null && b.lane !== undefined && b.lane >= 0) {
                const start = new Date(b.start_time).getTime();
                let end = b.end_time ? new Date(b.end_time).getTime() : Number.MAX_SAFE_INTEGER; // Infinite
                if (end > 4102444800000) end = Number.MAX_SAFE_INTEGER;

                lanes[b.lane].push(b);
                laneEnds[b.lane] = Math.max(laneEnds[b.lane], end === Number.MAX_SAFE_INTEGER ? end : end);
            } else {
                autoPlaceBroadcasts.push(b);
            }
        });

        // Step 4: Auto-place remaining broadcasts (no manual lane)
        // REFACTOR: Use gap-filling logic instead of append-only to prevent unnecessary lane shifting
        autoPlaceBroadcasts.forEach(b => {
            const start = new Date(b.start_time).getTime();
            let end = b.end_time ? new Date(b.end_time).getTime() : Number.MAX_SAFE_INTEGER;
            if (end > 4102444800000) end = Number.MAX_SAFE_INTEGER;

            let placed = false;

            // Helper to check collision with specific range
            const checkCollision = (msg, s, e) => {
                const msgStart = new Date(msg.start_time).getTime();
                let msgEnd = msg.end_time ? new Date(msg.end_time).getTime() : Number.MAX_SAFE_INTEGER;
                if (msgEnd > 4102444800000) msgEnd = Number.MAX_SAFE_INTEGER;

                // Simple overlap check
                return Math.max(s, msgStart) < Math.min(e, msgEnd);
            };

            // Try to place in existing lane (fill gaps)
            for (let i = 0; i < lanes.length; i++) {
                // Check if this new message overlaps with ANYTHING currently in this lane
                const hasCollision = lanes[i].some(existingMsg => checkCollision(existingMsg, start, end));

                if (!hasCollision) {
                    lanes[i].push(b);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                lanes.push([b]);
            }
        });

        // Step 6: Compact lanes (Remove gaps)
        const compactedLanes = lanes.filter(lane => lane.length > 0);

        // Step 7: Build broadcast -> lane map for quick lookup
        const broadcastLaneMap = {};
        compactedLanes.forEach((lane, laneIndex) => {
            lane.forEach(b => {
                broadcastLaneMap[b.id] = laneIndex;
            });
        });

        return { lanes: compactedLanes, laneCount: compactedLanes.length, broadcastLaneMap };
    }, [broadcasts, viewportDuration]);


    // Generate ticks based on current viewport
    const ticks = React.useMemo(() => {
        const t = [];
        const durationHours = viewportDuration / 3600000;

        // Always generate all tick levels, but show/hide based on zoom
        const showQuarters = durationHours <= 3; // Show quarter ticks when < 3 hours
        const showHalves = durationHours <= 12; // Show half-hour ticks when < 12 hours

        // Use 15-minute base interval for quarter-hour precision
        const baseInterval = showQuarters ? 900000 : (showHalves ? 1800000 : 3600000);

        if (viewportDuration > 0) {
            const startTick = Math.ceil(viewportStart / baseInterval) * baseInterval;
            const endTime = viewportStart + viewportDuration;

            for (let time = startTick; time < endTime; time += baseInterval) {
                const left = ((time - viewportStart) / viewportDuration) * 100;

                // Skip if off-screen
                if (left < -5 || left > 105) continue;

                // Determine Type based on time
                const d = new Date(time);
                const m = d.getMinutes();
                let type = 'quarter'; // 15, 45
                if (m === 0) type = 'hour';
                else if (m === 30) type = 'half';

                // Skip quarter ticks if not showing them
                if (type === 'quarter' && !showQuarters) continue;
                // Skip half ticks if not showing them
                if (type === 'half' && !showHalves) continue;

                t.push({ time, left, type });
            }
        }
        return t;
    }, [viewportStart, viewportDuration]);

    // Dimensions - Scale bars when container is resized
    const rulerHeight = 28;
    const paddingBottom = 4;
    const baseRowHeight = 12;
    const baseGap = 4;

    // Calculate available space for lanes (excluding ruler and padding)
    const baseContentHeight = rulerHeight + laneCount * (baseRowHeight + baseGap) + baseGap + paddingBottom;

    // If manualHeight is set and larger than base, scale rows proportionally
    let rowHeight = baseRowHeight;
    let gap = baseGap;

    if (manualHeight && manualHeight > baseContentHeight && laneCount > 0) {
        const availableForLanes = manualHeight - rulerHeight - paddingBottom - baseGap;
        // Each lane takes rowHeight + gap, except last which is just rowHeight (plus trailing gap)
        // Total = laneCount * (rowHeight + gap) + gap at top
        // availableForLanes = rowHeight * laneCount + gap * (laneCount + 1)
        // Let gap scale proportionally: gap = rowHeight / 3
        // availableForLanes = rowHeight * laneCount + (rowHeight/3) * (laneCount + 1)
        // Solve for rowHeight:
        const scaleFactor = availableForLanes / (laneCount * (baseRowHeight + baseGap) + baseGap);
        rowHeight = Math.min(baseRowHeight * scaleFactor, 40); // Cap at 40px
        gap = Math.min(baseGap * scaleFactor, 12); // Cap gap at 12px
    }

    const totalHeight = Math.max(manualHeight || 0, rulerHeight + laneCount * (rowHeight + gap) + gap + paddingBottom);
    const contentHeight = rulerHeight + laneCount * (rowHeight + gap) + gap + paddingBottom;

    // --- Interaction Handlers ---

    function handleWheel(e) {
        if (!containerRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const width = rect.width;

        const mouseRatio = Math.max(0, Math.min(1, mouseX / width));
        const mouseTime = viewportStart + (viewportDuration * mouseRatio);

        const isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);

        if (isVertical) {
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            const newDuration = Math.max(3600000, viewportDuration * zoomFactor);
            const newStart = mouseTime - (newDuration * mouseRatio);
            setViewportDuration(newDuration);
            setViewportStart(newStart);
        } else {
            const panAmount = (e.deltaX) * (viewportDuration / width);
            setViewportStart(prev => prev + panAmount);
        }
    }

    latestHandleWheel.current = handleWheel;

    function handleBarMouseEnter(b, rawStart, rawEnd) {
        setHoveredBarId(b.id);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            // FIX: Use ref for position to prevent 0,0 jump if mouse stopped moving
            setTooltipPos(lastMousePosRef.current);
            setHoveredItem({ ...b, currentStart: rawStart, currentEnd: rawEnd });
        }, 750);
    }

    function handleBarMouseLeave() {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredBarId(null);
        setHoveredItem(null);
    }

    // Use RAF loop for mouse move to prevent lag/jitter
    const rafRef = useRef(null);

    function handleMouseMove(e) {
        // Persist event values needed
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Always track mouse position immediately for refs
        lastMousePosRef.current = { x: clientX, y: clientY };

        if (!containerRef.current) return;

        // Cancel previous frame if still pending to avoid stacking
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;
            const width = rect.width;

            const cursorTime = viewportStart + (viewportDuration * (mouseX / width));

            if (!dragging && !hoveredBarId) {
                setCrosshairPos({
                    x: mouseX,
                    y: Math.max(0, mouseY - rulerHeight)
                });
            }

            if (hoveredItem) {
                setTooltipPos({ x: clientX, y: clientY });
            }

            if (dragging) {
                // Fix: If committing, ignore mouse moves to prevent "sticking"
                if (dragging.isCommitting) return;

                if (dragging.type === 'resize-height') {
                    const newH = Math.max(mouseY, contentHeight);
                    setManualHeight(newH);
                    return;
                }

                const edgeDist = 50;
                if (mouseX < edgeDist) {
                    const factor = Math.pow((edgeDist - mouseX) / edgeDist, 2) * 0.03;
                    setViewportStart(s => s - (viewportDuration * factor));
                } else if (mouseX > width - edgeDist) {
                    const factor = Math.pow((mouseX - (width - edgeDist)) / edgeDist, 2) * 0.03;
                    setViewportStart(s => s + (viewportDuration * factor));
                }

                if (dragging.type === 'pan') {
                    const pixelDelta = clientX - dragging.startX;
                    const timeDelta = pixelDelta * (viewportDuration / width);
                    setViewportStart(dragging.initialViewportStart - timeDelta);
                    return;
                }

                let newStart = dragging.originalStart;
                let newEnd = dragging.originalEnd;
                // const cursorTimeNow = viewportStart + (viewportDuration * (mouseX / width)); // redundant
                const absDelta = cursorTime - dragging.initialCursorTime;

                if (dragging.type === 'move') {
                    newStart = dragging.originalStart + absDelta;
                    newEnd = dragging.originalEnd + absDelta;

                    const yOffsetFromRuler = mouseY - rulerHeight - gap;
                    const newLane = Math.max(0, Math.floor(yOffsetFromRuler / (rowHeight + gap)));

                    let hasMoved = dragging.hasMoved;
                    if (!hasMoved) {
                        const absXDelta = Math.abs(mouseX - dragging.initialCursorX);
                        const absYDelta = Math.abs(mouseY - dragging.initialCursorY);
                        if (absXDelta > 5 || absYDelta > 5) {
                            hasMoved = true;
                        }
                    }

                    // Only update if changed to avoid renders
                    setDragging(prev => {
                        if (prev.newStart === newStart && prev.newEnd === newEnd && prev.newLane === newLane && prev.hasMoved === hasMoved) return prev;
                        return { ...prev, newStart, newEnd, newLane, hasMoved };
                    });
                    return;
                } else if (dragging.type === 'resize-left') {
                    newStart = Math.min(dragging.originalStart + absDelta, dragging.originalEnd - 900000);
                    let hasMoved = dragging.hasMoved;
                    if (!hasMoved) hasMoved = true;
                    setDragging(prev => ({ ...prev, newStart, newEnd, hasMoved }));
                } else if (dragging.type === 'resize-right') {
                    newEnd = Math.max(dragging.originalEnd + absDelta, dragging.originalStart + 900000);
                    let hasMoved = dragging.hasMoved;
                    if (!hasMoved) hasMoved = true;
                    setDragging(prev => ({ ...prev, newStart, newEnd, hasMoved }));
                }
            }
        });
    }

    function handleContainerDoubleClick(e) {
        if (dragging) return;
        const now = new Date().getTime();
        const newStart = now - (initialViewportDuration / 2);
        setViewportDuration(initialViewportDuration);
        setViewportStart(newStart);
    }

    function handleMouseDown(e, b, type) {
        e.preventDefault();
        e.stopPropagation();

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const width = rect.width;
        const cursorTime = viewportStart + (viewportDuration * (mouseX / width));

        // Get current lane from broadcastLaneMap
        const currentLane = broadcastLaneMap[b.id] ?? 0;

        setDragging({
            id: b.id,
            broadcast: b,
            type,
            initialCursorTime: cursorTime,
            initialCursorX: mouseX,
            initialCursorY: mouseY,
            originalStart: new Date(b.start_time).getTime(),
            originalEnd: new Date(b.end_time).getTime(),
            newStart: new Date(b.start_time).getTime(),
            newEnd: new Date(b.end_time).getTime(),
            originalLane: currentLane,
            newLane: currentLane,
            hasMoved: false
        });
    }

    function handleBarMouseDown(e, b) {
        handleMouseDown(e, b, 'move');
    }

    function handleResizeMouseDown(e, b, type) {
        handleMouseDown(e, b, type);
    }

    function handleContainerMouseDown(e) {
        // Only trigger if left click and not already dragging (e.g. from a bar)
        if (e.button !== 0 || dragging) return;

        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        // Detect Resize Handle Click
        if (rect.bottom - e.clientY <= 12) {
            setDragging({ type: 'resize-height' });
            return;
        }

        setDragging({
            type: 'pan',
            startX: e.clientX,
            initialViewportStart: viewportStart
        });
    }

    const handleMouseUp = async () => {
        // Fix: If committing, ignore mouse up to prevent potential race conditions
        if (dragging?.isCommitting) return;

        if (dragging) {
            // Click Handler: If not moved, trigger selection
            if (dragging.id && !dragging.hasMoved && (dragging.type === 'move' || dragging.type === 'resize-left' || dragging.type === 'resize-right')) {
                if (onBroadcastClick && dragging.broadcast) {
                    onBroadcastClick(dragging.broadcast);
                }
            }

            if (dragging.hasMoved) {
                lastDragTimeRef.current = Date.now();
            }

            if (onBroadcastUpdate) {
                const timeChanged = dragging.newStart !== dragging.originalStart || dragging.newEnd !== dragging.originalEnd;
                let finalLane = dragging.newLane;
                const laneChanged = finalLane !== undefined && finalLane !== dragging.originalLane;

                // Unified Collision Detection & Snap-back (Move & Resize)
                const targetLaneIndex = finalLane !== undefined ? finalLane : dragging.originalLane;

                // Check collision if time or lane changed
                if (timeChanged || laneChanged) {
                    const isOverlapping = (startA, endA, startB, endB) => {
                        const sA = startA;
                        const eA = (endA === null || endA === undefined || endA > 4102444800000) ? Infinity : endA;
                        const sB = startB;
                        const eB = (endB === null || endB === undefined || endB > 4102444800000) ? Infinity : endB;
                        return Math.max(sA, sB) < Math.min(eA, eB);
                    };

                    const broadcastsInLane = lanes[targetLaneIndex] || [];
                    const hasCollision = broadcastsInLane.some(b => {
                        // Ignore self
                        if (String(b.id) === String(dragging.id)) return false;
                        const bStart = new Date(b.start_time).getTime();
                        const bEnd = b.end_time ? new Date(b.end_time).getTime() : Infinity;

                        // Use dragging state times (populated by move/resize)
                        return isOverlapping(dragging.newStart, dragging.newEnd, bStart, bEnd);
                    });

                    if (hasCollision) {
                        // COLLISION DETECTED: Abort update, snap back to initial position.
                        setDragging(null);
                        return;
                    }
                }

                if (timeChanged || laneChanged) {
                    const updates = {};
                    if (timeChanged) {
                        updates.start_time = new Date(dragging.newStart).toISOString();
                        updates.end_time = new Date(dragging.newEnd).toISOString();
                    }
                    if (laneChanged) {
                        updates.lane = finalLane;
                    }

                    // Await update to prevent rubber-banding on success
                    try {
                        // Flag as committing so mouse moves don't update visual position
                        setDragging(prev => ({ ...prev, isCommitting: true }));
                        await onBroadcastUpdate(dragging.id, updates);
                    } catch (e) {
                        console.error('Drag update failed', e);
                        // If failed, we might want to alert, but snapping back is default on error since proper re-render won't happen.
                    }
                }
            }
        }
        setDragging(null);
    };

    const handleMouseLeave = () => {
        setCrosshairPos({ x: null, y: null });
        setHoveredItem(null);
        setHoveredBarId(null);
        // Don't clear dragging here, users often drag outside briefly. 
        // Only clear drag on explicit mouse up usually, but window mouseup is needed for robustness.
    };

    // Detect edge hover type
    const getEdgeType = (e, barRect) => {
        const edgeThreshold = 8;
        if (e.clientX - barRect.left < edgeThreshold) return 'resize-left';
        if (barRect.right - e.clientX < edgeThreshold) return 'resize-right';
        return 'move';
    };

    // Formatters
    const formatTimePill = (ts) => {
        const d = new Date(ts);
        const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return { t, date };
    };

    // Priority colors
    const getPriorityColor = (p) => {
        const val = p || 3;
        if (val <= 1) return '#ef4444';
        if (val === 2) return '#f97316';
        if (val === 3) return '#eab308';
        if (val === 4) return '#3b82f6';
        return '#22c55e';
    };

    const getPriorityLabel = (p) => {
        const val = p || 3;
        return `P${val}`;
    };

    // Show empty state message if no broadcasts after filtering
    const showEmptyState = broadcasts.length === 0;

    if (!isInitialized) return null;

    return (
        <div
            ref={containerRef}
            style={{
                background: '#334155', // User requested #334155
                border: '1px solid #334155',
                borderRadius: '8px',
                position: 'relative',
                height: `${totalHeight}px`,
                userSelect: 'none',
                cursor: dragging ? 'grabbing' : 'auto',
                overflow: 'hidden' // Prevent edge overload
            }}
            onMouseMove={!dragging ? handleMouseMove : undefined}
            onMouseDown={handleContainerMouseDown}
            // onMouseUp removed: Rely on global listener when dragging


            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleContainerDoubleClick}
        >
            {/* 1. Ruler */}
            <div style={{
                height: rulerHeight,
                background: '#0f172a', // Matches Broadcast Card Background
                borderBottom: '1px solid #334155',
                position: 'relative'
            }}>
                {ticks.map((tick, i) => {
                    const { t, date } = formatTimePill(tick.time);
                    // Show date only if different from previous tick (or first tick)
                    const prevTick = ticks[i - 1];
                    const prevDate = prevTick ? formatTimePill(prevTick.time).date : null;
                    const showDate = i === 0 || date !== prevDate;

                    // Determine style based on tick type
                    let tickColor = '#94a3b8'; // Hour (Brightest)
                    let tickHeight = 8;
                    let labelOpacity = 1;

                    if (tick.type === 'half') {
                        tickColor = '#64748b'; // Half (Mid)
                        tickHeight = 6;
                        labelOpacity = 0.8;
                    } else if (tick.type === 'quarter') {
                        tickColor = '#475569'; // Quarter (Darkest/Faintest)
                        tickHeight = 4;
                        labelOpacity = 0.6;
                    }

                    return (
                        <div key={i} style={{ position: 'absolute', left: `${tick.left}%`, top: 0, height: '100%', pointerEvents: 'none' }}>
                            <div style={{ width: 1, height: tickHeight, background: tickColor, position: 'absolute', bottom: 0 }} />
                            <div style={{
                                position: 'absolute', bottom: 8, left: 0, transform: 'translateX(-50%)',
                                fontSize: '10px', color: tickColor, fontFamily: 'monospace', lineHeight: 1,
                                whiteSpace: 'nowrap', opacity: labelOpacity
                            }}>
                                <span style={{ fontWeight: 600 }}>{t}</span>
                                {showDate && <span style={{ opacity: 0.7, marginLeft: 4 }}>{date}</span>}
                            </div>
                        </div>
                    );
                })}

                {/* Resize Interaction Guide - Timestamp Highlight */}
                {dragging && dragging.type && dragging.type.startsWith('resize') && (
                    <div style={{
                        position: 'absolute',
                        left: `${(((dragging.type === 'resize-left' ? dragging.newStart : dragging.newEnd) - viewportStart) / viewportDuration) * 100}%`,
                        top: 2,
                        transform: 'translateX(-50%)',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        zIndex: 30,
                        whiteSpace: 'nowrap'
                    }}>
                        {formatTimePill(dragging.type === 'resize-left' ? dragging.newStart : dragging.newEnd).t} ({formatTimePill(dragging.type === 'resize-left' ? dragging.newStart : dragging.newEnd).date})
                    </div>
                )}
            </div>

            {/* 2. Body / Bars */}
            <div style={{ position: 'relative', width: '100%', height: `${totalHeight - rulerHeight}px` }}>
                {/* Now Line (Current Time) */}
                {(() => {
                    const now = new Date().getTime();
                    if (now >= viewportStart && now <= viewportStart + viewportDuration) {
                        const left = ((now - viewportStart) / viewportDuration) * 100;
                        return (
                            <div style={{
                                position: 'absolute',
                                left: `${left}%`,
                                top: 0,
                                height: '100%',
                                width: '1px',
                                background: '#ffffff', // User requested white
                                zIndex: 1, // Behind bars (10+)
                                pointerEvents: 'none'
                            }} />
                        );
                    }
                    return null;
                })()}

                {/* Crosshairs */}
                {crosshairPos.x !== null && !hoveredBarId && !dragging && (
                    <>
                        <div style={{ position: 'absolute', left: crosshairPos.x, top: 0, height: '100%', borderLeft: '1px dotted rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', left: 0, top: crosshairPos.y, width: '100%', borderTop: '1px dotted rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    </>
                )}

                {/* Resize/Move Guide Lines (Vertical) */}
                {dragging && dragging.type && (dragging.type === 'move' || dragging.type === 'resize-left' || dragging.type === 'resize-right') && (() => {
                    // FIX: Use newLane if available to tracking visual position during drag
                    const activeLaneIndex = (dragging.newLane !== undefined) ? dragging.newLane : lanes.findIndex(l => l.some(b => b.id === dragging.id));

                    // Clamp lane index to valid range for visual sanity
                    const safeLaneIndex = Math.max(0, Math.min(activeLaneIndex, laneCount - 1));

                    const barTop = safeLaneIndex * (rowHeight + gap) + gap;

                    const leftPct = ((dragging.newStart - viewportStart) / viewportDuration) * 100;
                    const rightPct = ((dragging.newEnd - viewportStart) / viewportDuration) * 100;

                    // Get bar color for the dotted line
                    const color = getPriorityColor(dragging.broadcast.priority);

                    const renderGuide = (leftPos) => (
                        <div style={{
                            position: 'absolute',
                            left: `${leftPos}%`,
                            top: 0, // Bottom of Ruler
                            height: `${barTop}px`, // Down to Bar Top
                            width: 0,
                            borderLeft: `2px dotted ${color}`,
                            zIndex: 25,
                            pointerEvents: 'none'
                        }} />
                    );

                    return (
                        <>
                            {renderGuide(leftPct)}
                            {/* Only show right guide if not infinite or wildly offscreen */}
                            {dragging.newEnd && dragging.newEnd < 4102444800000 && renderGuide(rightPct)}
                        </>
                    );
                })()}

                {/* Bars */}
                {showEmptyState ? (
                    <div style={{
                        position: 'absolute',
                        top: rulerHeight,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            background: '#1e293b',
                            color: '#94a3b8',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.85rem',
                            border: '1px solid #334155'
                        }}>
                            No broadcasts match filters
                        </div>
                    </div>
                ) : lanes.map((lane, laneIndex) => (
                    lane.map(b => {
                        const isDragging = dragging?.id === b.id;

                        // Use dragged values if dragging, else actuals
                        const rawStart = isDragging ? dragging.newStart : new Date(b.start_time).getTime();
                        let rawEnd = isDragging ? dragging.newEnd : (b.end_time ? new Date(b.end_time).getTime() : null);

                        const isInfinite = rawEnd === null || rawEnd > 4102444800000; // Null or > 2099
                        // If infinite and started, make sure it covers the visible area, otherwise just a reasonable chunk
                        if (isInfinite) {
                            rawEnd = Math.max(rawStart + viewportDuration, viewportStart + viewportDuration * 2);
                        }

                        const left = ((rawStart - viewportStart) / viewportDuration) * 100;
                        const widthPct = ((rawEnd - rawStart) / viewportDuration) * 100;

                        // Skip if way off screen (but keep infinite bars starting offscreen-left visible)
                        if (left > 105 || (left + widthPct) < -5) return null;

                        const isSelected = selectedBroadcast?.id === b.id;
                        const isHovered = hoveredBarId === b.id || externalHoverId === b.id;
                        const isInteractionActive = isDragging || isSelected || isHovered;
                        const now = new Date().getTime();
                        // Active = currently happening. Scheduled = future. Past = ended.
                        const isTimeActive = now >= rawStart && (isInfinite || now <= rawEnd);
                        const isScheduled = now < rawStart;
                        const isPast = !isInfinite && now > rawEnd;

                        // Priority Color
                        const color = getPriorityColor(b.priority);

                        // Visual State Logic
                        const isFilled = b.max_views && (b.total_users || 0) >= b.max_views;
                        // Inactive = Past OR Filled, AND Not interacting.
                        const isInactive = (isPast || isFilled) && !isInteractionActive;

                        // Background & Border Setup
                        let bgStyle = color;
                        let borderStyle = isTimeActive ? '1px solid white' : (isScheduled ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)');

                        if (isInfinite) {
                            bgStyle = `linear-gradient(to right, ${color}, ${color}00)`;
                            // Keep default border for infinite or specific logic? 
                            // Usually infinite is active or scheduled.
                        } else if (isInactive) {
                            // Badge Style requested for inactive (Boosted to match Badge vividness against dark bg)
                            bgStyle = `${color}35`; // Was 20
                            borderStyle = `1px solid ${color}80`; // Was 40
                        }

                        // Opacity: Always 1 now, because we control alpha in the color itself for inactive.
                        // (Previously 0.6 for inactive)
                        const opacity = 1;

                        return (
                            <div
                                key={b.id}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleBarMouseDown(e, b, laneIndex);
                                }}
                                onMouseEnter={() => handleBarMouseEnter(b, rawStart, rawEnd)}
                                onMouseLeave={handleBarMouseLeave}
                                style={{
                                    position: 'absolute',
                                    left: `${left}%`,
                                    width: `${widthPct}%`,
                                    height: `${rowHeight}px`,
                                    top: `${((isDragging && dragging.newLane !== undefined) ? dragging.newLane : laneIndex) * (rowHeight + gap) + gap}px`, // Dynamic top for dragging
                                    borderRadius: '2px', // Less rounded as requested
                                    background: bgStyle,
                                    opacity: opacity,
                                    border: borderStyle,
                                    cursor: 'grab',
                                    zIndex: isInteractionActive ? 20 : 10,
                                    boxShadow: isTimeActive
                                        ? (isInteractionActive ? `0 0 20px ${color}, 0 0 8px white` : `0 0 10px ${color}60`)
                                        : (isInteractionActive ? `0 0 15px ${color}80, 0 0 5px white` : (isInactive ? 'none' : '0 2px 4px rgba(0,0,0,0.3)')), // Remove shadow if inactive unless hovered? "Hover: Ensure glow effect on all states" -> Hover isInteractionActive=true.
                                    filter: isInteractionActive
                                        ? (isTimeActive ? 'brightness(1.5) saturate(1.2)' : 'brightness(1.2) saturate(1.1)')
                                        : (isInactive ? 'none' : 'brightness(1.1)'), // Remove grayscale for inactive, just pure badge style
                                    transition: isDragging ? 'none' : 'all 0.2s',
                                    pointerEvents: 'auto',
                                    // Mask infinite bars so their glow doesn't fill the whole lane
                                    WebkitMaskImage: isInfinite ? 'linear-gradient(to right, black 0%, black 150px, rgba(0,0,0,0.5) 300px, transparent 600px)' : 'none',
                                    maskImage: isInfinite ? 'linear-gradient(to right, black 0%, black 150px, rgba(0,0,0,0.5) 300px, transparent 600px)' : 'none'
                                }}
                            >
                                {/* Left Handle */}
                                <div
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleResizeMouseDown(e, b, 'resize-left');
                                    }}
                                    style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '10px',
                                        cursor: 'ew-resize', zIndex: 30
                                    }}
                                />

                                {/* Right Handle - Only if NOT infinite */}
                                {!isInfinite && (
                                    <div
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleResizeMouseDown(e, b, 'resize-right');
                                        }}
                                        style={{
                                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '10px',
                                            cursor: 'ew-resize', zIndex: 30
                                        }}
                                    />
                                )}

                                {/* label removed as requested */}
                            </div>
                        );
                    })
                ))}
            </div>

            {/* Dynamic Tooltip */}
            {hoveredItem && !dragging && ReactDOM.createPortal(
                (() => {
                    // Logic for badges
                    const now = new Date().getTime();
                    const s = hoveredItem.currentStart;
                    const e = hoveredItem.currentEnd;
                    const isActive = now >= s && now <= e;
                    const isEnded = now > e;

                    const isFilled = hoveredItem.max_views && (hoveredItem.total_users || 0) >= hoveredItem.max_views;

                    let statusText = isActive ? (isFilled ? 'Filled' : 'Active') : (isEnded ? 'Ended' : 'Scheduled');
                    let statusColor = isActive ? (isFilled ? '#ec4899' : '#22c55e') : (isEnded ? '#94a3b8' : '#3b82f6');
                    let priorityColor = getPriorityColor(hoveredItem.priority);

                    // Badge transparencies
                    const badgeBg = (color) => `${color}20`; // 12% opacity roughly? 20 hex = 32/255 = ~12%
                    const badgeBorder = (color) => `${color}40`;

                    // Dynamic Vertical Positioning
                    // If cursor is in the bottom half of the screen, show tooltip ABOVE the cursor.
                    const isLowerHalf = tooltipPos.y > window.innerHeight / 2;
                    const topStyle = isLowerHalf ? undefined : tooltipPos.y + 15;
                    const bottomStyle = isLowerHalf ? (window.innerHeight - tooltipPos.y + 15) : undefined;

                    return (
                        <div style={{
                            position: 'fixed',
                            top: topStyle,
                            bottom: bottomStyle,
                            left: tooltipPos.x + 15,
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '12px',
                            zIndex: 9999,
                            pointerEvents: 'none', // Important so mouse doesn't get stuck on tooltip
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            minWidth: '240px'
                        }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                                {hoveredItem.title || 'Untitled'}
                            </div>



                            {/* Image Preview */}
                            {hoveredItem.image_url && (
                                <div style={{
                                    width: '100%',
                                    // Height adjusts to content but with max limit to prevent huge popups
                                    maxHeight: '200px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    background: '#0f172a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    // marginBottom removed to balance spacing
                                }}>
                                    <img
                                        src={hoveredItem.image_url}
                                        alt="Broadcast"
                                        style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'contain' }}
                                    />
                                </div>
                            )}

                            {/* Status & Max Views Badge Row - Moved to Bottom */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{
                                    padding: '2px 6px', borderRadius: '4px',
                                    fontSize: '0.7rem', fontWeight: 700,
                                    background: badgeBg(statusColor), color: statusColor,
                                    border: `1px solid ${badgeBorder(statusColor)}`,
                                    textTransform: 'uppercase'
                                }}>
                                    {statusText}
                                </span>
                                {hoveredItem.max_views && (
                                    <span style={{
                                        padding: '2px 6px', borderRadius: '4px',
                                        fontSize: '0.7rem', fontWeight: 600,
                                        background: isFilled ? '#ec489920' : 'rgba(6, 182, 212, 0.1)',
                                        color: isFilled ? '#ec4899' : '#06b6d4',
                                        border: isFilled ? '1px solid #ec489940' : '1px solid rgba(6, 182, 212, 0.3)',
                                    }}>
                                        👁 {hoveredItem.total_users || 0} / {hoveredItem.max_views}
                                    </span>
                                )}
                            </div>

                            {/* Professional Time Display */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'min-content auto',
                                gap: '4px 12px',
                                fontSize: '0.8rem',
                                color: '#cbd5e1',
                                background: '#1e293b',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                position: 'relative',
                                marginTop: '6px' // Reduced from 12px to balance with top gap
                            }}>
                                {/* Clock Icon */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '50%',
                                    width: '20px', height: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px'
                                }}>
                                    🕒
                                </div>

                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Start:</span>
                                <span style={{ fontFamily: 'monospace' }}>
                                    {formatDateTimeCET(new Date(s).toISOString())}
                                </span>

                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>End:</span>
                                <span style={{ fontFamily: 'monospace' }}>
                                    {formatDateTimeCET(new Date(e).toISOString())}
                                </span>
                            </div>

                            {/* Footer Line: Badges (Left) & Stats (Right) */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '1rem' }}>

                                {/* Badges (Left) - Order: Status, Priority, MaxViews */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                                    {/* Status Badge */}
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        background: badgeBg(statusColor),
                                        color: statusColor,
                                        border: `1px solid ${badgeBorder(statusColor)}`,
                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        {statusText}
                                    </span>

                                    {/* Priority Badge */}
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        background: badgeBg(priorityColor), color: priorityColor,
                                        border: `1px solid ${badgeBorder(priorityColor)}`
                                    }}>
                                        P{hoveredItem.priority || 3}
                                    </span>

                                    {/* Max Views Badge */}
                                    {hoveredItem.max_views ? (
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                                            fontSize: '0.7rem', fontWeight: 700,
                                            background: (hoveredItem.total_users || 0) >= hoveredItem.max_views ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                                            color: (hoveredItem.total_users || 0) >= hoveredItem.max_views ? '#ef4444' : '#06b6d4',
                                            border: (hoveredItem.total_users || 0) >= hoveredItem.max_views ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)'
                                        }}>
                                            👁 {hoveredItem.total_users || 0} / {hoveredItem.max_views}
                                        </span>
                                    ) : (
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '4px',
                                            fontSize: '0.7rem', fontWeight: 700,
                                            background: 'rgba(6, 182, 212, 0.1)',
                                            color: '#06b6d4',
                                            border: '1px solid rgba(6, 182, 212, 0.3)'
                                        }}>
                                            👁 ∞
                                        </span>
                                    )}
                                </div>

                                {/* Delivery Stats (Right) */}
                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', paddingLeft: '12px', borderLeft: '1px solid #334155' }}>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ {Math.max(0, (hoveredItem.delivered_count || 0) - (hoveredItem.read_count || 0))}</span>
                                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>✓✓ {hoveredItem.read_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}
            {/* 3. Resize Handle (Bottom) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '12px',
                    cursor: 'ns-resize',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0, // Hidden until hover
                    transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
                {/* Visual Handle Line */}
                <div style={{ width: '40px', height: '4px', background: '#94a3b8', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }}></div>
            </div>
        </div >
    );
};

