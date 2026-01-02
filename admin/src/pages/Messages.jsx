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
    const [creatingBroadcast, setCreatingBroadcast] = useState(false);

    useEffect(() => {
        fetchData();
        // Set up interval for refreshing data
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        // Only show loading on initial load or if explicitly requested and no data
        if (loading && broadcasts.length === 0) setLoading(true);

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
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '1rem',
                overflowX: 'auto'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 1.25rem',
                            background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                            border: activeTab === tab.id ? 'none' : '1px solid transparent',
                            borderRadius: 'var(--radius-full)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={e => {
                            if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                        }}
                        onMouseLeave={e => {
                            if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span style={{
                                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
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
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                            <HistorySection />
                        </div>
                    )}

                    {/* RECEIVED (FEEDBACK) TAB */}
                    {activeTab === 'feedback' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            {feedback.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                    No feedback received yet
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {feedback.map(f => (
                                        <div
                                            key={f.id}
                                            className="card"
                                            style={{
                                                borderLeft: f.status === 'new' ? '4px solid var(--color-primary)' : '1px solid var(--color-border)'
                                            }}
                                        >
                                            <div className="card-body">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.25rem' }}>
                                                            {f.type === 'bug' ? '🐛' : f.type === 'suggestion' ? '💡' : '📝'}
                                                        </span>
                                                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{f.type}</span>
                                                        {f.user_nickname && (
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                                                                from <strong>{f.user_nickname}</strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                        {new Date(f.created_at).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '1.05rem' }}>
                                                    {f.message}
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                                    <select
                                                        value={f.status}
                                                        onChange={(e) => handleUpdateFeedbackStatus(f.id, e.target.value)}
                                                        className="form-input"
                                                        style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem' }}
                                                    >
                                                        <option value="new">🆕 New</option>
                                                        <option value="reviewed">👀 Reviewed</option>
                                                        <option value="resolved">✅ Resolved</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeleteFeedback(f.id)}
                                                        className="btn btn-secondary btn-sm"
                                                        title="Delete Feedback"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* BROADCASTS TAB */}
                    {activeTab === 'broadcasts' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            {/* Create New Broadcast */}
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <div className="card-header">
                                    <h3>Create Broadcast</h3>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleCreateBroadcast}>
                                        <textarea
                                            value={newBroadcast.message}
                                            onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                                            placeholder="Enter broadcast message (visible to all users active in the app)..."
                                            className="form-input"
                                            style={{ minHeight: '100px', marginBottom: '1rem', resize: 'vertical' }}
                                        />
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="form-label">Image URL (Optional)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={newBroadcast.imageUrl}
                                                    onChange={(e) => setNewBroadcast({ ...newBroadcast, imageUrl: e.target.value })}
                                                    placeholder="https://..."
                                                    style={{ flex: 1 }}
                                                />
                                                <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.4rem 1.0rem' }}>
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
                                </div>
                            </div>

                            {/* Existing Broadcasts List */}
                            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Active & Scheduled</h3>
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

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
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><h3>✉️ Compose Notification</h3></div>
            <div className="card-body">
                <div className="form-group">
                    <label className="form-label">Template</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0.5rem', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                        {Object.values(templates).map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => handleTemplateChange(tmpl.id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: selectedTemplate === tmpl.id ? '2px solid #3b82f6' : '1px solid #ddd',
                                    borderRadius: '20px',
                                    background: selectedTemplate === tmpl.id ? '#dbeafe' : 'white',
                                    color: '#1e293b',
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                    fontWeight: selectedTemplate === tmpl.id ? 600 : 400
                                }}
                            >
                                {tmpl.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Title</label>
                    <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Image</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." style={{ flex: 1 }} />
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.4rem 1.5rem' }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📂</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Message</label>
                        <button
                            onClick={() => setShowEmojiPicker(true)}
                            type="button"
                            className="btn btn-secondary"
                            style={{
                                border: '1px solid #cbd5e1', borderRadius: '50%', width: '2rem', height: '2rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem',
                                transition: 'all 0.2s', padding: 0
                            }}
                            title="Insert Emoji"
                        >
                            😊
                        </button>
                    </div>
                    <textarea className="form-input" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
                </div>
                {showEmojiPicker && (
                    <EmojiPickerModal
                        onSelect={(emoji) => { setBody(prev => prev + emoji); setShowEmojiPicker(false); }}
                        onClose={() => setShowEmojiPicker(false)}
                    />
                )}

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Target</label>
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
                        <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }}>
                            <input type="text" className="form-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {filteredSubscribers.map(sub => (
                                    <label key={sub.user_id} style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem' }}>
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

const HistorySection = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [previewMessage, setPreviewMessage] = useState(null);

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
                <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#1e293b', borderRadius: '0 0 8px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Timestamp</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Title</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Body</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Image</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => {
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
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{date.toLocaleDateString()}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td
                                            style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', cursor: 'pointer' }}
                                            onClick={() => setPreviewMessage({ ...meta, timestamp: date })}
                                        >
                                            <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{meta.title}</div>
                                        </td>
                                        <td
                                            style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', cursor: 'pointer' }}
                                            onClick={() => setPreviewMessage({ ...meta, timestamp: date })}
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

const EmojiPickerModal = ({ onSelect, onClose }) => {
    const emojis = [
        '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
        '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
        '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
        '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇',
        '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
        '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🧱', '🪵', '🛖', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨',
        '🪹', '🪺', '🐦', '🐣', '🐤', '🐥', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛',
        '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵',
        '🔥', '💧', '✨', '🌟', '💫', '⭐', '☀️', '⛅', '☁️', '⚡', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
        '🎉', '🎊', '🎈', '🎂', '🎁', '🕯️', '🧶', '🧵', '🪢', '🐾', '💾', '📥', '🚶', '🏃', '🧍', '🧎'
    ];

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000
        }} onClick={onClose}>
            <div style={{
                background: '#1e293b',
                borderRadius: '12px',
                padding: '1rem',
                width: 'min(500px, 95vw)',
                maxHeight: '60vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                border: '1px solid #334155'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', flexDirection: 'row-reverse', marginBottom: '0.5rem' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>&times;</button>
                </div>
                <div style={{
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.5rem', overflowY: 'auto',
                    scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b'
                }}>
                    {emojis.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => onSelect(emoji)}
                            style={{
                                background: 'none', border: 'none',
                                fontSize: '1.5rem', cursor: 'pointer', padding: '4px',
                                transition: 'transform 0.1s'
                            }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        >
                            {emoji}
                        </button>
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
    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: '400px',
                    background: '#1e293b', // Dark background
                    borderRadius: '12px',
                    padding: '0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    border: '1px solid #334155'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0' }}>Message Preview</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                </div>

                {/* Body / Notification Item Replica */}
                <div style={{ padding: '1.5rem', background: '#1e293b' }}>
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid #334155',
                        background: '#334155', // Unread bg color approximation
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6', // Primary color
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🔔</span>
                            <span style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '1rem' }}>{message.title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {message.timestamp ? message.timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                        </div>
                        {message.image && (
                            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src={message.image} alt="Notification attachment" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                            {message.body}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Preview of how the user sees this message
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Messages;
