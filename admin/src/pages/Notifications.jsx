import React, { useState, useEffect } from 'react';



const API_URL = import.meta.env.VITE_API_URL || '';
const APP_URL = 'https://nestfinder-sa1g.onrender.com';

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
    // Shared State
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({
        totalSubscribers: 0,
        notificationMetrics: { total: 0, unread: 0 }
    });
    const [loading, setLoading] = useState(false);

    // Initial Load
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

    return (
        <div className="notifications-page" style={{ padding: '0 1rem' }}>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1>🔔 In-App Notifications</h1>
                <p className="text-muted">Manage and track app notifications</p>
            </div>

            {/* Stats Summary */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>📊 Metrics</h3>
                    <button onClick={loadStats} className="btn btn-sm btn-secondary" disabled={loading}>
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color, #3b82f6)' }}>
                                {stats.totalSubscribers}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Total Users</div>
                                <div className="text-muted text-sm">Registered users</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {stats.notificationMetrics?.total || 0}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Total Messages</div>
                                <div className="text-muted text-sm">In database</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {stats.notificationMetrics?.unread || 0}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Unread Messages</div>
                                <div className="text-muted text-sm">Pending delivery</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compose Section */}
            <ComposeSection subscribers={subscribers} onSent={loadStats} />

            {/* History Section */}
            <HistorySection />
        </div>
    );
};

// --- Sub-components ---

const ComposeSection = ({ subscribers, onSent }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('announcement');
    const [title, setTitle] = useState(templates.announcement.title);
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [target, setTarget] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    // Generate Custom QR Code with Emoji Center
    const generateQRCode = async () => {
        try {
            // 1. Generate QR Data URL using window.QRious
            const qr = new window.QRious({
                value: APP_URL,
                size: 500,
                level: 'H',
                padding: 0,
                background: 'white',
                foreground: '#1e293b'
            });
            const qrDataUrl = qr.toDataURL();

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
        setTitle(tmpl.title);
        if (tmpl.body) setBody(tmpl.body);
        if (templateId === 'share_app') {
            const qrImage = await generateQRCode();
            setImageUrl(qrImage);
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
                        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            📂 <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Message</label>
                    <textarea className="form-input" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Target</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setTarget('all')} className={`btn ${target === 'all' ? 'btn-primary' : 'btn-secondary'}`}>All Users</button>
                        <button onClick={() => setTarget('selected')} className={`btn ${target === 'selected' ? 'btn-primary' : 'btn-secondary'}`}>Select Users</button>
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

                {result && <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px', background: result.success ? '#dcfce7' : '#fee2e2' }}>{result.message}</div>}

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

    useEffect(() => {
        loadHistory();
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
                <button onClick={loadHistory} className="btn btn-sm btn-secondary">🔄 Refresh</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#334155', zIndex: 1 }}>
                            <tr style={{ textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>Timestamp</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>Message</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => {
                                const meta = JSON.parse(log.metadata || '{}');
                                return (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedBatchId(log.target_id)}
                                        style={{
                                            borderBottom: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: 'transparent'
                                        }}
                                        className="history-row"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                            e.currentTarget.style.borderLeft = '3px solid #10b981';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderLeft = 'none';
                                        }}
                                    >
                                        <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#64748b' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: '#64748b' }}>{meta.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{meta.body ? meta.body.substring(0, 50) + '...' : meta.template}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                background: '#e0f2fe', color: '#0369a1',
                                                padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.8rem'
                                            }}>
                                                {meta.count} users
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {logs.length === 0 && !loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No history found</div>}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedBatchId && (
                <DetailModal batchId={selectedBatchId} onClose={() => setSelectedBatchId(null)} />
            )}
        </div>
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

    // Modal Overlay Style
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
    };

    // Modal Content Style
    const contentStyle = {
        background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    };

    return (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={contentStyle}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Message Details</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div className="text-center">Loading...</div>
                    ) : details ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{details.stats.total}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Sent</div>
                                </div>
                                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>{details.stats.delivered}</div>
                                    <div style={{ color: '#166534', fontSize: '0.9rem' }}>Delivered</div>
                                </div>
                                <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{details.stats.read}</div>
                                    <div style={{ color: '#1e40af', fontSize: '0.9rem' }}>Read</div>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1e293b', color: 'white', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>User</th>
                                        <th style={{ padding: '1rem' }}>Sent At</th>
                                        <th style={{ padding: '1rem' }}>Receipt Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.messages.map(msg => (
                                        <tr key={msg.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{msg.nickname || 'Guest'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{msg.device_id?.substr(0, 8)}...</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#64748b' }}>
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {msg.read ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>🔵</span>
                                                        <span style={{ fontWeight: 500 }}>Read</span>
                                                    </div>
                                                ) : msg.delivered ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>✔✔</span>
                                                        <span style={{ fontWeight: 500 }}>Delivered</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>✔</span>
                                                        <span>Sent</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <div>Error loading details</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
