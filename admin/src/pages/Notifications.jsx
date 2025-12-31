import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Notification templates
const templates = {
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
                // Switch to history tab to see it
                // setTimeout(() => setActiveTab('history'), 1500); 
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
                                {/* Stats content same as before ... */}
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color, #3b82f6)' }}>
                                        {stats.totalSubscribers}
                                    </div>
                                    <div><div style={{ fontWeight: 600 }}>Total Users</div><div className="text-muted text-sm">Registered</div></div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                                        {stats.notificationMetrics?.total || 0}
                                    </div>
                                    <div><div style={{ fontWeight: 600 }}>Total Messages</div><div className="text-muted text-sm">Sent</div></div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                        {stats.notificationMetrics?.unread || 0}
                                    </div>
                                    <div><div style={{ fontWeight: 600 }}>Unread</div><div className="text-muted text-sm">Pending</div></div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button onClick={loadStats} disabled={loading} className="btn btn-secondary btn-sm">🔄 Refresh</button>
                                <button onClick={handleClearNotifications} disabled={loading} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto', background: '#dc2626', color: 'white' }}>🗑️ Clear All</button>
                            </div>
                        </div>
                    </div>

                    {/* Compose Card */}
                    <div className="card">
                        <div className="card-header"><h3>Compose Notification</h3></div>
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
                                                border: selectedTemplate === tmpl.id ? '2px solid var(--primary-color, #3b82f6)' : '1px solid #ddd',
                                                borderRadius: '8px',
                                                background: selectedTemplate === tmpl.id ? 'var(--primary-light, #eff6ff)' : 'white',
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

                            {/* Title & Image & Body & Target (Same as before) */}
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Title</label>
                                <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Image</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="text" className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>📂 <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} /></label>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Message</label>
                                <textarea className="form-input" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Send To</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[{ id: 'all', label: '👥 All Users' }, { id: 'selected', label: '👤 Select Users' }].map(opt => (
                                        <button key={opt.id} onClick={() => setTarget(opt.id)} style={{ padding: '0.5rem 1rem', border: target === opt.id ? '2px solid blue' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>

                            {/* User Selection Logic */}
                            {target === 'selected' && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <input type="text" className="form-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', padding: '0.5rem', marginTop: '0.5rem' }}>
                                        {filteredSubscribers.map((sub, idx) => (
                                            <label key={idx} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem' }}>
                                                <input type="checkbox" checked={selectedUsers.includes(sub.user_id)} onChange={() => toggleUser(sub.user_id)} />
                                                {sub.nickname || sub.user_id}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result && <div style={{ marginTop: '1rem', padding: '1rem', background: result.success ? '#dcfce7' : '#fef2f2' }}>{result.message}</div>}

                            <button onClick={handleSend} disabled={sending || !body.trim()} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                                {sending ? 'Sending...' : 'Send Notification'}
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
