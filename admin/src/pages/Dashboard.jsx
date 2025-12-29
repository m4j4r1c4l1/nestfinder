import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import AdminMap from '../components/AdminMap';

const Dashboard = ({ onNavigate }) => {
    const [stats, setStats] = useState(null);
    const [points, setPoints] = useState([]);
    const [filteredPoints, setFilteredPoints] = useState(null); // null = show all, array = filtered
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, pointsData] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getPoints()
                ]);
                setStats(statsData.stats);
                setPoints(pointsData.points);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleStatClick = async (type) => {
        try {
            let data, title;
            switch (type) {
                case 'totalPoints':
                    title = 'All Points';
                    data = points.map(p => ({
                        id: p.id,
                        status: p.status,
                        address: p.address || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`,
                        submitter: p.submitter_nickname || 'Anonymous',
                        created: new Date(p.created_at).toLocaleString()
                    }));
                    break;
                case 'activeUsers':
                    title = 'Active Users (Last 7 Days)';
                    const usersData = await adminApi.getUsers();
                    const now = Date.now();
                    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
                    data = usersData.users
                        .filter(u => new Date(u.last_active).getTime() > weekAgo)
                        .map(u => ({
                            id: u.id.substring(0, 8) + '...',
                            nickname: u.nickname || 'Anonymous',
                            points: u.points_count,
                            actions: u.actions_count,
                            lastActive: new Date(u.last_active).toLocaleString()
                        }));
                    break;
                case 'todayReports':
                    title = 'New Reports Today';
                    const today = new Date().toDateString();
                    data = points
                        .filter(p => new Date(p.created_at).toDateString() === today)
                        .map(p => ({
                            id: p.id,
                            address: p.address || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`,
                            submitter: p.submitter_nickname || 'Anonymous',
                            time: new Date(p.created_at).toLocaleTimeString()
                        }));
                    break;
                case 'todayActions':
                    title = 'Actions Today';
                    const logsData = await adminApi.getLogs({ limit: 100 });
                    const todayDate = new Date().toDateString();
                    data = logsData.logs
                        .filter(l => new Date(l.created_at).toDateString() === todayDate)
                        .map(l => ({
                            action: l.action,
                            user: l.user_nickname || 'Anonymous',
                            target: l.target_id || '-',
                            time: new Date(l.created_at).toLocaleTimeString()
                        }));
                    break;
                case 'totalUsers':
                    title = 'All Users';
                    const allUsersData = await adminApi.getUsers();
                    data = allUsersData.users.map(u => ({
                        userId: u.id,
                        nickname: u.nickname || 'Anonymous',
                        points: u.points_count,
                        actions: u.actions_count,
                        lastActive: new Date(u.last_active).toLocaleString(),
                        created: new Date(u.created_at).toLocaleString()
                    }));
                    break;
                case 'totalNotifications':
                    title = 'All Notifications';
                    const allNotifs = await adminApi.getNotifications();
                    data = allNotifs.notifications.map(n => ({
                        id: n.id,
                        title: n.title,
                        body: n.body.substring(0, 50) + (n.body.length > 50 ? '...' : ''),
                        read: n.read ? 'Yes' : 'No',
                        created: new Date(n.created_at).toLocaleString()
                    }));
                    break;
                case 'unreadNotifications':
                    title = 'Unread Notifications';
                    const unreadNotifs = await adminApi.getNotifications();
                    data = unreadNotifs.notifications
                        .filter(n => !n.read)
                        .map(n => ({
                            id: n.id,
                            title: n.title,
                            body: n.body.substring(0, 50) + (n.body.length > 50 ? '...' : ''),
                            created: new Date(n.created_at).toLocaleString()
                        }));
                    break;
                case 'totalConfirmations':
                    title = 'All Votes/Confirmations';
                    const confirmsData = await adminApi.getConfirmations();
                    data = confirmsData.confirmations.map(c => ({
                        id: c.id,
                        type: c.type,
                        user: c.user_nickname || 'Anonymous',
                        pointId: c.point_id,
                        location: c.address || `${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)}`,
                        pointStatus: c.point_status,
                        created: new Date(c.created_at).toLocaleString()
                    }));
                    break;
                default:
                    return;
            }
            setModalData({ type, title, data });
        } catch (err) {
            console.error('Failed to fetch details:', err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This will also delete all their points, confirmations, and logs. This action cannot be undone.')) {
            return;
        }

        try {
            await adminApi.deleteUser(userId);
            // Refresh data
            const [statsData, pointsData] = await Promise.all([
                adminApi.getStats(),
                adminApi.getPoints()
            ]);
            setStats(statsData.stats);
            setPoints(pointsData.points);
            setModalData(null);
            alert('User deleted successfully');
        } catch (err) {
            alert('Failed to delete user: ' + (err.message || 'Unknown error'));
        }
    };

    const handleStatusFilter = (status) => {
        const filtered = points.filter(p => p.status === status);
        setFilteredPoints(filtered);
        // Scroll to map
        document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
    };

    const handleClearFilter = () => {
        setFilteredPoints(null);
    };

    if (loading) return <div className="flex-center" style={{ height: '100%' }}>Loading dashboard...</div>;

    const confirmed = points.filter(p => p.status === 'confirmed').length;
    const pending = points.filter(p => p.status === 'pending').length;
    const deactivated = points.filter(p => p.status === 'deactivated').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Dashboard Overview</h2>

            {/* Main Content: Map + Right Sidebar */}
            <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>

                {/* Map - Left side, takes most width */}
                <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>🗺️ Global Activity Map</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {filteredPoints && (
                                <button
                                    onClick={handleClearFilter}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                    Clear Filter ({filteredPoints.length} points)
                                </button>
                            )}
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                {(filteredPoints || points).length} {filteredPoints ? 'filtered' : 'total'} points
                            </span>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <AdminMap points={filteredPoints || points} filteredPoints={filteredPoints} />
                    </div>
                </div>

                {/* Right Sidebar - Metrics + Status */}
                <div style={{ flex: 1, minWidth: '280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Metrics */}
                    <div className="card" style={{ flex: 1 }}>
                        <div className="card-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontWeight: 600 }}>📈 Activity Metrics</span>
                        </div>
                        <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <MetricRow label="Total Points" value={stats.totalPoints} onClick={() => handleStatClick('totalPoints')} color="var(--color-primary)" />
                            <MetricRow label="Active Users (7d)" value={stats.activeUsers} onClick={() => handleStatClick('activeUsers')} color="var(--color-confirmed)" />
                            <MetricRow label="New Reports Today" value={stats.todaySubmissions} onClick={() => handleStatClick('todayReports')} color="var(--color-pending)" />
                            <MetricRow label="Actions Today" value={stats.todayActions} onClick={() => handleStatClick('todayActions')} color="var(--color-accent)" />
                        </div>
                    </div>

                    {/* Database Totals */}
                    <div className="card" style={{ flex: 1 }}>
                        <div className="card-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontWeight: 600 }}>💾 Database Totals</span>
                        </div>
                        <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <MetricRow label="Total Users" value={stats.totalUsers} onClick={() => handleStatClick('totalUsers')} color="#3b82f6" />
                            <MetricRow label="Total Notifications" value={stats.totalNotifications} onClick={() => handleStatClick('totalNotifications')} color="#8b5cf6" />
                            <MetricRow label="Unread Messages" value={stats.unreadNotifications} onClick={() => handleStatClick('unreadNotifications')} color="#f59e0b" />
                            <MetricRow label="Total Votes" value={stats.totalConfirmations} onClick={() => handleStatClick('totalConfirmations')} color="#10b981" />
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="card" style={{ flex: 1 }}>
                        <div className="card-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontWeight: 600 }}>📊 Status Summary</span>
                        </div>
                        <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <StatusRow label="Confirmed" count={confirmed} total={stats.totalPoints} color="var(--color-confirmed)" icon="✅" onClick={() => handleStatusFilter('confirmed')} />
                            <StatusRow label="Pending" count={pending} total={stats.totalPoints} color="var(--color-pending)" icon="⏳" onClick={() => handleStatusFilter('pending')} />
                            <StatusRow label="Deactivated" count={deactivated} total={stats.totalPoints} color="var(--color-deactivated)" icon="❌" onClick={() => handleStatusFilter('deactivated')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalData && (
                <Modal title={modalData.title} onClose={() => setModalData(null)}>
                    {modalData.data.length === 0 ? (
                        <p className="text-muted text-center">No data available</p>
                    ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                        {Object.keys(modalData.data[0]).map(key => (
                                            <th key={key} style={{ padding: '0.5rem', textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </th>
                                        ))}
                                        {modalData.type === 'totalUsers' && (
                                            <th style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}>Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalData.data.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            {Object.values(row).map((val, j) => (
                                                <td key={j} style={{ padding: '0.5rem' }}>{val}</td>
                                            ))}
                                            {modalData.type === 'totalUsers' && (
                                                <td style={{ padding: '0.5rem' }}>
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            padding: '0.25rem 0.5rem',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        onClick={() => handleDeleteUser(row.userId)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

// Compact metric row (clickable)
const MetricRow = ({ label, value, onClick, color }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.6rem 0.75rem',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            borderLeft: `3px solid ${color}`
        }}
        onMouseEnter={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-secondary)') : undefined}
        onMouseLeave={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-tertiary)') : undefined}
    >
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</span>
    </div>
);

// Status row with progress bar
const StatusRow = ({ label, count, total, color, icon, onClick }) => {
    const percent = total > 0 ? (count / total * 100).toFixed(0) : 0;
    return (
        <div
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                padding: onClick ? '0.5rem' : '0',
                borderRadius: 'var(--radius-md)',
                transition: 'background 0.2s ease'
            }}
            onMouseEnter={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-secondary)') : undefined}
            onMouseLeave={onClick ? (e => e.currentTarget.style.background = 'transparent') : undefined}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span>{icon}</span>
                    {label}
                </span>
                <span style={{ fontWeight: 600, color }}>{count}</span>
            </div>
            <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: color, transition: 'width 0.3s ease' }}></div>
            </div>
        </div>
    );
};

// Modal
const Modal = ({ title, onClose, children }) => (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
    >
        <div
            className="card"
            style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
        >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
            </div>
            <div className="card-body">{children}</div>
        </div>
    </div>
);

export default Dashboard;
