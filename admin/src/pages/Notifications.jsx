import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const API_URL = import.meta.env.VITE_API_URL || '';
const APP_URL = 'https://nestfinder-sa1g.onrender.com'; // Hardcoded for now or env var using VITE_CLIENT_URL

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
    }
};

const Notifications = () => {
    const [activeTab, setActiveTab] = useState('send'); // 'send', 'history'

    // Compose State
    const [selectedTemplate, setSelectedTemplate] = useState('announcement');
    const [title, setTitle] = useState(templates.announcement.title);
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [target, setTarget] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({
        totalSubscribers: 0,
        notificationMetrics: { total: 0, unread: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // History State
    const [historyLogs, setHistoryLogs] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null); // Batch ID
    const [batchDetails, setBatchDetails] = useState(null); // { messages: [], stats: {} }
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load subscriber stats
    useEffect(() => {
        loadStats();
    }, []);

    // Load history when tab changes
    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    // Load batch details when selected
    useEffect(() => {
        if (selectedBatch) {
            loadBatchDetails(selectedBatch);
        } else {
            setBatchDetails(null);
        }
    }, [selectedBatch]);

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

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch(`${API_URL}/api/push/admin/notifications/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistoryLogs(data.logs || []);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadBatchDetails = async (batchId) => {
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch(`${API_URL}/api/push/admin/notifications/batch/${batchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBatchDetails(data);
            }
        } catch (err) {
            console.error('Failed to load batch details:', err);
        }
    };

    // Generate Custom QR Code with Emoji Center
    const generateQRCode = async () => {
        try {
            // 1. Generate standard QR code
            const qrDataUrl = await QRCode.toDataURL(APP_URL, {
                errorCorrectionLevel: 'H',
                margin: 2,
                color: {
                    dark: '#1e293b', // Slate 800
                    light: '#ffffff'
                },
                width: 500
            });

            // 2. Load into Image to draw on Canvas
            const img = new Image();
            img.src = qrDataUrl;
            await new Promise(r => img.onload = r);

            // 3. Create Canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // 4. Draw QR
            ctx.drawImage(img, 0, 0);

            // 5. Draw Center Emoji (🪹)
            // White circle background for emoji
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = canvas.width / 6;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'white';
            ctx.fill();
            // Optional border
            // ctx.lineWidth = 5;
            // ctx.strokeStyle = '#1e293b';
            // ctx.stroke();

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

    // Handle template selection
    const handleTemplateChange = async (templateId) => {
        setSelectedTemplate(templateId);
        const tmpl = templates[templateId];
        setTitle(tmpl.title);
        if (tmpl.body) {
            setBody(tmpl.body);
        }

        // Auto-generate QR for "Share App" template
        if (templateId === 'share_app') {
            const qrImage = await generateQRCode();
            setImageUrl(qrImage);
        } else {
            // Keep existing image if switching away, or clear? 
            // Better to let user clear manually if they want to keep it.
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
                    imageUrl,
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
                setImageUrl('');
            } else {
                setResult({ success: false, message: data.error || 'Failed to send' });
            }
        } catch (err) {
            setResult({ success: false, message: err.message });
        } finally {
            setSending(false);
        }
    };

    // Clear all notifications
    const handleClearNotifications = async () => {
        if (!confirm('Are you sure you want to delete ALL notifications? This cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch(`${API_URL}/api/push/admin/notifications/clear-all`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setResult({
                    success: true,
                    message: `✅ ${data.message}`
                });
                // Reload stats to update metrics
                await loadStats();
            } else {
                const data = await response.json();
                setResult({ success: false, message: data.error || 'Failed to clear notifications' });
            }
        } catch (err) {
            setResult({ success: false, message: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Filter subscribers based on search query
    const filteredSubscribers = subscribers.filter(sub => {
        const searchLower = searchQuery.toLowerCase();
        return (
            (sub.nickname || '').toLowerCase().includes(searchLower) ||
            sub.user_id.toLowerCase().includes(searchLower)
        );
    });

    // Handle Image Upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            setResult({ success: false, message: 'Image size too large (max 8MB)' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImageUrl(reader.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="notifications-page">
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1>🔔 In-App Notifications</h1>
                <p className="text-muted">Manage and track app notifications</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <button
                    onClick={() => setActiveTab('send')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderBottom: activeTab === 'send' ? '2px solid var(--primary-color, #3b82f6)' : 'none',
                        fontWeight: activeTab === 'send' ? 600 : 400,
                        color: activeTab === 'send' ? 'var(--primary-color, #3b82f6)' : '#6b7280',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    📤 Send New
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderBottom: activeTab === 'history' ? '2px solid var(--primary-color, #3b82f6)' : 'none',
                        fontWeight: activeTab === 'history' ? 600 : 400,
                        color: activeTab === 'history' ? 'var(--primary-color, #3b82f6)' : '#6b7280',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    📜 History & Status
                </button>
            </div>

            {activeTab === 'send' && (
                <>
                    {/* Stats Card */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {/* Total Users */}
                                <div>
                                    <div style={{
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        color: 'var(--primary-color, #3b82f6)'
                                    }}>
                                        {stats.totalSubscribers}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Total Users</div>
                                        <div className="text-muted text-sm">Registered users</div>
                                    </div>
                                </div>

                                {/* Total Notifications */}
                                <div>
                                    <div style={{
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        color: '#8b5cf6'
                                    }}>
                                        {stats.notificationMetrics?.total || 0}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Total Messages</div>
                                        <div className="text-muted text-sm">In database</div>
                                    </div>
                                </div>

                                {/* Unread Notifications */}
                                <div>
                                    <div style={{
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        color: '#f59e0b'
                                    }}>
                                        {stats.notificationMetrics?.unread || 0}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Unread Messages</div>
                                        <div className="text-muted text-sm">Pending delivery</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    onClick={loadStats}
                                    disabled={loading}
                                    className="btn btn-secondary btn-sm"
                                >
                                    🔄 Refresh
                                </button>
                                <button
                                    onClick={handleClearNotifications}
                                    disabled={loading}
                                    className="btn btn-secondary btn-sm"
                                    style={{ marginLeft: 'auto', background: '#dc2626', color: 'white' }}
                                >
                                    🗑️ Clear All Notifications
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

                            {/* Image Upload Section */}
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Image (Upload or URL)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://... or upload ->"
                                        style={{ flex: 1 }}
                                    />
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📂 Upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                                {imageUrl && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '4px', display: 'inline-block' }}>
                                        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Preview:</span>
                                            <button
                                                onClick={() => setImageUrl('')}
                                                style={{
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '0.1rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} />
                                    </div>
                                )}
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
                                        { id: 'all', label: '👥 All Users' },
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

                                    {/* Search Input */}
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="🔍 Search by nickname or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ marginBottom: '0.5rem' }}
                                    />

                                    <div style={{
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '0.5rem'
                                    }}>
                                        {filteredSubscribers.length === 0 ? (
                                            <div className="text-muted text-center" style={{ padding: '1rem' }}>
                                                {searchQuery ? 'No users match your search' : 'No users found'}
                                            </div>
                                        ) : (
                                            filteredSubscribers.map((sub, idx) => (
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
                                                        Last active: {sub.last_active ? new Date(sub.last_active).toLocaleDateString() : 'Never'}
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
                </>
            )}

            {activeTab === 'history' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Sent History</h3>
                    </div>
                    <div className="card-body">
                        {selectedBatch ? (
                            <div>
                                <button onClick={() => setSelectedBatch(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back to List</button>
                                {batchDetails ? (
                                    <div>
                                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                            <div><strong>Total:</strong> {batchDetails.stats.total}</div>
                                            <div><strong>Delivered:</strong> {batchDetails.stats.delivered}</div>
                                            <div><strong>Read:</strong> {batchDetails.stats.read}</div>
                                        </div>
                                        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                                        <th style={{ padding: '0.75rem' }}>User</th>
                                                        <th style={{ padding: '0.75rem' }}>Status</th>
                                                        <th style={{ padding: '0.75rem' }}>Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchDetails.messages.map(msg => (
                                                        <tr key={msg.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                            <td style={{ padding: '0.75rem' }}>{msg.nickname || 'Guest'} <span className="text-muted text-xs">({msg.device_id?.substr(0, 8)}...)</span></td>
                                                            <td style={{ padding: '0.75rem' }}>
                                                                {msg.read ? (
                                                                    <span title="Read" style={{ color: '#3b82f6', fontSize: '1.2rem' }}>🔵</span>
                                                                ) : msg.delivered ? (
                                                                    <span title="Delivered" style={{ color: '#64748b' }}>✔️✔️</span>
                                                                ) : (
                                                                    <span title="Sent" style={{ color: '#94a3b8' }}>✔️</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                                {new Date(msg.created_at).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4">Loading details...</div>
                                )}
                            </div>
                        ) : (
                            <div>
                                {loadingHistory ? (
                                    <div className="text-center p-4">Loading history...</div>
                                ) : historyLogs.length === 0 ? (
                                    <div className="text-center p-4 text-muted">No history found.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem' }}>Date</th>
                                                <th style={{ padding: '0.75rem' }}>Message</th>
                                                <th style={{ padding: '0.75rem' }}>Target</th>
                                                <th style={{ padding: '0.75rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyLogs.map(log => {
                                                const meta = JSON.parse(log.metadata || '{}');
                                                return (
                                                    <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            <div style={{ fontWeight: 600 }}>{meta.title || meta.template}</div>
                                                            <div className="text-muted text-xs">ID: {log.target_id?.substr(0, 8)}...</div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem' }}>{meta.count} users</td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            {log.target_id && (
                                                                <button
                                                                    onClick={() => setSelectedBatch(log.target_id)}
                                                                    className="btn btn-sm btn-secondary"
                                                                >
                                                                    View Status
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
