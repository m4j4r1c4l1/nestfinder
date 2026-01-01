import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode';



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

    // Initial Load & Auto-Refresh
    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
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
        <div className="notifications-page" style={{ width: '75%', maxWidth: '1500px', margin: '0 auto', padding: '0 1rem' }}>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1>🔔 In-App Notifications</h1>
                <p className="text-muted">Manage and track app notifications</p>
            </div>

            {/* Stats Summary */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>📊 Metrics</h3>
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
            <ComposeSection subscribers={subscribers} totalSubscribers={stats.totalSubscribers} onSent={loadStats} />

            {/* Metrics Chart Section */}
            <MetricsChart />

            {/* History Section */}
            <HistorySection />
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

        // Clear fields and set new values
        setTitle(tmpl.title);
        setBody(tmpl.body || '');
        setImageUrl(''); // Reset image

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

// Grafana-style Metrics Chart Component with interactive tooltips and controls
const MetricsChart = () => {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [refreshInterval, setRefreshInterval] = useState(0); // 0 = off
    const [hoveredPoint, setHoveredPoint] = useState(null); // { index, x, y }

    const fetchMetrics = async () => {
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/admin/metrics/history?days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data.metrics || []);
            }
        } catch (err) {
            console.error('Failed to load metrics:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchMetrics();
    }, [days]);

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(fetchMetrics, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, days]);

    if (loading || metrics.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                <div className="card-header" style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '0.75rem 1rem' }}>
                    <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem' }}>📈 Messages Metrics Trend</h3>
                </div>
                <div className="card-body" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No data available'}
                </div>
            </div>
        );
    }

    // Chart configuration
    const chartWidth = 800;
    const chartHeight = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // Define series with colors matching Message Details Modal
    const series = [
        { key: 'notifications', label: 'Total Messages', color: '#8b5cf6' },  // Purple
        { key: 'sent', label: 'Sent', color: '#f59e0b' },           // Amber
        { key: 'delivered', label: 'Delivered', color: '#22c55e' },    // Green
        { key: 'read', label: 'Read', color: '#3b82f6' }               // Blue (like tick)
    ];

    // Calculate scales
    const allValues = series.flatMap(s => metrics.map(m => m[s.key] || 0));
    const maxY = Math.max(...allValues, 1);
    const minY = 0;
    const yScale = (val) => graphHeight - ((val - minY) / (maxY - minY)) * graphHeight;
    const xScale = (i) => (i / (metrics.length - 1 || 1)) * graphWidth;

    // Generate grid lines
    const gridLinesY = 5;

    return (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
            {/* Header with title */}
            <div className="card-header" style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '0.75rem 1rem', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem' }}>📈 Messages Metrics Trend</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Time scope selector */}
                        <select
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value))}
                            style={{
                                background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                                borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                            }}
                        >
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                        </select>
                        {/* Refresh interval selector */}
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                            style={{
                                background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                                borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                            }}
                        >
                            <option value={0}>Auto-refresh: Off</option>
                            <option value={30}>Every 30s</option>
                            <option value={60}>Every 1m</option>
                            <option value={300}>Every 5m</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Legend - separated from title */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', background: '#1e293b' }}>
                {series.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <div style={{ width: 14, height: 3, background: s.color, borderRadius: 2 }} />
                        <span style={{ color: '#94a3b8' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="card-body" style={{ padding: '1rem', overflowX: 'auto', position: 'relative' }}>
                <svg
                    width="100%"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    style={{ minWidth: 600 }}
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <defs>
                        {series.map(s => (
                            <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>

                    <g transform={`translate(${padding.left}, ${padding.top})`}>
                        {/* Grid lines */}
                        {Array.from({ length: gridLinesY + 1 }, (_, i) => {
                            const y = (i / gridLinesY) * graphHeight;
                            const val = Math.round(maxY - (i / gridLinesY) * maxY);
                            return (
                                <g key={i}>
                                    <line x1={0} y1={y} x2={graphWidth} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                                    <text x={-8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">{val}</text>
                                </g>
                            );
                        })}

                        {/* X-axis labels */}
                        {metrics.map((m, i) => (
                            <text key={i} x={xScale(i)} y={graphHeight + 20} textAnchor="middle" fill="#64748b" fontSize="10">
                                {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                        ))}

                        {/* Hover detection areas */}
                        {metrics.map((m, i) => (
                            <rect
                                key={`hover-${i}`}
                                x={xScale(i) - graphWidth / metrics.length / 2}
                                y={0}
                                width={graphWidth / metrics.length}
                                height={graphHeight}
                                fill="transparent"
                                onMouseEnter={() => setHoveredPoint({ index: i, x: xScale(i) })}
                            />
                        ))}

                        {/* Vertical hover line */}
                        {hoveredPoint !== null && (
                            <line
                                x1={hoveredPoint.x}
                                y1={0}
                                x2={hoveredPoint.x}
                                y2={graphHeight}
                                stroke="#64748b"
                                strokeWidth="1"
                                strokeDasharray="4,4"
                            />
                        )}

                        {/* Lines and areas for each series */}
                        {series.map(s => {
                            const points = metrics.map((m, i) => `${xScale(i)},${yScale(m[s.key] || 0)}`).join(' ');
                            const areaPoints = `0,${graphHeight} ${points} ${graphWidth},${graphHeight}`;
                            return (
                                <g key={s.key}>
                                    <polygon points={areaPoints} fill={`url(#gradient-${s.key})`} />
                                    <polyline
                                        points={points}
                                        fill="none"
                                        stroke={s.color}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {metrics.map((m, i) => (
                                        <circle
                                            key={i}
                                            cx={xScale(i)}
                                            cy={yScale(m[s.key] || 0)}
                                            r={hoveredPoint?.index === i ? 6 : 4}
                                            fill={hoveredPoint?.index === i ? s.color : '#1e293b'}
                                            stroke={s.color}
                                            strokeWidth="2"
                                            style={{ transition: 'r 0.1s ease' }}
                                        />
                                    ))}
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && metrics[hoveredPoint.index] && (
                    <div style={{
                        position: 'absolute',
                        left: `calc(${(hoveredPoint.x + padding.left) / chartWidth * 100}% + 10px)`,
                        top: '20px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 10,
                        minWidth: '140px'
                    }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                            {new Date(metrics[hoveredPoint.index].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        {series.map(s => (
                            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{s.label}</span>
                                </span>
                                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{metrics[hoveredPoint.index][s.key] || 0}</span>
                            </div>
                        ))}
                    </div>
                )}
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
                                // metadata is already parsed by the API, no need to JSON.parse again
                                const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata || '{}') : (log.metadata || {});
                                // Use DateTimeCell logic here manually or reuse if refactored. 
                                // Since DateTimeCell is inside Modal, let's duplicate the fix logic here or assume local fix.
                                // I will implement inline fix here.
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
                                                    background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', // Light Green as requested
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

            {/* Detail Modal */}
            {selectedBatchId && (
                <DetailModal batchId={selectedBatchId} onClose={() => setSelectedBatchId(null)} />
            )}

            {/* Message Preview Modal */}
            {previewMessage && (
                <MessagePreviewModal message={previewMessage} onClose={() => setPreviewMessage(null)} />
            )}
        </div>
    );
};

const MessagePreviewModal = ({ message, onClose }) => {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
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
                            <span style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '1rem' }}>{message.title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {message.timestamp ? message.timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                            {message.body}
                        </div>
                        {message.image && (
                           <div style={{ marginTop: '0.5rem', borderRadius: '4px', overflow: 'hidden' }}>
                               <img src={message.image} alt="Notification attachment" style={{ width: '100%', height: 'auto', display: 'block' }} />
                           </div> 
                        )}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Preview of how the user sees this message
                    </div>
                </div>
            </div>
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
                <div style={{ padding: '0 1.5rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading details...</div>
                    ) : details ? (
                        <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
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


export default Notifications;
