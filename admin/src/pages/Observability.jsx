import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';




const API_URL = import.meta.env.VITE_API_URL || '';
const APP_URL = 'https://m4j4r1c4l1.github.io/nestfinder/';



const Observability = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalReceived: 0,
        avgDeliveryTime: '0ms',
        systemHealth: 100,
        uptime: '99.9%',
        errorRate: '0.0%',
        mapPoints: { total: 0, confirmed: 0, pending: 0, rejected: 0 },
        notificationMetrics: { total: 0, sent: 0, delivered: 0, read: 0, unread: 0 },
        feedbackMetrics: { total: 0, pending: 0, read: 0 },
        devMetrics: { loc: 0, components: 0, commits: 0 }
    });

    const [activeTab, setActiveTab] = useState('notifications');
    const [timeRange, setTimeRange] = useState('7d');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedRating, setSelectedRating] = useState(null); // For rating breakdown modal

    // WebSocket for real-time updates (handled by custom hook)
    const wsUrl = API_URL.replace(/^http/, 'ws') || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

    useWebSocket(wsUrl, (message) => {
        if (message.type === 'commit-update') {
            console.log(`Real-time commit update: ${message.data.lastCommit} - refreshing stats`);
            // Add small delay to allow server to finish startup/DB init
            setTimeout(loadData, 1000);
        }
    });

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/push/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Server returned ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            // Merge with default structure to ensure no undefined access
            setStats(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error('Failed to load observability stats:', err);
            // We keep the default stats so the UI doesn't crash
        }
        setLoading(false);
    };

    return (
        <div className="notifications-page" style={{ width: '75%', maxWidth: '1500px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🐦 Observability
                </h1>
                <p className="text-muted">Monitor system health, usage statistics, and developer insights</p>
            </div>

            {/* Totals Summary */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>📊 Totals</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Row 1: Users, Points, Rating */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                            {/* Users Block */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>🦚 Users</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color, #3b82f6)', lineHeight: 1 }}>
                                        {stats.totalSubscribers}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Total</div>
                                    <div className="text-muted text-sm">Registered</div>
                                </div>
                                {/* 2x2 Grid Badges */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '240px' }}>
                                    {[
                                        { label: 'Eagle', count: stats.userLevels?.eagle, color: '#f59e0b', icon: '🦅' },
                                        { label: 'Owl', count: stats.userLevels?.owl, color: '#8b5cf6', icon: '🦉' },
                                        { label: 'Sparrow', count: stats.userLevels?.sparrow, color: '#3b82f6', icon: '🐦' },
                                        { label: 'Hatchling', count: stats.userLevels?.hatchling, color: '#94a3b8', icon: '🥚' }
                                    ].map(badge => (
                                        <div key={badge.label} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                            background: `${badge.color}20`, border: `1px solid ${badge.color}40`,
                                            borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>{badge.icon}</span>
                                            <span style={{ color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                                            <span style={{ fontWeight: 700, color: badge.color, marginLeft: '0.2rem' }}>{badge.count || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '60%', alignSelf: 'center', background: '#334155', margin: '0 1rem' }} />

                            {/* Points Block */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>📍 Points</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e', lineHeight: 1 }}>
                                        {(stats.mapPoints?.confirmed || 0) + (stats.mapPoints?.pending || 0) + (stats.mapPoints?.deactivated || 0)}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Total</div>
                                    <div className="text-muted text-sm">Locations</div>
                                </div>
                                {/* Badges: Pending on top, Confirmed+Inactive below */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '280px' }}>
                                    {/* Pending badge on top */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        background: '#f59e0b20', border: '1px solid #f59e0b40',
                                        borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>🟠</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Pending</span>
                                        <span style={{ fontWeight: 700, color: '#e2e8f0', marginLeft: '0.2rem' }}>{stats.mapPoints?.pending || 0}</span>
                                    </div>
                                    {/* Confirmed + Inactive row */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            background: '#22c55e20', border: '1px solid #22c55e40',
                                            borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>🟢</span>
                                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Confirmed</span>
                                            <span style={{ fontWeight: 700, color: '#e2e8f0', marginLeft: '0.2rem' }}>{stats.mapPoints?.confirmed || 0}</span>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            background: '#ef444420', border: '1px solid #ef444440',
                                            borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>🔴</span>
                                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Inactive</span>
                                            <span style={{ fontWeight: 700, color: '#e2e8f0', marginLeft: '0.2rem' }}>{stats.mapPoints?.deactivated || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '60%', alignSelf: 'center', background: '#334155', margin: '0 1rem' }} />

                            {/* Rating Block */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem', height: '100%' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>⭐ Rating</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#facc15', lineHeight: 1 }}>
                                        {stats.avgRating ? stats.avgRating.toFixed(1) : '-'}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Average</div>
                                    <div className="text-muted text-sm">All time</div>
                                </div>
                                {/* Badges */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        background: '#facc1520', border: '1px solid #facc1540',
                                        borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>⭐</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Votes</span>
                                        <span style={{ fontWeight: 700, color: '#e2e8f0', marginLeft: '0.2rem' }}>{stats.totalRatings || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator Line */}
                        <div style={{ height: '1px', background: '#334155', width: '100%' }} />

                        {/* Row 2: Messages (left) | Devel (right) */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                            {/* Messages Block (Left) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>🔔 Messages</div>
                                {/* Sent Row */}
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316' }}>
                                            {stats.notificationMetrics?.total || 0}
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>Total Sent</div>
                                    </div>
                                    <div style={{ width: '1px', height: '30px', background: '#334155' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
                                            {(stats.notificationMetrics?.total || 0) - (stats.notificationMetrics?.unread || 0)}
                                        </div>
                                        <div className="text-muted text-sm">Delivered</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                            {(stats.notificationMetrics?.total || 0) - (stats.notificationMetrics?.unread || 0)}
                                        </div>
                                        <div className="text-muted text-sm">Read</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                            {stats.notificationMetrics?.unread || 0}
                                        </div>
                                        <div className="text-muted text-sm">Unread</div>
                                    </div>
                                </div>
                                {/* Received Row */}
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                                            {stats.feedbackMetrics?.total || stats.totalReceived || 0}
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>Total Received</div>
                                    </div>
                                    <div style={{ width: '1px', height: '30px', background: '#334155' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>
                                            {stats.feedbackMetrics?.pending || 0}
                                        </div>
                                        <div className="text-muted text-sm">Delivered</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                            {stats.feedbackMetrics?.read || 0}
                                        </div>
                                        <div className="text-muted text-sm">Read</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '80px', background: '#334155', alignSelf: 'center' }} />

                            {/* Devel Block (Right) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem', marginBottom: '0.5rem' }}>🛠️ Development</div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#14b8a6', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {(stats.devMetrics?.loc || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>LOC</div>
                                            <div className="text-muted text-sm" style={{ fontSize: '0.7rem' }}>Lines of Code</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8b5cf6', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {(stats.devMetrics?.commits || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>Commits</div>
                                            <div className="text-muted text-sm" style={{ fontSize: '0.7rem' }}>Git History</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0ea5e9', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {(stats.devMetrics?.components || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>Components</div>
                                            <div className="text-muted text-sm" style={{ fontSize: '0.7rem' }}>React/JSX</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', fontFamily: '"JetBrains Mono", monospace', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {stats.devMetrics?.lastCommit || '-'}
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>Commit ID</div>
                                            <div className="text-muted text-sm" style={{ fontSize: '0.7rem' }}>Latest</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Chart Section */}
            <MetricsSection />
        </div>
    );
};

// --- Sub-components ---





// Modal for Daily Breakdown
const DailyBreakdownModal = ({ date, data, totalUsers, onClose }) => {
    // Handle loading state
    if (!data) {
        return ReactDOM.createPortal(
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={onClose}>
                <div style={{ color: '#cbd5e1' }}>Loading...</div>
            </div>,
            document.body
        );
    }

    // Data is now a hierarchical tree: [{ action, count, children: [] }]
    const items = Array.isArray(data) ? data : [];

    // Calculate global max for consistent bar scaling across all levels
    let maxVal = 1;
    items.forEach(root => {
        maxVal = Math.max(maxVal, root.count);
        if (root.children) {
            root.children.forEach(child => maxVal = Math.max(maxVal, child.count));
        }
    });

    // Helper to render a bar row
    const renderRow = (item, index, isChild = false, overrideColor = null) => {
        const percent = (item.count / maxVal) * 100;

        // Vibrant Palette for events
        const vibrantColors = [
            '#f472b6', // Pink
            '#a78bfa', // Purple
            '#22d3ee', // Cyan
            '#4ade80', // Green
            '#fb923c', // Orange
            '#facc15', // Yellow
        ];

        // Assign vibrant color: Use override (parent's color) if provided, otherwise cycle based on index
        const barColor = overrideColor || vibrantColors[index % vibrantColors.length];

        return (
            <div key={`${item.action}-${index}`} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: isChild ? '0.85rem' : '0.9rem' }}>
                    <span style={{ color: isChild ? '#cbd5e1' : '#e2e8f0', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isChild && <span style={{ opacity: 0.5 }}>↳</span>}
                        {(item.action || 'Unknown').replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.count}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: barColor,
                        borderRadius: '4px',
                        opacity: isChild ? 0.5 : 0.75, // Semi-transparent for "glass" vibe
                        boxShadow: `0 0 10px ${barColor}66` // Glow for everyone
                    }} />
                </div>
            </div>
        );
    };

    const content = (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }} onClick={onClose}>
            <div
                className="card"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    animation: 'scaleIn 0.2s ease-out',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>👥 Daily Breakdown</h3>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {totalUsers !== undefined && (
                            <div style={{ fontSize: '0.85rem', color: '#60a5fa', marginTop: '0.25rem', fontWeight: 500 }}>
                                Total Active Users: {totalUsers}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '1.5rem', cursor: 'pointer',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>×</button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No detailed activity recorded for this day.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.map((root, i) => {
                                // Just pass null override so it cycles based on index.
                                // But for children, we want them to cycle relative to the total list or just their own index?
                                // "different colors no matter their root event".
                                // Let's use a simple counter or hash if possible, but index is easiest.
                                // To make children distinct from parent, we can offset the index.

                                return (
                                    <div key={i} style={{ marginBottom: root.children?.length ? '1rem' : '0' }}>
                                        {/* Render Root */}
                                        {renderRow(root, i, false)}

                                        {/* Render Children (Indented) */}
                                        {root.children && root.children.length > 0 && (
                                            <div style={{
                                                paddingLeft: '1.5rem',
                                                borderLeft: '2px solid #334155',
                                                marginLeft: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}>
                                                {/* Use (i + j + 1) to offset colors so child doesn't match parent exactly */}
                                                {root.children.map((child, j) => renderRow(child, i + j + 1, true))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

// Reusable Chart Card Component with independent state
const ChartCard = ({ title, icon, type = 'line', dataKey, seriesConfig, showLegend = true, onPointClick }) => {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [refreshInterval, setRefreshInterval] = useState(0);
    const [hoveredPoint, setHoveredPoint] = useState(null);

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

    // Chart Dimensions
    const chartWidth = 800;
    const chartHeight = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // Helper functions - add inner padding so bars don't overlap Y-axis
    const innerPadding = type === 'bar' ? graphWidth / (metrics.length * 2) : 0;
    const getX = (i) => innerPadding + (i / (metrics.length - 1 || 1)) * (graphWidth - innerPadding * 2);
    const getY = (val, max) => graphHeight - ((val / max) * graphHeight);

    if (loading || metrics.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderBottom: '1px solid #334155', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {typeof icon === 'string' ? <span style={{ fontSize: '1.2rem' }}>{icon}</span> : icon}
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem' }}>{title}</h3>
                    </div>
                    {renderControls()}
                </div>
                <div className="card-body" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No metrics data available'}
                </div>
            </div>
        );
    }

    // Calculate scales
    const allValues = seriesConfig.flatMap(s => metrics.map(m => m[s.key] || 0));
    const maxY = Math.max(...allValues, 5); // Minimum non-zero scale

    // Grid lines
    const gridLinesY = 5;

    function renderControls() {
        return (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    style={{
                        background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                        borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                </select>
                <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    style={{
                        background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                        borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                >
                    <option value={0}>Refresh: Off</option>
                    <option value={30}>30s</option>
                    <option value={60}>1m</option>
                </select>
            </div>
        );
    }

    const renderLineChart = () => (
        <g>
            {seriesConfig.map(s => {
                const points = metrics.map((m, i) => `${getX(i)},${getY(m[s.key] || 0, maxY)}`).join(' ');
                const areaPoints = `0,${graphHeight} ${points} ${graphWidth},${graphHeight}`;
                return (
                    <g key={s.key}>
                        <defs>
                            <linearGradient id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polygon points={areaPoints} fill={`url(#gradient-${s.key})`} />
                        <polyline points={points} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {metrics.map((m, i) => (
                            <circle
                                key={i}
                                cx={getX(i)}
                                cy={getY(m[s.key] || 0, maxY)}
                                r={hoveredPoint?.index === i ? 5 : 3}
                                fill={hoveredPoint?.index === i ? s.color : '#1e293b'}
                                stroke={s.color}
                                strokeWidth="2"
                                style={{ transition: 'r 0.1s ease', opacity: hoveredPoint && hoveredPoint.index !== i ? 0.5 : 1 }}
                            />
                        ))}
                    </g>
                );
            })}
        </g>
    );

    // Helper for heat-map color generation (Cool -> Hot)
    const getHeatColor = (value, min, max) => {
        if (max === min) return '#3b82f6'; // Default blue if no variance
        const ratio = (value - min) / (max - min);
        // Gradient: Blue (0) -> Cyan (0.25) -> Lime (0.5) -> Yellow (0.75) -> Red (1.0)
        if (ratio < 0.25) return '#3b82f6'; // Blue
        if (ratio < 0.5) return '#06b6d4';  // Cyan
        if (ratio < 0.75) return '#84cc16'; // Lime
        if (ratio < 0.9) return '#facc15';  // Yellow
        return '#ef4444';                   // Red
    };

    // Calculate min/max for heat coloring (Available to both renderBarChart and Tooltip)
    const heatValues = type === 'bar' ? metrics.map(m => m[seriesConfig[0].key] || 0) : [];
    const heatMin = Math.min(...heatValues);
    const heatMax = Math.max(...heatValues);

    const renderBarChart = () => {
        const barWidth = (graphWidth / metrics.length) * 0.3; // Half width (was 0.6)

        return (
            <g>
                {metrics.map((m, i) => {
                    const val = m[seriesConfig[0].key] || 0;
                    const h = (val / maxY) * graphHeight;
                    const x = getX(i) - (barWidth / 2);
                    const y = graphHeight - h;

                    // Use heat color for bar charts, otherwise series color
                    const color = type === 'bar' ? getHeatColor(val, heatMin, heatMax) : seriesConfig[0].color;
                    const isHovered = hoveredPoint?.index === i;

                    return (
                        <g key={i} onClick={(e) => {
                            e.stopPropagation();
                            if (onPointClick) onPointClick(m);
                        }} style={{ cursor: onPointClick ? 'pointer' : 'default' }}>
                            <rect
                                x={x} y={y} width={barWidth} height={h}
                                fill={color}
                                rx="2" ry="2"
                                opacity={isHovered ? 1 : 0.8}
                                style={{ transition: 'opacity 0.2s' }}
                            />
                        </g>
                    );
                })}
            </g>
        );
    };

    return (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '8px', backdropFilter: 'blur(8px)' }}>
            {/* Header */}
            <div className="card-header" style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #334155', padding: '0.75rem 1rem', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {typeof icon === 'string' ? <span style={{ fontSize: '1.2rem' }}>{icon}</span> : icon}
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
                    </div>
                    {/* Right-aligned controls */}
                    <div style={{ marginLeft: 'auto' }}>
                        {renderControls()}
                    </div>
                </div>
            </div>

            {/* Legend */}
            {showLegend && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', background: 'transparent' }}>
                    {seriesConfig.map(s => {
                        // Check if this is our Heat Bar chart (Connected Clients)
                        const isHeatBar = type === 'bar' && seriesConfig.length === 1; // Simplest detection for now based on config

                        return (
                            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                                {/* Legend Icon: Gradient for HeatMap, Solid for Lines */}
                                <div style={{
                                    width: isHeatBar ? 24 : 12, // Wider for gradient
                                    height: 12,
                                    borderRadius: '2px',
                                    background: isHeatBar
                                        ? 'linear-gradient(to right, #3b82f6, #06b6d4, #84cc16, #facc15, #ef4444)' // Heat gradient
                                        : s.color
                                }} />
                                <span style={{ color: '#94a3b8' }}>{s.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Graph Body */}
            <div className="card-body" style={{ padding: '1rem', overflowX: 'auto', position: 'relative' }}>
                <svg
                    width="100%"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    style={{ minWidth: 600 }}
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <g transform={`translate(${padding.left}, ${padding.top})`}>
                        {/* Y-Axis Grid & Labels */}
                        {Array.from({ length: gridLinesY + 1 }, (_, i) => {
                            const y = (i / gridLinesY) * graphHeight;
                            const val = Math.round(maxY - (i / gridLinesY) * maxY);
                            return (
                                <g key={i}>
                                    <line x1={0} y1={y} x2={graphWidth} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                                    <text x={-10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">{val.toLocaleString()}</text>
                                </g>
                            );
                        })}

                        {/* X-Axis Labels */}
                        {metrics.map((m, i) => (
                            <text key={i} x={getX(i)} y={graphHeight + 20} textAnchor="middle" fill="#64748b" fontSize="10">
                                {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                        ))}

                        {/* Render Chart Type */}
                        {type === 'bar' ? renderBarChart() : renderLineChart()}

                        {/* Hover Overlay Columns */}
                        {metrics.map((m, i) => (
                            <rect
                                key={`hover-col-${i}`}
                                x={getX(i) - (graphWidth / metrics.length) / 2}
                                y={0}
                                width={graphWidth / metrics.length}
                                height={graphHeight}
                                fill="transparent"
                                style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                                onMouseMove={(e) => {
                                    const y = e.nativeEvent.offsetY;
                                    setHoveredPoint({ index: i, x: getX(i), y });
                                }}
                                onMouseEnter={(e) => {
                                    const y = e.nativeEvent.offsetY;
                                    setHoveredPoint({ index: i, x: getX(i), y });
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPointClick) onPointClick(metrics[i]);
                                }}
                            />
                        ))}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && metrics[hoveredPoint.index] && (() => {
                    // Clamp tooltip Y position to prevent cutoff/scroll
                    const tooltipY = Math.max(40, Math.min(chartHeight - 40, hoveredPoint.y ? hoveredPoint.y + padding.top : 60));
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${(hoveredPoint.x + padding.left) / chartWidth * 100}%`,
                            top: `${tooltipY}px`,
                            transform: `translate(${hoveredPoint.index > metrics.length * 0.6 ? 'calc(-100% - 15px)' : '15px'}, -50%)`,
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            zIndex: 20,
                            pointerEvents: 'none',
                            minWidth: '120px'
                        }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, borderBottom: '1px solid #334155', marginBottom: '0.5rem', paddingBottom: '0.2rem', fontSize: '0.9rem' }}>
                                {new Date(metrics[hoveredPoint.index].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            {seriesConfig.map(s => {
                                let tipColor = s.color;
                                if (type === 'bar' && seriesConfig.length === 1) {
                                    const val = metrics[hoveredPoint.index][s.key] || 0;
                                    tipColor = getHeatColor(val, heatMin, heatMax);
                                }
                                return (
                                    <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem', gap: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            <span style={{ width: 8, height: 8, background: tipColor, borderRadius: '50%', flexShrink: 0 }} />
                                            {s.label}
                                        </span>
                                        <span style={{ color: '#fff', fontWeight: 500 }}>
                                            {(metrics[hoveredPoint.index][s.key] || 0).toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

const MetricsSection = () => {
    const [breakdownDate, setBreakdownDate] = useState(null);
    const [breakdownData, setBreakdownData] = useState(null);
    const [breakdownTotal, setBreakdownTotal] = useState(0);

    // Ratings breakdown state
    const [ratingsBreakdown, setRatingsBreakdown] = useState(null);

    const handleClientBarClick = async (point) => {
        setBreakdownDate(point.date);
        setBreakdownTotal(point.users || 0); // Capture the Users metric from the bar point
        try {
            // Fix: Use adminApi.fetch instead of .get, and correct path if needed
            // Assuming /admin/metrics/daily-breakdown based on history endpoint
            const params = new URLSearchParams({ date: point.date });
            const data = await adminApi.fetch(`/admin/metrics/daily-breakdown?${params}`);
            setBreakdownData(data.breakdown);
        } catch (err) {
            console.error(err);
            // Optional: set empty data or error state
            setBreakdownData({});
        }
    };

    const handleRatingsBarClick = (point) => {
        if (point.count > 0) {
            setRatingsBreakdown({
                date: point.date,
                count: point.count,
                average: point.average,
                breakdown: point.breakdown
            });
        }
    };

    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    📈 Trends Graphs
                </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Clients Graph - FIRST */}
                <ChartCard
                    title="Connected Clients"
                    icon="👥"
                    type="bar"
                    seriesConfig={[
                        { key: 'users', label: 'Total Users', color: '#06b6d4' }
                    ]}
                    showLegend={true}
                    onPointClick={handleClientBarClick}
                />

                {/* Notifications Sent Graph */}
                <ChartCard
                    title="Notifications Sent"
                    icon={<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '1rem' }}>↑</span>}
                    type="line"
                    seriesConfig={[
                        { key: 'notifications', label: 'Total', color: '#8b5cf6' },
                        { key: 'sent', label: 'Sent', color: '#facc15' },
                        { key: 'delivered', label: 'Delivered', color: '#22c55e' },
                        { key: 'read', label: 'Read', color: '#3b82f6' }
                    ]}
                />

                {/* Notifications Received Graph */}
                <ChartCard
                    title="Notifications Received"
                    icon={<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '1rem' }}>↓</span>}
                    type="line"
                    seriesConfig={[
                        { key: 'totalReceived', label: 'Total', color: '#8b5cf6' },
                        { key: 'receivedPending', label: 'Pending', color: '#22c55e' },
                        { key: 'receivedRead', label: 'Read', color: '#3b82f6' }
                    ]}
                />

                {/* Ratings Graph */}
                <RatingsChartCard onPointClick={handleRatingsBarClick} />
            </div>

            {/* Render Popup */}
            {breakdownDate && (
                <DailyBreakdownModal
                    date={breakdownDate}
                    data={breakdownData}
                    totalUsers={breakdownTotal}
                    onClose={() => { setBreakdownDate(null); setBreakdownData(null); }}
                />
            )}

            {/* Ratings Breakdown Modal */}
            {ratingsBreakdown && (
                <RatingsBreakdownModal
                    data={ratingsBreakdown}
                    onClose={() => setRatingsBreakdown(null)}
                />
            )}
        </div>
    );
};

// Ratings Breakdown Modal
const RatingsBreakdownModal = ({ data, onClose }) => {
    const { date, count, average, breakdown } = data;
    const maxRating = Math.max(...Object.values(breakdown), 1);

    const starColors = {
        1: '#ef4444', // Red
        2: '#f97316', // Orange
        3: '#facc15', // Yellow
        4: '#84cc16', // Lime
        5: '#22c55e'  // Green
    };

    return ReactDOM.createPortal(
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '2rem'
            }}
        >
            <div style={{
                background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid #334155',
                borderRadius: '16px', padding: '1.5rem', maxWidth: '400px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>
                            ⭐ Rating Breakdown
                        </h3>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#facc15' }}>{average.toFixed(1)}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Avg Rating</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{count}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total Votes</div>
                    </div>
                </div>

                {/* Rating Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const value = breakdown[star] || 0;
                        const pct = maxRating > 0 ? (value / maxRating) * 100 : 0;
                        return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '1rem' }}>{'⭐'.repeat(1)}</span>
                                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{star}</span>
                                </div>
                                <div style={{ flex: 1, height: '24px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                                    <div style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, ${starColors[star]}99, ${starColors[star]})`,
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{ width: '40px', textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>{value}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
};

// Ratings Chart Card Component (Area Chart with Stars)
const RatingsChartCard = ({ onPointClick }) => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [refreshInterval, setRefreshInterval] = useState(0);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const fetchRatings = async () => {
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/admin/metrics/ratings?days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRatings(data.ratings || []);
            }
        } catch (err) {
            console.error('Failed to load ratings:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchRatings();
    }, [days]);

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(fetchRatings, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, days]);

    // Chart Dimensions
    const chartWidth = 800;
    const chartHeight = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // Add inner padding for the ratings chart too
    const innerPadding = graphWidth / (ratings.length * 2);
    const getX = (i) => innerPadding + (i / (ratings.length - 1 || 1)) * (graphWidth - innerPadding * 2);
    const getY = (val) => graphHeight - ((val / 5) * graphHeight); // Scale 0-5

    // Get color based on rating value (1-5 scale)
    const getRatingColor = (avg) => {
        if (avg >= 4.5) return '#22c55e'; // Green
        if (avg >= 3.5) return '#84cc16'; // Lime
        if (avg >= 2.5) return '#facc15'; // Yellow
        if (avg >= 1.5) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    const renderControls = () => (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                style={{
                    background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                    borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                }}
            >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
            </select>
            <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                style={{
                    background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                    borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                }}
            >
                <option value={0}>Refresh: Off</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
            </select>
        </div>
    );

    if (loading || ratings.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderBottom: '1px solid #334155', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem' }}>App Ratings</h3>
                    </div>
                    {renderControls()}
                </div>
                <div className="card-body" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No ratings data available yet'}
                </div>
            </div>
        );
    }

    // Filter to only show days with data for the area chart
    const hasData = ratings.some(r => r.count > 0);
    const maxY = 5; // Ratings are 1-5

    // Build area path
    const points = ratings.map((r, i) => `${getX(i)},${getY(r.average || 0)}`).join(' ');
    const areaPoints = `0,${graphHeight} ${points} ${graphWidth},${graphHeight}`;

    return (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '8px', backdropFilter: 'blur(8px)' }}>
            {/* Header */}
            <div className="card-header" style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #334155', padding: '0.75rem 1rem', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', fontWeight: 600 }}>App Ratings</h3>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        {renderControls()}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{
                        fontSize: '1.8rem',
                        background: 'linear-gradient(to right, #ef4444, #f97316, #facc15, #84cc16, #22c55e)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>★</span>
                    <span style={{ color: '#94a3b8' }}>Average Rating (1-5)</span>
                </div>
            </div>

            {/* Graph Body */}
            <div className="card-body" style={{ padding: '1rem', overflowX: 'auto', position: 'relative' }}>
                <svg
                    width="100%"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    style={{ minWidth: 600 }}
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <defs>
                        <linearGradient id="ratings-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#facc15" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <g transform={`translate(${padding.left}, ${padding.top})`}>
                        {/* Y-Axis Grid & Labels (1-5 scale) */}
                        {[0, 1, 2, 3, 4, 5].map((val) => {
                            const y = getY(val);
                            return (
                                <g key={val}>
                                    <line x1={0} y1={y} x2={graphWidth} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                                    <text x={-10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">{val}</text>
                                </g>
                            );
                        })}

                        {/* X-Axis Labels */}
                        {ratings.map((r, i) => (
                            <text key={i} x={getX(i)} y={graphHeight + 20} textAnchor="middle" fill="#64748b" fontSize="10">
                                {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                        ))}

                        {/* Area Fill */}
                        {hasData && <polygon points={areaPoints} fill="url(#ratings-gradient)" />}

                        {/* Line */}
                        {hasData && <polyline points={points} fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Data Points - Stars instead of circles */}
                        {ratings.map((r, i) => (
                            <text
                                key={i}
                                x={getX(i)}
                                y={getY(r.average || 0)}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={hoveredPoint?.index === i ? 20 : (r.count > 0 ? 16 : 10)}
                                fill={r.count > 0 ? getRatingColor(r.average) : '#475569'}
                                style={{ transition: 'font-size 0.1s ease, fill 0.2s', cursor: r.count > 0 ? 'pointer' : 'default' }}
                            >
                                ★
                            </text>
                        ))}

                        {/* Hover Overlay Columns */}
                        {ratings.map((r, i) => (
                            <rect
                                key={`hover-col-${i}`}
                                x={getX(i) - (graphWidth / ratings.length) / 2}
                                y={0}
                                width={graphWidth / ratings.length}
                                height={graphHeight}
                                fill="transparent"
                                style={{ cursor: r.count > 0 ? 'pointer' : 'default' }}
                                onMouseMove={(e) => setHoveredPoint({ index: i, x: getX(i), y: e.nativeEvent.offsetY })}
                                onMouseEnter={(e) => setHoveredPoint({ index: i, x: getX(i), y: e.nativeEvent.offsetY })}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPointClick && r.count > 0) onPointClick(r);
                                }}
                            />
                        ))}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && ratings[hoveredPoint.index] && (() => {
                    // Clamp tooltip Y position to prevent cutoff/scroll
                    const tooltipY = Math.max(40, Math.min(chartHeight - 40, hoveredPoint.y ? hoveredPoint.y + padding.top : 60));
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${(hoveredPoint.x + padding.left) / chartWidth * 100}%`,
                            top: `${tooltipY}px`,
                            transform: `translate(${hoveredPoint.index > ratings.length * 0.6 ? 'calc(-100% - 15px)' : '15px'}, -50%)`,
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            zIndex: 20,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, borderBottom: '1px solid #334155', marginBottom: '0.5rem', paddingBottom: '0.2rem', fontSize: '0.9rem' }}>
                                {new Date(ratings[hoveredPoint.index].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem', gap: '1.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                                    <span style={{ width: 8, height: 8, background: '#facc15', borderRadius: '50%' }} />
                                    Avg Rating
                                </span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>
                                    {ratings[hoveredPoint.index].average > 0 ? ratings[hoveredPoint.index].average.toFixed(1) : '-'} ⭐
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', gap: '1.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                                    <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }} />
                                    Votes
                                </span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>
                                    {ratings[hoveredPoint.index].count}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};








export default Observability;
