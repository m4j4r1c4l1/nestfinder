import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode';
import { adminApi } from '../api';

const APP_URL = 'https://m4j4r1c4l1.github.io/nestfinder/';
const API_URL = import.meta.env.VITE_API_URL || '';

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
        body: ''
    },
    urgent: {
        id: 'urgent',
        name: '🚨 Urgent Notice',
        title: '🚨 Urgent Notice',
        body: ''
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
    weather_alert: {
        id: 'weather_alert',
        name: '⛈️ Weather Alert',
        title: '⛈️ Weather Alert',
        body: 'Severe weather conditions reported. Please stay safe and seek shelter if necessary.'
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

const Messages = () => {
    const [activeTab, setActiveTab] = useState('composer');
    const [loading, setLoading] = useState(true);

    // Data State
    const [broadcasts, setBroadcasts] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({ totalSubscribers: 0 });

    // Broadcast form
    const [newBroadcast, setNewBroadcast] = useState({
        message: '',
        imageUrl: '',
        startTime: '',
        endTime: ''
    });
    const [showBroadcastEmojiPicker, setShowBroadcastEmojiPicker] = useState(false);
    const [creatingBroadcast, setCreatingBroadcast] = useState(false);

    useEffect(() => {
        fetchData();
        // Set up interval for refreshing data
        // Set up interval for refreshing data (10s to match Notifications)
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        // No explicit setLoading(true) here to prevent flickering on intervals
        // Initial load is handled by default state = true

        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const [broadcastRes, feedbackRes, statsRes] = await Promise.all([
                adminApi.fetch('/admin/broadcasts'),
                adminApi.fetch('/admin/feedback'),
                fetch(`${API_URL}/api/push/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.ok ? res.json() : { subscribers: [], totalSubscribers: 0 })
            ]);

            setBroadcasts(broadcastRes.broadcasts || []);
            setFeedback(feedbackRes.feedback || []);
            setSubscribers(statsRes.subscribers || []);
            setStats(statsRes);
        } catch (err) {
            console.error('Failed to fetch messages data:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Broadcast Handlers ---
    const handleCreateBroadcast = async (e) => {
        e.preventDefault();
        if (!newBroadcast.message || !newBroadcast.startTime || !newBroadcast.endTime) return;

        setCreatingBroadcast(true);
        try {
            await adminApi.fetch('/admin/broadcasts', {
                method: 'POST',
                body: JSON.stringify(newBroadcast)
            });
            setNewBroadcast({ message: '', imageUrl: '', startTime: '', endTime: '' });
            fetchData();
        } catch (err) {
            console.error('Failed to create broadcast:', err);
        }
        setCreatingBroadcast(false);
    };

    const handleDeleteBroadcast = async (id) => {
        if (!confirm('Delete this broadcast?')) return;
        try {
            await adminApi.fetch(`/admin/broadcasts/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            console.error('Failed to delete broadcast:', err);
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
        { id: 'composer', label: '🖊️ Composer', count: 0 },
        { id: 'outbox', label: '📤 Sent', count: 0 },
        { id: 'feedback', label: '📥 Received', count: feedback.filter(f => f.status === 'new').length },
        { id: 'broadcasts', label: '📢 Broadcasts', count: broadcasts.length }
    ];

    return (
        <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Messages
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Manage communications, broadcasts, and user feedback
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
                    Loading messaging data...
                </div>
            ) : (
                <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>

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
                        <div>
                            <HistorySection users={subscribers} />
                        </div>
                    )}

                    {/* RECEIVED (FEEDBACK) TAB */}
                    {activeTab === 'feedback' && (
                        <div style={{ width: '100%' }}>
                            <FeedbackSection
                                feedback={feedback}
                                onUpdate={fetchData}
                                onUpdateStatus={handleUpdateFeedbackStatus}
                                onDelete={handleDeleteFeedback}
                            />
                        </div>
                    )}

                    {/* BROADCASTS TAB */}
                    {activeTab === 'broadcasts' && (
                        <div style={{ width: '100%' }}>
                            {/* Create New Broadcast */}
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <div className="card-header">
                                    <h3>Create Broadcast</h3>
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
                                                            border: '1px solid #334155',
                                                            borderRadius: '8px',
                                                            background: '#0f172a',
                                                            color: '#94a3b8',
                                                            cursor: 'pointer',
                                                            fontWeight: 400,
                                                            fontSize: '0.85rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            textAlign: 'center'
                                                        }}
                                                        title={tmpl.name}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = '#1e293b'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = '#0f172a'; }}
                                                    >
                                                        {tmpl.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Image URL (Optional)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={newBroadcast.imageUrl}
                                                    onChange={(e) => setNewBroadcast({ ...newBroadcast, imageUrl: e.target.value })}
                                                    placeholder="https://..."
                                                    style={{ flex: 1 }}
                                                />
                                                <label className="btn btn-secondary" style={{
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    width: '42px',
                                                    minWidth: '42px',
                                                    height: 'auto',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '8px',
                                                    alignSelf: 'stretch'
                                                }}>
                                                    📂
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => setNewBroadcast({ ...newBroadcast, imageUrl: reader.result });
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            {newBroadcast.imageUrl && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <img src={newBroadcast.imageUrl} alt="Preview" style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Message</label>
                                            <textarea
                                                value={newBroadcast.message}
                                                onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                                                placeholder="Enter broadcast message (visible to all users active in the app)..."
                                                className="form-input"
                                                style={{ minHeight: '100px', width: '100%', resize: 'vertical' }}
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
                                                    title="Add Emoji"
                                                >
                                                    😀
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label className="form-label">Start Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newBroadcast.startTime}
                                                    onChange={(e) => setNewBroadcast({ ...newBroadcast, startTime: e.target.value })}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label className="form-label">End Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newBroadcast.endTime}
                                                    onChange={(e) => setNewBroadcast({ ...newBroadcast, endTime: e.target.value })}
                                                    className="form-input"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={creatingBroadcast || !newBroadcast.message}
                                            className="btn btn-primary btn-block"
                                        >
                                            {creatingBroadcast ? 'Creating...' : '📢 Publish Broadcast'}
                                        </button>
                                    </form>
                                    {showBroadcastEmojiPicker && (
                                        <EmojiPickerModal
                                            onSelect={(emoji) => { setNewBroadcast(prev => ({ ...prev, message: prev.message + emoji })); setShowBroadcastEmojiPicker(false); }}
                                            onClose={() => setShowBroadcastEmojiPicker(false)}
                                        />
                                    )}
                                </div>
                            </div>


                            {/* Existing Broadcasts List */}
                            <div className="card">
                                <div className="card-header">
                                    <h3>Manage Broadcasts</h3>
                                </div>
                                <div className="card-body">
                                    {broadcasts.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                            No broadcasts found
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {broadcasts.map(b => {
                                                const now = new Date();
                                                const start = new Date(b.start_time);
                                                const end = new Date(b.end_time);
                                                const isActive = now >= start && now <= end;
                                                const isPast = now > end;

                                                return (
                                                    <div
                                                        key={b.id}
                                                        className="card"
                                                        style={{
                                                            borderLeft: isActive ? '4px solid var(--color-confirmed)' : '1px solid var(--color-border)',
                                                            opacity: isPast ? 0.7 : 1
                                                        }}
                                                    >
                                                        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>{b.message}</div>
                                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                                    <span>📅 {new Date(b.start_time).toLocaleString()}</span>
                                                                    <span>→</span>
                                                                    <span>→</span>
                                                                    <span>{new Date(b.end_time).toLocaleString()}</span>
                                                                </div>
                                                                {b.image_url && (
                                                                    <div style={{ marginTop: '0.75rem' }}>
                                                                        <img src={b.image_url} alt="Broadcast" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                                                                    </div>
                                                                )}
                                                                <div style={{ marginTop: '0.75rem' }}>
                                                                    <span style={{
                                                                        padding: '0.25rem 0.75rem',
                                                                        borderRadius: '20px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        background: isActive ? 'var(--color-confirmed)' : isPast ? 'var(--color-text-muted)' : 'var(--color-pending)',
                                                                        color: 'white'
                                                                    }}>
                                                                        {isActive ? '🟢 ACTIVE' : isPast ? '⚫ ENDED' : '🟡 SCHEDULED'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteBroadcast(b.id)}
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ color: 'var(--color-deactivated)', borderColor: 'var(--color-deactivated)' }}
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
};

// --- Sub-components ---

const ComposeSection = ({ subscribers, totalSubscribers, onSent }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('announcement');
    const [title, setTitle] = useState(templates.announcement.title);
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [target, setTarget] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showComposeEmojiPicker, setShowComposeEmojiPicker] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
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

    const handleBroadcastTemplateChange = (templateId) => {
        const tmpl = templates[templateId];
        setNewBroadcast(prev => ({
            ...prev,
            message: tmpl.body || '',
            imageUrl: tmpl.id === 'happy_new_year' ? `${APP_URL}/images/new_year_2026.png` : ''
        }));
    };

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
            setImageUrl(`${APP_URL}/images/new_year_2026.png`);
        }
    };

    const toggleUser = (userId) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSend = async () => {
        if (!body.trim()) return setResult({ success: false, message: 'Message body is required' });
        if (target === 'selected' && selectedUsers.length === 0) return setResult({ success: false, message: 'Select at least one user' });

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
                    userIds: target === 'all' ? [] : selectedUsers
                })
            });
            const data = await response.json();
            if (response.ok) {
                setResult({ success: true, message: `✅ Sent to ${data.sent} users` });
                setBody('');
                setImageUrl('');
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
        <div className="card" style={{ marginBottom: '1.5rem', maxHeight: 'none', overflow: 'visible' }}>
            <div className="card-header"><h3>✉️ Create Broadcasts</h3></div>
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

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Title</label>
                    <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Image</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                        <input type="text" className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." style={{ flex: 1 }} />
                        <label className="btn btn-secondary" style={{
                            cursor: 'pointer',
                            padding: 0,
                            width: '42px',
                            minWidth: '42px',
                            height: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            alignSelf: 'stretch'
                        }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📂</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem', position: 'relative' }}>
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


                <div className="form-group" style={{ marginTop: '0.5rem' }}>
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

const FeedbackSection = ({ feedback, onUpdate, onUpdateStatus, onDelete }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [previewItem, setPreviewItem] = useState(null);
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

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
        setConfirmAction(() => handleBulkMarkRead);
        setShowConfirmModal(true);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} items? This cannot be undone.`)) return;
        for (const id of selectedIds) {
            await onDelete(id);
        }
        setSelectedIds([]);
        onUpdate && onUpdate();
    };

    // Handle row click: open preview AND mark as read if new
    const handleRowClick = async (item) => {
        setPreviewItem(item);
        if (item.status === 'new') {
            await onUpdateStatus(item.id, 'reviewed');
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
    const sortedFeedback = [...feedback].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'created_at') {
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
        } else if (sortColumn === 'user_nickname') {
            aVal = (a.user_nickname || 'Anonymous').toLowerCase();
            bVal = (b.user_nickname || 'Anonymous').toLowerCase();
        } else if (sortColumn === 'type') {
            aVal = a.type.toLowerCase();
            bVal = b.type.toLowerCase();
        } else {
            return 0;
        }
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📥 Received Messages</h3>
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
                    <button onClick={onUpdate} className="btn btn-secondary btn-sm" style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 0.8rem' }}>🔄 Refresh</button>
                </div>
            </div>
            {showConfirmModal && (
                <ConfirmationModal
                    title="Confirm Action"
                    message={`Are you sure you want to mark ${selectedIds.length} items as read?`}
                    onConfirm={() => {
                        confirmAction && confirmAction();
                        setShowConfirmModal(false);
                    }}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
            <div className="card-body" style={{ padding: 0 }}>
                <div style={{ height: '65vh', overflowY: 'auto', background: '#1e293b', borderRadius: '0 0 8px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '0.75rem 1rem', width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={feedback.length > 0 && selectedIds.length === feedback.length}
                                        onChange={() => setSelectedIds(selectedIds.length === feedback.length ? [] : feedback.map(f => f.id))}
                                    />
                                </th>
                                <th
                                    onClick={() => { setSortColumn('created_at'); setSortDirection(d => sortColumn === 'created_at' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: '130px' }}
                                >
                                    Timestamp {sortColumn === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th style={{ padding: '0.75rem 1rem', width: '100px', textAlign: 'center' }}>Status</th>
                                <th
                                    onClick={() => { setSortColumn('user_nickname'); setSortDirection(d => sortColumn === 'user_nickname' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none', maxWidth: '150px' }}
                                >
                                    From {sortColumn === 'user_nickname' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th
                                    onClick={() => { setSortColumn('type'); setSortDirection(d => sortColumn === 'type' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', width: '50px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    Type {sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>

                                <th style={{ padding: '0.75rem 1rem', width: '45%', textAlign: 'left' }}>Message</th>
                                <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFeedback.map(item => (
                                <tr
                                    key={item.id}
                                    style={{
                                        borderBottom: '1px solid #334155',
                                        background: selectedIds.includes(item.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onClick={() => setPreviewItem(item)}
                                >
                                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                        {item.status === 'new' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <span style={{ color: '#22c55e', fontSize: '1rem' }}>✓✓</span>
                                                <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>Pending</span>
                                            </span>
                                        ) : item.status === 'reviewed' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <span style={{ color: '#3b82f6', fontSize: '1rem' }}>✓✓</span>
                                                <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>Read</span>
                                            </span>
                                        ) : (
                                            <span style={{ color: '#8b5cf6', fontWeight: 500, fontSize: '0.8rem' }}>Resolved</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', color: '#e2e8f0', fontWeight: 500, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.user_nickname || 'Anonymous'}
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.user_id ? item.user_id.substr(0, 8) + '...' : ''}</div>
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                                            {item.type === 'bug' ? '🐛' : item.type === 'suggestion' ? '💡' : '📝'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                        <div style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.message}
                                        </div>
                                    </td>

                                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: '1.2rem', opacity: 0.6, transition: 'opacity 0.2s', padding: '4px'
                                            }}
                                            onMouseEnter={e => e.target.style.opacity = 1}
                                            onMouseLeave={e => e.target.style.opacity = 0.6}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
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
        </div>
    );
};

const HistorySection = ({ users = [] }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [previewMessage, setPreviewMessage] = useState(null);
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => {
        loadHistory();
        const interval = setInterval(loadHistory, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/push/admin/notifications/history`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handlePreview = (log) => {
        const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata || '{}') : (log.metadata || {});
        let safeIso = log.created_at;
        if (typeof safeIso === 'string' && !safeIso.endsWith('Z') && !safeIso.includes('+') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(safeIso)) { safeIso += 'Z'; }
        if (typeof safeIso === 'string' && safeIso.includes('T') && !safeIso.endsWith('Z') && !safeIso.includes('+')) { safeIso += 'Z'; }
        const date = new Date(safeIso);

        const rawId = log.target_id;
        let foundUser = users.find(u => u.id === rawId);
        if (!foundUser && rawId && !rawId.startsWith('user_')) {
            foundUser = users.find(u => u.id === `user_${rawId}`);
        }
        const resolvedNickname = foundUser ? foundUser.nickname : (log.target_id || 'User');

        setPreviewMessage({ ...meta, timestamp: date, target_id: log.target_id, nickname: resolvedNickname });
    };

    const sortedLogs = [...logs].sort((a, b) => {
        const parseMeta = (item) => typeof item.metadata === 'string' ? JSON.parse(item.metadata || '{}') : (item.metadata || {});

        let valA, valB;
        if (sortColumn === 'created_at') {
            valA = new Date(a.created_at).getTime();
            valB = new Date(b.created_at).getTime();
        } else if (sortColumn === 'title') {
            const metaA = parseMeta(a);
            const metaB = parseMeta(b);
            valA = (metaA.title || '').toLowerCase();
            valB = (metaB.title || '').toLowerCase();
        } else if (sortColumn === 'body') {
            const metaA = parseMeta(a);
            const metaB = parseMeta(b);
            valA = (metaA.body || '').toLowerCase();
            valB = (metaB.body || '').toLowerCase();
        } else if (sortColumn === 'image') {
            const metaA = parseMeta(a);
            const metaB = parseMeta(b);
            valA = metaA.image ? 1 : 0;
            valB = metaB.image ? 1 : 0;
        } else if (sortColumn === 'target') {
            const metaA = parseMeta(a);
            const metaB = parseMeta(b);
            valA = metaA.count || 0;
            valB = metaB.count || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (column) => {
        setSortDirection(current => sortColumn === column && current === 'asc' ? 'desc' : 'asc');
        setSortColumn(column);
    };

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📜 Sent History</h3>
                <div>
                    <button
                        onClick={async () => {
                            if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL Sent History?\nThis will remove all records of sent notifications from this list.')) return;
                            try {
                                const token = localStorage.getItem('nestfinder_admin_token');
                                const res = await fetch(`${API_URL}/api/push/admin/notifications/cleanup`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert(data.message);
                                    loadHistory();
                                }
                            } catch (err) { alert('Cleanup failed: ' + err.message); }
                        }}
                        className="btn btn-sm btn-danger"
                        style={{ marginRight: '0.5rem', background: '#ef4444', color: 'white' }}
                        title="Delete all sent history logs"
                    >
                        🗑️ Clear History
                    </button>
                    <button onClick={loadHistory} className="btn btn-secondary">🔄 Refresh</button>
                </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                <div style={{ height: '65vh', overflowY: 'auto', background: '#1e293b', borderRadius: '0 0 8px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                <th onClick={() => handleSort('created_at')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                    Timestamp {sortColumn === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('title')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                    Title {sortColumn === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('body')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                    Body {sortColumn === 'body' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('image')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                    Image {sortColumn === 'image' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('target')} style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                    Target {sortColumn === 'target' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLogs.map(log => {
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
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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
                                                {meta.body ? (meta.body.length > 55 ? meta.body.substring(0, 55) + '...' : meta.body) : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>-</span>}
                                            </div>
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
                    {logs.length === 0 && !loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No history found</div>}
                </div>
            </div>

            {selectedBatchId && (
                <DetailModal batchId={selectedBatchId} onClose={() => setSelectedBatchId(null)} />
            )}

            {previewMessage && (
                <MessagePreviewModal message={previewMessage} onClose={() => setPreviewMessage(null)} />
            )}
        </div>
    );
};



const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
            <div style={{
                background: '#1e293b', borderRadius: '12px', padding: '1.5rem',
                width: 'min(400px, 90vw)', border: '1px solid #334155',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#f1f5f9', fontSize: '1.2rem' }}>{title}</h3>
                <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button onClick={onCancel} style={{
                        padding: '0.5rem 1rem', background: 'transparent', color: '#cbd5e1',
                        border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer'
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: '0.5rem 1rem', background: '#3b82f6', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                    }}>Confirm</button>
                </div>
            </div>
        </div>,
        document.body
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
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color }}>{date.toLocaleDateString()}</span>
                {/* Restored seconds */}
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.messages.map(msg => (
                                        <tr key={msg.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                                <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{msg.nickname || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{msg.device_id?.substr(0, 8)}...</div>
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <DateTimeCell isoString={msg.created_at} />
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <DateTimeCell isoString={msg.delivered_at} />
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <DateTimeCell isoString={msg.read_at} />
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ width: '40px', fontSize: '1.2rem', lineHeight: 1, display: 'flex', justifyContent: 'center', marginRight: '8px' }}>
                                                        {msg.read ? (
                                                            <span style={{ color: '#3b82f6', transform: 'translateX(-2px)' }}>✓✓</span>
                                                        ) : msg.delivered ? (
                                                            <span style={{ color: '#22c55e', transform: 'translateX(-2px)' }}>✓✓</span>
                                                        ) : (
                                                            <span style={{ color: '#22c55e', transform: 'translateX(-2px)' }}>✓</span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}>
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
    const isFeedback = message.hasOwnProperty('user_nickname') || message.hasOwnProperty('type');
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
        headerTitle = message.user_nickname || 'Anonymous';
        headerIcon = <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>{typeIcon}</span>;
    } else {
        // Notification Header: Recipient or Bulk
        // Fallback to target_id if nickname is missing
        // Logic fix: Only show "Bulk" if count > 1 or target is clearly 'all'.
        // Do NOT assume target_id format defines bulk/single status (e.g. 'Ioscompose' is a valid single user ID).
        const isBulk = (message.count > 1) || message.target === 'all';
        headerTitle = isBulk ? 'Bulk Message' : (message.nickname || message.target_id || message.device_id?.substr(0, 8) || 'User');
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
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0' }}>{headerTitle}</h3>
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
                            {message.message || message.body}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Messages;
