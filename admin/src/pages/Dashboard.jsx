import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api';
import AdminMap from '../components/AdminMap';

const Dashboard = ({ onNavigate }) => {
    const [stats, setStats] = useState(null);
    const [points, setPoints] = useState([]);
    const [filteredPoints, setFilteredPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState(null);
    const [showDBManager, setShowDBManager] = useState(false);
    const [resultModal, setResultModal] = useState(null); // { type, title, message }
    const [isRestoring, setIsRestoring] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message: string }
    const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }
    const [successModal, setSuccessModal] = useState(null); // { title, message, onOk }

    const showToast = (type, message) => setToast({ type, message });
    const closeToast = () => setToast(null);

    const clickCountRef = useRef(0);
    const clickTimeoutRef = useRef(null);

    // Triple-click handler for DB Size row - opens DB Manager Modal
    const handleDBSizeClick = () => {
        clickCountRef.current += 1;

        if (clickCountRef.current === 3) {
            setShowDBManager(true);
            clickCountRef.current = 0;
        }

        // Reset if too slow (1 second pause resets)
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = setTimeout(() => {
            clickCountRef.current = 0;
        }, 1000);
    };

    // Handler for DB Manager result modals
    const handleDBManagerResult = (type, title, message) => {
        setResultModal({ type, title, message });
    };

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

    const handleDeletePoint = async (pointId) => {
        if (!window.confirm('Are you sure you want to permanently delete this point? This cannot be undone.')) {
            return;
        }

        try {
            await adminApi.deletePoint(pointId);
            // Update local state directly to be snappy
            setPoints(points.filter(p => p.id !== pointId));
            if (filteredPoints) {
                setFilteredPoints(filteredPoints.filter(p => p.id !== pointId));
            }
            // Also refresh stats implicitly or just decr count? Refreshing is safer.
            const statsData = await adminApi.getStats();
            setStats(statsData.stats);
        } catch (err) {
            alert('Failed to delete point: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '100%' }}>Loading dashboard...</div>;

    if (!stats) return (
        <div style={{ padding: '2rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Unable to load dashboard</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
                There was a problem communicating with the server. It might be restarting, or your session may have expired.
            </p>
            <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
                style={{ padding: '0.75rem 1.5rem' }}
            >
                Retry Connection
            </button>
        </div>
    );

    const confirmed = points.filter(p => p.status === 'confirmed').length;
    const pending = points.filter(p => p.status === 'pending').length;
    const deactivated = points.filter(p => p.status === 'deactivated').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', padding: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>🐥 Dashboard Overview</h2>

            {/* Main Content: Map + Right Sidebar */}
            <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>

                {/* Map - Left side, takes most width */}
                <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>🗺️ Global Activity Map</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Debug Logs button moved or removed - relying on new DB Manager */}
                            {filteredPoints && (
                                <button
                                    onClick={handleClearFilter}
                                    className="btn"
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.8rem',
                                        background: 'var(--color-primary)',
                                        color: 'white'
                                    }}
                                >
                                    ✕ Show All Points
                                </button>
                            )}
                            <span style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                padding: '0 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '28px',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                userSelect: 'none'
                            }}>
                                {filteredPoints ? `Filtered: ${filteredPoints.length}` : `Total: ${points.length}`}
                            </span>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <AdminMap
                            points={filteredPoints || points}
                            filteredPoints={filteredPoints}
                            onDelete={handleDeletePoint}
                        />
                    </div>
                </div>

                {/* Right Sidebar - Metrics + Status */}
                <div style={{ flex: 1, minWidth: '280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

                    {/* 1. Activity Metrics - 4 rows + 1.6 header overhead = 5.6 */}
                    <div className="card" style={{ flex: 5.6, display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header" style={{ padding: '0.5rem 0.75rem', minHeight: 'auto', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📈 Activity Metrics</span>
                        </div>
                        <div className="card-body" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                            <MetricRow label="Total Points" value={stats.totalPoints} onClick={() => handleStatClick('totalPoints')} color="var(--color-primary)" />
                            <MetricRow label="Active Users (7d)" value={stats.activeUsers} onClick={() => handleStatClick('activeUsers')} color="var(--color-confirmed)" />
                            <MetricRow label="New Reports Today" value={stats.todaySubmissions} onClick={() => handleStatClick('todayReports')} color="var(--color-pending)" />
                            <MetricRow label="Actions Today" value={stats.todayActions} onClick={() => handleStatClick('todayActions')} color="var(--color-accent)" />
                        </div>
                    </div>

                    {/* 2. Status Summary - 3 rows + 1.6 overhead = 4.6 */}
                    <div className="card" style={{ flex: 4.6, display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header" style={{ padding: '0.5rem 0.75rem', minHeight: 'auto', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📊 Status Summary</span>
                            {filteredPoints && (
                                <button
                                    onClick={handleClearFilter}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}
                                >
                                    Show All
                                </button>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: '0.35rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                            <StatusRow label="Confirmed" count={confirmed} total={stats.totalPoints} color="var(--color-confirmed)" icon="✅" onClick={() => handleStatusFilter('confirmed')} />
                            <StatusRow label="Pending" count={pending} total={stats.totalPoints} color="var(--color-pending)" icon="⏳" onClick={() => handleStatusFilter('pending')} />
                            <StatusRow label="Deactivated" count={deactivated} total={stats.totalPoints} color="var(--color-deactivated)" icon="❌" onClick={() => handleStatusFilter('deactivated')} />
                        </div>
                    </div>

                    {/* 3. Database Metrics - 5 rows + 1.6 overhead = 6.6. Backup adds ~1 row -> 7.6 */}
                    <div className="card" style={{ flex: 6.6, display: 'flex', flexDirection: 'column', transition: 'flex 0.3s ease' }}>
                        <div className="card-header" style={{ padding: '0.5rem 0.75rem', minHeight: 'auto', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>💾 Database Metrics</span>
                        </div>
                        <div className="card-body" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, overflow: 'visible' }}>
                            <MetricRow label="Users" value={stats.totalUsers} onClick={() => handleStatClick('totalUsers')} color="#3b82f6" />
                            <MetricRow label="Notifications" value={stats.totalNotifications} onClick={() => handleStatClick('totalNotifications')} color="#8b5cf6" />
                            <MetricRow label="Unread" value={stats.unreadNotifications} onClick={() => handleStatClick('unreadNotifications')} color="#f59e0b" />
                            <MetricRow label="Votes" value={stats.totalConfirmations} onClick={() => handleStatClick('totalConfirmations')} color="#10b981" />
                            <MetricRow label="DB Size" value={stats.dbSizeBytes ? (stats.dbSizeBytes >= 1048576 ? (stats.dbSizeBytes / 1048576).toFixed(2) + ' MB' : (stats.dbSizeBytes / 1024).toFixed(1) + ' KB') : '-'} onClick={handleDBSizeClick} color="#94a3b8" />


                        </div>
                    </div>

                    {/* 4. System Status - Needs more height for 6+ rows. Flex 7.6 ensures visibility. */}
                    <div className="card" style={{ flex: 7.6, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div className="card-header" style={{ padding: '0.5rem 0.75rem', minHeight: 'auto', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🖥️ System Status</span>
                        </div>
                        <div className="card-body" style={{ padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', flex: 1, overflow: 'hidden' }}>
                            {stats.system && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>OS</span>
                                        <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{stats.system.distro || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Host</span>
                                        <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{stats.system.hostname}</span>
                                    </div>
                                    {stats.system.ips && stats.system.ips.length > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Local IP</span>
                                            <div style={{ textAlign: 'right' }}>
                                                {stats.system.ips.map((net, i) => (
                                                    <div key={i} style={{ fontWeight: 500, fontSize: '0.7rem' }}>{net.ip}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Public IP</span>
                                        <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>{stats.system.publicIp || 'Unknown'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Uptime</span>
                                        <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                            {(() => {
                                                const u = stats.system.uptime || 0;
                                                const h = Math.floor(u / 3600);
                                                const m = Math.floor((u % 3600) / 60);
                                                if (h > 0) return `${h}h ${m}m`;
                                                return `${m}m`;
                                            })()}
                                        </span>
                                    </div>

                                    {/* Memory Usage */}
                                    <div style={{ marginTop: '0.2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginBottom: '0.1rem' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Memory</span>
                                            <span style={{ fontWeight: 500 }}>
                                                {Math.round(stats.system.memoryUsage.rss / 1024 / 1024)}MB /
                                                {Math.round(stats.system.totalMemory / 1024 / 1024 / 1024)}GB
                                            </span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--color-bg-tertiary)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                                            <div style={{
                                                width: `${(stats.system.memoryUsage.rss / stats.system.totalMemory) * 100}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                                            }}></div>
                                        </div>
                                    </div>

                                    {/* Disk Usage (if available) */}
                                    {stats.system.disk && (
                                        <div style={{ marginTop: '0.2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginBottom: '0.1rem' }}>
                                                <span style={{ color: 'var(--color-text-secondary)' }}>Disk (/)</span>
                                                <span style={{ fontWeight: 500 }}>
                                                    {Math.round(stats.system.disk.used / 1024 / 1024 / 1024)}GB /
                                                    {Math.round(stats.system.disk.total / 1024 / 1024 / 1024)}GB
                                                </span>
                                            </div>
                                            <div style={{ height: 4, background: 'var(--color-bg-tertiary)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                                                <div style={{
                                                    width: `${(stats.system.disk.used / stats.system.disk.total) * 100}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #8b5cf6, #d946ef)'
                                                }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Heap Memory */}
                                    <div style={{ marginTop: '0.2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginBottom: '0.1rem' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Heap</span>
                                            <span style={{ fontWeight: 500 }}>
                                                {Math.round(stats.system.memoryUsage.heapUsed / 1024 / 1024)}MB /
                                                {Math.round(stats.system.memoryUsage.heapTotal / 1024 / 1024)}MB
                                            </span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--color-bg-tertiary)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                                            <div style={{
                                                width: `${(stats.system.memoryUsage.heapUsed / stats.system.memoryUsage.heapTotal) * 100}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                            }}></div>
                                        </div>
                                    </div>

                                    {/* Load Average */}
                                    {stats.system.loadAvg && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Load Avg</span>
                                            <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                                {stats.system.loadAvg.map(l => l.toFixed(2)).join(' / ')}
                                            </span>
                                        </div>
                                    )}


                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {
                modalData && (
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
                )
            }

            {/* Toast notification for DB operations */}
            {toast && (
                <Toast type={toast.type} message={toast.message} onClose={closeToast} />
            )}

            {/* Confirmation modal for dangerous actions */}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={confirmModal.onCancel}
                />
            )}

            {/* Success Modal (Calmful) */}
            {successModal && (
                <SuccessModal
                    title={successModal.title}
                    message={successModal.message}
                    onOk={successModal.onOk}
                />
            )}

            {/* DB Manager Modal */}
            {showDBManager && (
                <DBManagerModal
                    onClose={() => setShowDBManager(false)}
                    onResult={handleDBManagerResult}
                />
            )}

            {/* Result Modal (for DB operations) */}
            {resultModal && (
                <ResultModal
                    type={resultModal.type}
                    title={resultModal.title}
                    message={resultModal.message}
                    onOk={() => setResultModal(null)}
                />
            )}
        </div >
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
            padding: '0.25rem 0.5rem',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            borderLeft: `3px solid ${color}`,
            flex: '1 1 auto', // Allow growing and shrinking
            minHeight: '32px', // Minimum height to prevent total collapse
            userSelect: 'none'
        }}
        onMouseEnter={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-secondary)') : undefined}
        onMouseLeave={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-tertiary)') : undefined}
    >
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color }}>{value}</span>
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
                padding: '0.25rem 0.5rem',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${color}`,
                transition: 'background 0.2s ease'
            }}
            onMouseEnter={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-secondary)') : undefined}
            onMouseLeave={onClick ? (e => e.currentTarget.style.background = 'var(--color-bg-tertiary)') : undefined}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: color,
                        display: 'inline-block'
                    }}></span>
                    {label}
                </span>
                <span style={{ fontWeight: 600, color, fontSize: '0.85rem' }}>{count}</span>
            </div>
            <div style={{ height: 3, background: 'var(--color-bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
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
            style={{ width: '90%', maxWidth: '900px', maxHeight: '80vh', overflow: 'hidden' }}
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

// Toast notification for feedback messages
const Toast = ({ type, message, onClose }) => {
    const colors = {
        success: { bg: 'rgba(16, 185, 129, 0.95)', icon: '🦄' },
        error: { bg: 'rgba(239, 68, 68, 0.95)', icon: '🙈' },
        info: { bg: 'rgba(59, 130, 246, 0.95)', icon: 'ℹ️' }
    };
    const { bg, icon } = colors[type] || colors.info;

    // Auto-dismiss after 4 seconds
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            style={{
                position: 'fixed',
                top: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: bg,
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 2000,
                animation: 'slideIn 0.3s ease',
                maxWidth: '400px',
                whiteSpace: 'nowrap'
            }}
        >
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{icon}</span>
            <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    flexShrink: 0
                }}
            >
                ×
            </button>
        </div>
    );
};

// Confirmation modal for dangerous actions
const ConfirmModal = ({ title = "Confirm Action", message, onConfirm, onCancel }) => (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            backdropFilter: 'blur(6px)'
        }}
        onClick={onCancel}
    >
        <div
            className="card"
            style={{
                width: '90%',
                maxWidth: '450px',
                overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
        >
            <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠️</span> {title}
                </h3>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
                <p>{message}</p>
            </div>
            <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
            }}>
                <button
                    className="btn"
                    onClick={onCancel}
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)',
                        padding: '0.5rem 1rem'
                    }}
                >
                    Cancel
                </button>
                <button
                    className="btn"
                    onClick={onConfirm}
                    style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '0.5rem 1rem'
                    }}
                >
                    Yes, Proceed
                </button>
            </div>
        </div>
    </div>
);

// Success Modal (Calmful aesthetic)
const SuccessModal = ({ title, message, onOk }) => (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1600,
            backdropFilter: 'blur(8px)'
        }}
    >
        <div
            className="card"
            style={{
                width: '90%',
                maxWidth: '420px',
                textAlign: 'center',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                animation: 'slideIn 0.3s ease-out'
            }}
        >
            <div className="card-body" style={{ padding: '2.5rem 2rem' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <span style={{ fontSize: '2rem' }}>✨</span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>{title}</h3>
                <p style={{ margin: '0 0 2rem 0', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{message}</p>

                <button
                    className="btn btn-primary"
                    onClick={onOk}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}
                >
                    Excellent, Reload App
                </button>
            </div>
        </div>
    </div>
);

// Calm Result Modal (for success/error/warning outcomes)
const ResultModal = ({ type = 'success', title, message, onOk, buttonText = 'OK' }) => {
    const configs = {
        success: { icon: '✨', iconBg: 'rgba(16, 185, 129, 0.1)', btnBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        error: { icon: '🙊', iconBg: 'rgba(239, 68, 68, 0.1)', btnBg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' },
        warning: { icon: '⚠️', iconBg: 'rgba(245, 158, 11, 0.1)', btnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
    };
    const config = configs[type] || configs.success;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1700,
                backdropFilter: 'blur(8px)'
            }}
        >
            <div
                className="card"
                style={{
                    width: '90%',
                    maxWidth: '420px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    animation: 'slideIn 0.3s ease-out'
                }}
            >
                <div className="card-body" style={{ padding: '2.5rem 2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: config.iconBg,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <span style={{ fontSize: '2rem' }}>{config.icon}</span>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>{title}</h3>
                    <p style={{ margin: '0 0 2rem 0', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{message}</p>

                    <button
                        className="btn btn-primary"
                        onClick={onOk}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            fontSize: '1rem',
                            background: config.btnBg,
                            border: 'none',
                            borderRadius: 'var(--radius-md)'
                        }}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Database Manager Modal
const DBManagerModal = ({ onClose, onResult }) => {
    const [files, setFiles] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(null);
    const [usage, setUsage] = React.useState(null);
    const [backupSchedule, setBackupSchedule] = React.useState({ enabled: false, intervalHours: 24 });
    const [scheduleInput, setScheduleInput] = React.useState('24');
    const [deleteConfirm, setDeleteConfirm] = React.useState(null); // { filename }

    // Sorting
    const [sortConfig, setSortConfig] = React.useState({ column: 'modified', direction: 'desc' });

    // Column widths
    const STORAGE_KEY = 'nestfinder_db_cols';
    const DEFAULT_WIDTHS = { name: 300, size: 90, modified: 150, type: 100, actions: 120 };
    const [colWidths, setColWidths] = React.useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...DEFAULT_WIDTHS, ...JSON.parse(saved) } : DEFAULT_WIDTHS;
        } catch { return DEFAULT_WIDTHS; }
    });

    // Resizing
    const [resizing, setResizing] = React.useState(null);

    React.useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths)); } catch { }
    }, [colWidths]);

    React.useEffect(() => {
        if (!resizing) return;
        const handleMouseMove = (e) => {
            const delta = e.clientX - resizing.startX;
            const newLeftWidth = Math.max(50, resizing.startLeftWidth + delta);
            const newRightWidth = Math.max(50, resizing.startRightWidth - delta);
            if (newLeftWidth >= 50 && newRightWidth >= 50) {
                setColWidths(prev => ({ ...prev, [resizing.leftCol]: newLeftWidth, [resizing.rightCol]: newRightWidth }));
            }
        };
        const handleMouseUp = () => setResizing(null);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const [filesRes, scheduleRes] = await Promise.all([
                adminApi.getDBFiles(),
                adminApi.getBackupSchedule()
            ]);
            setFiles(filesRes.files || []);
            setUsage(filesRes.usage || null);
            setBackupSchedule(scheduleRes);
            setScheduleInput(String(scheduleRes.intervalHours || 0));
        } catch (err) {
            onResult('error', 'Load Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { loadFiles(); }, []);

    const formatSize = (bytes) => {
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        return (bytes / 1024).toFixed(1) + ' KB';
    };

    const formatDate = (isoDate) => {
        const d = new Date(isoDate);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getTypeBadge = (type) => {
        const badges = {
            active: { label: 'Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
            corrupt: { label: 'Corrupt', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
            restore_backup: { label: 'Backup', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
            uploaded: { label: 'Uploaded', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
            scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
            other: { label: 'Other', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' }
        };
        const b = badges[type] || badges.other;
        return (
            <span style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: b.color,
                background: b.bg,
                whiteSpace: 'nowrap'
            }}>
                {b.label}
            </span>
        );
    };

    const handleDownload = async (filename) => {
        setActionLoading(filename);
        try {
            await adminApi.downloadDBFile(filename);
            onResult('success', 'Download Complete', `"${filename}" has been downloaded.`);
        } catch (err) {
            onResult('error', 'Download Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        const filename = deleteConfirm.filename;
        setDeleteConfirm(null);
        setActionLoading(filename);
        try {
            await adminApi.deleteDBFile(filename);
            onResult('success', 'File Deleted', `"${filename}" has been deleted.`);
            loadFiles();
        } catch (err) {
            onResult('error', 'Delete Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestore = async (filename) => {
        if (!window.confirm(`Restore from "${filename}"?\n\nThe current database will be backed up first. The server may restart.`)) return;
        setActionLoading(filename);
        try {
            const res = await adminApi.restoreFromFile(filename);
            onResult('success', 'Restore Complete', res.message || 'Database restored successfully!');
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            onResult('error', 'Restore Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setActionLoading('upload');
        try {
            const res = await adminApi.uploadDBFile(file);
            onResult('success', 'Upload Complete', `File saved as "${res.filename}"`);
            loadFiles();
        } catch (err) {
            onResult('error', 'Upload Failed', err.message);
        } finally {
            setActionLoading(null);
            e.target.value = '';
        }
    };

    const handleSetSchedule = async () => {
        const hours = parseInt(scheduleInput, 10) || 0;
        setActionLoading('schedule');
        try {
            const res = await adminApi.setBackupSchedule(hours);
            setBackupSchedule({ enabled: res.enabled, intervalHours: res.intervalHours });
            onResult('success', 'Schedule Updated', res.message);
        } catch (err) {
            onResult('error', 'Schedule Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBackupNow = async () => {
        setActionLoading('backup-now');
        try {
            const res = await adminApi.createBackupNow();
            onResult('success', 'Backup Created', `Created "${res.filename}"`);
            loadFiles();
        } catch (err) {
            onResult('error', 'Backup Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSort = (column) => {
        setSortConfig(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedFiles = React.useMemo(() => {
        const sorted = [...files];
        sorted.sort((a, b) => {
            let aVal, bVal;
            switch (sortConfig.column) {
                case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                case 'size': aVal = a.size; bVal = b.size; break;
                case 'modified': aVal = new Date(a.modified).getTime(); bVal = new Date(b.modified).getTime(); break;
                case 'type': aVal = a.type; bVal = b.type; break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [files, sortConfig]);

    const stats = React.useMemo(() => {
        if (!files.length) return null;
        const sorted = [...files].sort((a, b) => new Date(a.modified) - new Date(b.modified));
        return {
            oldest: sorted[0],
            newest: sorted[sorted.length - 1]
        };
    }, [files]);

    const ResizeHandle = ({ leftCol, rightCol }) => (
        <div
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                zIndex: 20
            }}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setResizing({ leftCol, rightCol, startX: e.clientX, startLeftWidth: colWidths[leftCol], startRightWidth: colWidths[rightCol] });
            }}
        />
    );

    const SortIndicator = ({ column }) => {
        if (sortConfig.column !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return <span style={{ marginLeft: '4px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <React.Fragment>
            <div
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, backdropFilter: 'blur(6px)'
                }}
                onClick={onClose}
            >
                <div
                    className="card"
                    style={{
                        width: '95%', maxWidth: '900px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        cursor: resizing ? 'col-resize' : 'default', userSelect: resizing ? 'none' : 'auto'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', padding: '1rem 1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>💾</span> Database Manager</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
                    </div>

                    {/* Toolbar */}
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem', background: 'var(--color-bg-tertiary)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => document.getElementById('db-manager-upload').click()} disabled={actionLoading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>📤 Upload File</button>
                        <input type="file" id="db-manager-upload" accept=".db,.sqlite,.sqlite3" style={{ display: 'none' }} onChange={handleFileUpload} />

                        <button className="btn" onClick={handleBackupNow} disabled={actionLoading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>📦 Backup Now</button>

                        <button className="btn" onClick={loadFiles} disabled={loading} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-bg-secondary)', borderRadius: '9999px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>REFRESH</button>

                        <div style={{ flex: 1 }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Auto backup every</span>
                            <input type="number" min="0" max="168" value={scheduleInput} onChange={e => setScheduleInput(e.target.value)} style={{ width: '50px', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'inherit', textAlign: 'center' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>hrs</span>
                            <button className="btn" onClick={handleSetSchedule} disabled={actionLoading === 'schedule'} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-bg-secondary)', borderRadius: '9999px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>SET</button>
                            {backupSchedule.enabled && <span style={{ fontSize: '0.75rem', color: '#22c55e', marginLeft: '0.25rem' }}>●</span>}
                        </div>
                    </div>

                    {/* File List Table */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '0', background: 'var(--color-bg-primary)' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading files...</div>
                        ) : files.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No database files found</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: Object.values(colWidths).reduce((a, b) => a + b, 0) + 'px' }}>
                                <thead style={{ background: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        {[
                                            { key: 'name', label: 'Name', left: 'name', right: 'size' },
                                            { key: 'size', label: 'Size', left: 'size', right: 'modified' },
                                            { key: 'modified', label: 'Modified', left: 'modified', right: 'type' },
                                            { key: 'type', label: 'Type', left: 'type', right: 'actions' },
                                            { key: 'actions', label: 'Actions', left: 'actions', right: null }
                                        ].map(col => (
                                            <th key={col.key}
                                                style={{
                                                    width: colWidths[col.key],
                                                    padding: '0.75rem 1rem',
                                                    textAlign: col.key === 'name' ? 'left' : 'center',
                                                    color: '#94a3b8',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    position: 'relative',
                                                    userSelect: 'none',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #334155'
                                                }}
                                                onClick={() => handleSort(col.key)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.key === 'name' ? 'flex-start' : 'center' }}>
                                                    {col.label}
                                                    <SortIndicator column={col.key} />
                                                </div>
                                                {col.right && <ResizeHandle leftCol={col.left} rightCol={col.right} />}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFiles.map(file => (
                                        <tr key={file.name} style={{ borderBottom: '1px solid var(--color-border)', background: 'transparent' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>{file.name}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>{formatSize(file.size)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem', borderBottom: '1px solid var(--color-border)' }}>{formatDate(file.modified)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>{getTypeBadge(file.type)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(file.name); }} title="Download" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>📥</button>
                                                    {file.type !== 'active' && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleRestore(file.name); }} title="Restore" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>♻️</button>
                                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ filename: file.name }); }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Usage Footer */}
                    {/* Expanded Stats & Status Footer */}
                    <div style={{ padding: '0.75rem 1.5rem', background: 'var(--color-bg-tertiary)', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                        {/* Backup Status Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span>🗓️ Last Backup: {backupSchedule.lastBackupTime ? formatDate(backupSchedule.lastBackupTime) : 'Never'}</span>
                                {backupSchedule.lastBackupTime && (
                                    <span style={{
                                        color: backupSchedule.lastBackupStatus?.startsWith('Fail') ? '#ef4444' : '#22c55e',
                                        fontWeight: 600,
                                        background: backupSchedule.lastBackupStatus?.startsWith('Fail') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem'
                                    }}>
                                        {backupSchedule.lastBackupStatus === 'Success' ? 'SUCCESS' : 'FAILED'}
                                    </span>
                                )}
                            </div>
                            {backupSchedule.enabled && (
                                <span title="Next estimated backup time">🔜 Next: <span style={{ color: 'var(--color-text-primary)' }}>{backupSchedule.nextBackup ? formatDate(backupSchedule.nextBackup) : 'Pending...'}</span></span>
                            )}
                        </div>

                        {/* File & Disk Stats */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{files.length} Files</span>
                                <span>•</span>
                                <span>{usage ? formatSize(usage.folderSize) : '0 B'}</span>
                                {stats && (
                                    <>
                                        <span>•</span>
                                        <span style={{ opacity: 0.8 }} title={`Oldest: ${formatDate(stats.oldest.modified)}\nNewest: ${formatDate(stats.newest.modified)}`}>
                                            Range: {new Date(stats.oldest.modified).toLocaleDateString()} — {new Date(stats.newest.modified).toLocaleDateString()}
                                        </span>
                                    </>
                                )}
                            </div>
                            {usage?.disk?.total > 0 && <span>Disk: {formatSize(usage.disk.used)} / {formatSize(usage.disk.total)}</span>}
                        </div>

                        {usage?.disk?.total > 0 && (
                            <div style={{ height: '4px', background: 'var(--color-bg-secondary)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.1rem' }}>
                                <div style={{ width: `${Math.min(100, (usage.disk.used / usage.disk.total) * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '2px' }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1600, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', textAlign: 'center', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Delete Database File?</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete <br /><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{deleteConfirm.filename}</span>?
                            <br /><br />This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'var(--color-bg-secondary)' }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleDelete} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', border: 'none' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default Dashboard;
