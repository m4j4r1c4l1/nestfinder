import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Notification templates
const templates = {
    new_points: {
        id: 'new_points',
        name: '🐦 New Locations',
        title: '🐦 New Locations Reported',
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
    custom: {
        id: 'custom',
        name: '✏️ Custom Message',
        title: '',
        body: ''
    }
};

const Notifications = () => {
    const [selectedTemplate, setSelectedTemplate] = useState('announcement');
    const [title, setTitle] = useState(templates.announcement.title);
    const [body, setBody] = useState('');
    const [target, setTarget] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({ totalSubscribers: 0 });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    // Load subscriber stats
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch(`${API_URL}/api/push/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
                setSubscribers(data.subscribers || []);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle template selection
    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId);
        const tmpl = templates[templateId];
        setTitle(tmpl.title);
        if (tmpl.body) {
            setBody(tmpl.body);
        }
    };

    // Toggle user selection
    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Send notification
    const handleSend = async () => {
        if (!body.trim()) {
            setResult({ success: false, message: 'Message body is required' });
            return;
        }

        if (target === 'selected' && selectedUsers.length === 0) {
            setResult({ success: false, message: 'Please select at least one user' });
            return;
        }

        try {
            setSending(true);
            setResult(null);

            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch(`${API_URL}/api/push/admin/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    template: selectedTemplate,
                    title,
                    body,
                    target,
                    userIds: target === 'all' ? [] : selectedUsers
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: `✅ Sent to ${data.sent} subscriber(s)${data.failed > 0 ? ` (${data.failed} failed)` : ''}`
                });
                // Reset form
                setBody('');
            } else {
                setResult({ success: false, message: data.error || 'Failed to send' });
            }
        } catch (err) {
            setResult({ success: false, message: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="notifications-page">
            <div className="page-header">
                <h1>📢 Push Notifications</h1>
                <p className="text-muted">Send notifications to app users</p>
            </div>

            {/* Stats Card */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: 'var(--primary-color, #3b82f6)'
                        }}>
                            {stats.totalSubscribers}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>Active Subscribers</div>
                            <div className="text-muted text-sm">Users who can receive notifications</div>
                        </div>
                        <button
                            onClick={loadStats}
                            disabled={loading}
                            style={{ marginLeft: 'auto' }}
                            className="btn btn-secondary btn-sm"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Compose Card */}
            <div className="card">
                <div className="card-header">
                    <h3>Compose Notification</h3>
                </div>
                <div className="card-body">
                    {/* Template Selection */}
                    <div className="form-group">
                        <label className="form-label">Template</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                            {Object.values(templates).map(tmpl => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => handleTemplateChange(tmpl.id)}
                                    style={{
                                        padding: '0.75rem',
                                        border: selectedTemplate === tmpl.id
                                            ? '2px solid var(--primary-color, #3b82f6)'
                                            : '1px solid #ddd',
                                        borderRadius: '8px',
                                        background: selectedTemplate === tmpl.id
                                            ? 'var(--primary-light, #eff6ff)'
                                            : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {tmpl.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Notification title..."
                        />
                    </div>

                    {/* Body */}
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Message</label>
                        <textarea
                            className="form-input"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your message here..."
                            rows={4}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Target Selection */}
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Send To</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { id: 'all', label: '👥 All Subscribers' },
                                { id: 'selected', label: '👤 Select Users' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTarget(opt.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: target === opt.id
                                            ? '2px solid var(--primary-color, #3b82f6)'
                                            : '1px solid #ddd',
                                        borderRadius: '6px',
                                        background: target === opt.id
                                            ? 'var(--primary-light, #eff6ff)'
                                            : 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Selection (if selected target) */}
                    {target === 'selected' && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Select Users ({selectedUsers.length} selected)</label>
                            <div style={{
                                maxHeight: '200px',
                                overflow: 'auto',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '0.5rem'
                            }}>
                                {subscribers.length === 0 ? (
                                    <div className="text-muted text-center" style={{ padding: '1rem' }}>
                                        No subscribers found
                                    </div>
                                ) : (
                                    subscribers.map((sub, idx) => (
                                        <label
                                            key={sub.user_id + idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eee'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(sub.user_id)}
                                                onChange={() => toggleUser(sub.user_id)}
                                            />
                                            <span>{sub.nickname || sub.user_id}</span>
                                            <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Result Message */}
                    {result && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: result.success ? '#dcfce7' : '#fef2f2',
                            color: result.success ? '#166534' : '#991b1b'
                        }}>
                            {result.message}
                        </div>
                    )}

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={sending || !body.trim()}
                        className="btn btn-primary"
                        style={{ marginTop: '1.5rem', width: '100%' }}
                    >
                        {sending ? '📤 Sending...' : '📤 Send Notification'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
