import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api';

const BackupProgressModal = ({ sections = [], onClose, onResult }) => {
    const allTasks = sections.flatMap(s => s.tasks);
    const isRunning = allTasks.some(t => t.status === 'running');
    const isError = allTasks.some(t => t.status === 'error');
    const isSuccess = !isRunning && !isError && allTasks.length > 0;

    const handleDismiss = () => {
        onClose();
        if (isSuccess && onResult) {
            onResult('success', 'Backup Complete', 'Database backup and archiving finished successfully.');
        } else if (isError && onResult) {
            onResult('error', 'Backup Failed', 'Some tasks encountered errors. Please check system logs.');
        }
    };

    const getMonkeyIcon = (progress, status) => {
        if (status === 'error') return '❌';
        if (status === 'pending') return '...';

        // Only show tick when progress is 100 AND status is success
        if ((progress || 0) >= 100 || status === 'success') {
            return <span style={{ fontSize: '1.2rem', color: '#22c55e', fontWeight: 'bold' }}>✓</span>;
        }

        // Running logic: 0-24 🐵, 25-49 🙉, 50-74 🙊, 75-99 🙈
        const p = progress || 0;
        if (p >= 75) return '🙈';
        if (p >= 50) return '🙊';
        if (p >= 25) return '🙉';
        return '🐵';
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '2rem',
                width: '90%',
                maxWidth: '550px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.3s ease-out',
                display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
                <div style={{ textAlign: 'center', fontSize: '3.5rem', marginBottom: '-0.5rem' }}>⚗️</div>

                <h3 style={{ margin: 0, textAlign: 'center', fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                    Starting the Backup process:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {sections.map((section, sIdx) => (
                        <div key={section.id || sIdx}>
                            <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                                {section.title}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--color-border)' }}>
                                {section.tasks.map((task, tIdx) => (
                                    <div key={task.id || tIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                        <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {task.name}
                                        </span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {/* Only show progress bar if task is still running or has meaningful progress */}
                                            {(task.status === 'running' || (task.progress > 0 && task.progress < 100)) && (
                                                <div style={{
                                                    width: '100px', height: '8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${task.progress || 0}%`,
                                                        background: task.status === 'error' ? '#ef4444' : '#3b82f6',
                                                        transition: 'width 0.3s ease-out'
                                                    }} />
                                                </div>
                                            )}

                                            <div style={{ width: '28px', textAlign: 'center', fontSize: '1.2rem', lineHeight: 1 }}>
                                                {getMonkeyIcon(task.progress, task.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <button
                        className="btn"
                        onClick={handleDismiss}
                        disabled={isRunning}
                        style={{
                            background: isSuccess ? '#22c55e' : (isError ? 'var(--color-error)' : 'var(--color-primary)'),
                            color: 'white',
                            padding: '0.75rem 3rem',
                            borderRadius: '6px',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            opacity: isRunning ? 0.5 : 1,
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        {isError ? 'Close' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};
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
                    </div>


                    <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                    animation: 'slideIn 0.3s ease-out',
                    background: '#1e293b'
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
    const [backupSchedule, setBackupSchedule] = React.useState({ enabled: false, time: '', intervalDays: 1 });
    const [scheduleTime, setScheduleTime] = React.useState('03:00');
    const [scheduleInterval, setScheduleInterval] = React.useState('1');
    const [scheduleStartDate, setScheduleStartDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [backupEnabled, setBackupEnabled] = React.useState(false);
    const [backupRetention, setBackupRetention] = React.useState('30');
    const [corruptRetention, setCorruptRetention] = React.useState('30');
    const [uploadRetention, setUploadRetention] = React.useState('30');
    const [uploadProgress, setUploadProgress] = React.useState(null);
    const [downloadProgress, setDownloadProgress] = React.useState(null);

    const [deleteConfirm, setDeleteConfirm] = React.useState(null); // { filename }
    const [selectedFiles, setSelectedFiles] = React.useState(new Set()); // Set of filenames for bulk delete
    const [resultModal, setResultModal] = React.useState(null); // { title, message, type }
    const [currentTime, setCurrentTime] = React.useState(new Date());

    // Live Backup Events (SSE)
    const [backupState, setBackupState] = React.useState({ running: false, sections: [] });
    const backupModalClosedRef = React.useRef(false);
    const wasRunningRef = React.useRef(false);

    React.useEffect(() => {
        const token = localStorage.getItem('nestfinder_admin_token');
        const eventSource = new EventSource(`/api/admin/db/backup-events?token=${token}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // If a new run starts (running=true, progress near 0), un-dismiss
                if (data.running && backupModalClosedRef.current) {
                    // Check if it's actually a new run (first task progress < 100)
                    const hasTasks = data.sections && data.sections.some(s => s.tasks.length > 0);
                    // Naive check: if running and has tasks, likely new.
                    if (hasTasks) {
                        backupModalClosedRef.current = false;
                    }
                }

                if (backupModalClosedRef.current) return;

                if (data.running || (data.sections && data.sections.length > 0)) {
                    setBackupState(data);
                }

                // Detect completion to refresh stats
                if (wasRunningRef.current && !data.running) {
                    loadFiles();
                }
                wasRunningRef.current = data.running;
            } catch (e) {
                console.error('SSE Error:', e);
            }
        };

        return () => eventSource.close();
    }, []);

    const closeBackupModal = () => {
        setBackupState({ running: false, sections: [] });
        backupModalClosedRef.current = true;
    };

    // Live clock for CET/CEST
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Sorting
    const [sortConfig, setSortConfig] = React.useState({ column: 'modified', direction: 'desc' });

    // Column widths
    const STORAGE_KEY = 'nestfinder_db_cols';
    const DEFAULT_WIDTHS = { select: 40, name: 300, size: 90, modified: 150, type: 100, actions: 120 };
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

            if (scheduleRes.enabled && scheduleRes.time) {
                setBackupEnabled(true);
                setScheduleTime(scheduleRes.time);
                setScheduleInterval(String(scheduleRes.intervalDays || 1));
                if (scheduleRes.startDate) setScheduleStartDate(scheduleRes.startDate);
            } else {
                setBackupEnabled(false);
                setScheduleTime('03:00'); // Default
                setScheduleInterval('1');
            }

            if (scheduleRes.retentionDays) setBackupRetention(String(scheduleRes.retentionDays));
            if (scheduleRes.corruptRetentionDays) setCorruptRetention(String(scheduleRes.corruptRetentionDays));
            if (scheduleRes.uploadRetentionDays) setUploadRetention(String(scheduleRes.uploadRetentionDays));
            setSelectedFiles(new Set()); // Clear selection on reload
        } catch (err) {
            onResult('error', 'Load Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadFiles();
    }, []);

    const formatSize = (bytes) => {
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        return (bytes / 1024).toFixed(1) + ' KB';
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: 'Europe/Paris',
            hour12: false,
            timeZoneName: 'short'
        });
    };

    const getTypeBadge = (type) => {
        const badges = {
            active: { label: 'Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
            corrupt: { label: 'Corrupted', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
            restore_backup: { label: 'Restored', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
            uploaded: { label: 'Uploaded', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
            scheduled: { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
            on_demand: { label: 'On Demand', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
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
                whiteSpace: 'nowrap',
                minWidth: '70px',
                display: 'inline-block',
                textAlign: 'center'
            }}>
                {b.label}
            </span>
        );
    };

    const handleDownload = async (filename) => {
        setActionLoading(filename);
        setDownloadProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/admin/db/files/${encodeURIComponent(filename)}/download`);
        xhr.responseType = 'blob';

        const token = localStorage.getItem('nestfinder_admin_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setDownloadProgress(percent);
            }
        };

        xhr.onload = () => {
            setDownloadProgress(null);
            setActionLoading(null);
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                onResult('success', 'Download Complete', `"${filename}" has been downloaded.`);
            } else {
                onResult('error', 'Download Failed', xhr.statusText || 'Server Error');
            }
        };

        xhr.onerror = () => {
            setDownloadProgress(null);
            setActionLoading(null);
            onResult('error', 'Download Failed', 'Network Error');
        };

        xhr.send();
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

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) return;

        try {
            setActionLoading('delete');
            const filesArray = Array.from(selectedFiles);
            const result = await adminApi.deleteBulkBackups(filesArray);

            if (result.success) {
                if (onResult) onResult('success', 'Bulk Delete', result.message);
                if (result.errors) {
                    console.warn('Bulk delete errors:', result.errors);
                }
                loadFiles();
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            if (onResult) onResult('error', 'Bulk Delete Failed', error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSelectFile = (filename) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(filename)) {
            newSet.delete(filename);
        } else {
            newSet.add(filename);
        }
        setSelectedFiles(newSet);
    };

    const handleSelectAll = () => {
        if (selectedFiles.size === sortedFiles.filter(f => f.type !== 'active').length) {
            setSelectedFiles(new Set());
        } else {
            const newSet = new Set();
            sortedFiles.forEach(f => {
                if (f.type !== 'active') newSet.add(f.name);
            });
            setSelectedFiles(newSet);
        }
    };

    const handleRestore = async (filename) => {
        if (!window.confirm(`Restore from "${filename}"?\n\nThe current database will be backed up first. The server may restart.`)) return;
        setActionLoading(filename);
        try {
            const res = await adminApi.restoreFromFile(filename);
            onResult('success', 'Restore Complete', res.message || 'Database restored successfully!');
            loadFiles();
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            onResult('error', 'Restore Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        setActionLoading('upload');
        setUploadProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/db/upload');

        const token = localStorage.getItem('nestfinder_admin_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        };

        xhr.onload = () => {
            setUploadProgress(null);
            setActionLoading(null);
            if (xhr.status === 200) {
                try {
                    const res = JSON.parse(xhr.responseText);
                    onResult('success', 'Upload Complete', `File saved as "${res.filename}"`);
                    loadFiles();
                } catch (e) {
                    onResult('error', 'Upload Failed', 'Invalid server response');
                }
            } else {
                onResult('error', 'Upload Failed', xhr.statusText || 'Server Error');
            }
        };

        xhr.onerror = () => {
            setUploadProgress(null);
            setActionLoading(null);
            onResult('error', 'Upload Failed', 'Network Error');
        };

        xhr.send(file);
    };

    const handleSetSchedule = async () => {
        setActionLoading('schedule');
        try {
            const res = await adminApi.setBackupSchedule(
                scheduleTime,
                parseInt(scheduleInterval, 10),
                scheduleStartDate,
                parseInt(backupRetention, 10),
                parseInt(corruptRetention, 10),
                parseInt(uploadRetention, 10),
                backupEnabled
            );
            setBackupSchedule(res);
            onResult('success', 'Policies Updated', 'Backup schedule and file retention policies have been updated.');
            loadFiles();
        } catch (err) {
            onResult('error', 'Update Failed', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBackupNow = async () => {
        setActionLoading('backup-now');
        try {
            // We await the TRIGGER, but the process is backgrounded on server.
            // Returns immediately with { success: true, filename: ... }
            await adminApi.createBackupNow();
            // We do NOT show a success modal here, handled by SSE.
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
                        width: '95%', maxWidth: '990px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        cursor: resizing ? 'col-resize' : 'default', userSelect: resizing ? 'none' : 'auto'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', padding: '1rem 1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>💾</span> Database Manager</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
                    </div>

                    {/* Unified Control Panel */}
                    <div style={{ background: '#475569', display: 'flex', alignItems: 'stretch', padding: '0.8rem 1rem', margin: '0.8rem', borderRadius: '8px' }}>

                        {/* Top Header: Clock & Actions (Badges) */}


                        {/* Controls Body */}
                        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>

                            {/* Left Side: Toggle Only */}
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                padding: '1rem', width: '70px',
                                borderRight: '1px solid var(--color-border)',
                                background: 'rgba(0,0,0,0.02)'
                            }}>
                                {/* Toggle Switch */}
                                <div
                                    onClick={() => setBackupEnabled(!backupEnabled)}
                                    style={{
                                        width: '145%',
                                        marginLeft: '-45%',
                                        height: '20px',
                                        background: backupEnabled ? '#3b82f6' : '#334155',
                                        borderRadius: '10px',
                                        position: 'relative',
                                        transition: 'background 0.2s',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: '2px',
                                        left: backupEnabled ? 'calc(100% - 18px)' : '2px',
                                        transition: 'left 0.2s'
                                    }} />
                                </div>
                            </div>

                            {/* Right Side: Pickers (Swapped) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'var(--color-bg-primary)', borderRadius: '6px', opacity: backupEnabled ? 1 : 0.5, pointerEvents: backupEnabled ? 'auto' : 'none' }}>
                                {/* Row 1: Scheduling Pickers */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Start:</span>
                                    <input
                                        type="date"
                                        value={scheduleStartDate}
                                        onChange={(e) => setScheduleStartDate(e.target.value)}
                                        style={{
                                            padding: '0.15rem 0.3rem',
                                            background: 'var(--color-bg-primary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>At:</span>
                                    <select
                                        value={scheduleTime.split(':')[0] || '00'}
                                        onChange={(e) => {
                                            const mins = scheduleTime.split(':')[1] || '00';
                                            setScheduleTime(`${e.target.value}:${mins}`);
                                        }}
                                        style={{
                                            padding: '0.15rem 0.3rem',
                                            background: 'var(--color-bg-primary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>:</span>
                                    <select
                                        value={scheduleTime.split(':')[1] || '00'}
                                        onChange={(e) => {
                                            const hrs = scheduleTime.split(':')[0] || '00';
                                            setScheduleTime(`${hrs}:${e.target.value}`);
                                        }}
                                        style={{
                                            padding: '0.15rem 0.3rem',
                                            background: 'var(--color-bg-primary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Every:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={scheduleInterval}
                                        onChange={(e) => setScheduleInterval(e.target.value)}
                                        style={{
                                            width: '50px',
                                            padding: '0.15rem 0.3rem',
                                            background: 'var(--color-bg-primary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.75rem',
                                            textAlign: 'center'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Days</span>
                                </div>

                                {/* Row 2: Retention Policies */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.6rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Retention:</span>
                                        <select
                                            value={backupRetention}
                                            onChange={(e) => setBackupRetention(e.target.value)}
                                            style={{
                                                padding: '0.15rem 0.4rem',
                                                background: 'var(--color-bg-primary)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '4px',
                                                color: 'var(--color-text-primary)',
                                                fontSize: '0.75rem',
                                                minWidth: '80px'
                                            }}
                                        >
                                            <option value="1">1 Day</option>
                                            <option value="3">3 Days</option>
                                            <option value="5">5 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="30">30 Days</option>
                                            <option value="60">60 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="180">180 Days</option>
                                            <option value="365">1 Year</option>
                                            <option value="3650">Forever</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Corrupted:</span>
                                        <select
                                            value={corruptRetention}
                                            onChange={(e) => setCorruptRetention(e.target.value)}
                                            style={{
                                                padding: '0.15rem 0.4rem',
                                                background: 'var(--color-bg-primary)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '4px',
                                                color: 'var(--color-text-primary)',
                                                fontSize: '0.75rem',
                                                minWidth: '80px'
                                            }}
                                        >
                                            <option value="1">1 Day</option>
                                            <option value="3">3 Days</option>
                                            <option value="5">5 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="30">30 Days</option>
                                            <option value="60">60 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="180">180 Days</option>
                                            <option value="365">1 Year</option>
                                            <option value="3650">Forever</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Uploaded:</span>
                                        <select
                                            value={uploadRetention}
                                            onChange={(e) => setUploadRetention(e.target.value)}
                                            style={{
                                                padding: '0.15rem 0.4rem',
                                                background: 'var(--color-bg-primary)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '4px',
                                                color: 'var(--color-text-primary)',
                                                fontSize: '0.75rem',
                                                minWidth: '80px'
                                            }}
                                        >
                                            <option value="1">1 Day</option>
                                            <option value="3">3 Days</option>
                                            <option value="5">5 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="30">30 Days</option>
                                            <option value="60">60 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="180">180 Days</option>
                                            <option value="365">1 Year</option>
                                            <option value="3650">Forever</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Clock + Actions (Right) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', borderLeft: '1px solid var(--color-border)', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', borderRadius: '6px', opacity: backupEnabled ? 1 : 0.5, pointerEvents: backupEnabled ? 'auto' : 'none' }}>
                                {/* Row 1: SET Button + Live Clock (Top) */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {/* SET Button - aligned over Upload File */}
                                    <button
                                        onClick={handleSetSchedule}
                                        disabled={actionLoading === 'schedule' || !backupEnabled}
                                        style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            minWidth: '80px',
                                            textAlign: 'center',
                                            background: backupEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                            color: backupEnabled ? '#22c55e' : '#64748b',
                                            border: backupEnabled ? '1px solid #22c55e' : '1px solid #64748b',
                                            cursor: backupEnabled ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {actionLoading === 'schedule' ? '...' : (backupEnabled ? 'SET' : 'OFF')}
                                    </button>
                                    {/* Live Clock */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.15rem 0.5rem',
                                        background: 'var(--color-bg-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px'
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>🕐</span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--color-text-primary)',
                                            fontFamily: 'monospace'
                                        }}>
                                            {currentTime.toLocaleString('en-GB', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                                                timeZone: 'Europe/Paris', hour12: false, timeZoneName: 'short'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 2: Actions Buttons (Bottom) */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="file" id="db-manager-upload" accept=".db,.sqlite,.sqlite3,.gz" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    <button className="btn" onClick={() => document.getElementById('db-manager-upload').click()} disabled={actionLoading} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Upload File</button>
                                    <button className="btn" onClick={handleBackupNow} disabled={actionLoading} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' }}>Backup Now</button>
                                    {selectedFiles.size > 0 ? (
                                        <button className="btn" onClick={handleBulkDelete} disabled={actionLoading} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.4)', whiteSpace: 'nowrap' }}>Delete Selected ({selectedFiles.size})</button>
                                    ) : (
                                        <button className="btn" onClick={loadFiles} disabled={loading} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>Refresh</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* File List Table */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '0', background: 'var(--color-bg-primary)', borderTop: '1px solid var(--color-border)', minHeight: '300px' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading files...</div>
                        ) : files.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No database files found</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: Object.values(colWidths).reduce((a, b) => a + b, 0) + 'px' }}>
                                <thead style={{ background: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        {[
                                            { key: 'select', label: '✓', left: 'select', right: 'name' },
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
                                                    letterSpacing: '0.05em',
                                                    position: 'relative',
                                                    userSelect: 'none',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #334155'
                                                }}
                                                onClick={() => handleSort(col.key)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.key === 'name' ? 'flex-start' : 'center' }}>
                                                    {col.key === 'select' ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFiles.size > 0 && selectedFiles.size === sortedFiles.filter(f => f.type !== 'active').length}
                                                            onChange={(e) => { e.stopPropagation(); handleSelectAll(); }}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    ) : (
                                                        <>
                                                            {col.label}
                                                            <SortIndicator column={col.key} />
                                                        </>
                                                    )}
                                                </div>
                                                {col.right && <ResizeHandle leftCol={col.left} rightCol={col.right} />}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFiles.map(file => (
                                        <tr key={file.name} style={{ borderBottom: '1px solid var(--color-border)', background: selectedFiles.has(file.name) ? 'rgba(168, 85, 247, 0.05)' : 'transparent' }}>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                                {file.type !== 'active' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFiles.has(file.name)}
                                                        onChange={(e) => { e.stopPropagation(); handleSelectFile(file.name); }}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); handleDownload(file.name); }}
                                                    title="Click to download"
                                                    style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}
                                                >
                                                    {file.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.7rem', borderBottom: '1px solid var(--color-border)' }}>{formatSize(file.size)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem', borderBottom: '1px solid var(--color-border)' }}>{formatDate(file.modified)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>{getTypeBadge(file.type)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDownload(file.name); }}
                                                        title="Download"
                                                        style={{
                                                            width: '24px', height: '24px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: 'rgba(45, 212, 191, 0.1)', // Turquoise transparent
                                                            border: '1px solid rgba(45, 212, 191, 0.3)',
                                                            borderRadius: '4px',
                                                            color: '#2dd4bf',
                                                            cursor: 'pointer',
                                                            padding: 0
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 5v14M19 12l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {file.type !== 'active' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRestore(file.name); }}
                                                                title="Restore"
                                                                style={{
                                                                    width: '24px', height: '24px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                                    borderRadius: '4px',
                                                                    color: '#22c55e',
                                                                    cursor: 'pointer',
                                                                    padding: 0
                                                                }}
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M12 5v14M5 12h14" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ filename: file.name }); }}
                                                                title="Delete"
                                                                style={{
                                                                    width: '24px', height: '24px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: 'rgba(168, 85, 247, 0.1)', // Purple transparent
                                                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                                                    borderRadius: '4px',
                                                                    color: '#a855f7',
                                                                    cursor: 'pointer',
                                                                    padding: 0
                                                                }}
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                                </svg>
                                                            </button>
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
                    <div style={{ padding: '0.75rem 1.5rem', background: '#1e293b', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                        {/* Backup Status Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <span><span style={{ fontSize: '1rem', marginRight: '0.4rem' }}>🗓️</span><span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Last Backup:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{backupSchedule.lastBackupTime ? formatDate(backupSchedule.lastBackupTime) : 'Never'}</span></span>
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
                            {backupEnabled ? (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span title="Next estimated backup time"><span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Next Backup:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{(() => {
                                        // Compute next backup from current picker values for immediate feedback
                                        const startDate = new Date(scheduleStartDate + 'T' + scheduleTime);
                                        const now = new Date();
                                        const intervalMs = parseInt(scheduleInterval, 10) * 24 * 60 * 60 * 1000;
                                        let nextDate = startDate;
                                        while (nextDate <= now) {
                                            nextDate = new Date(nextDate.getTime() + intervalMs);
                                        }
                                        return formatDate(nextDate.toISOString());
                                    })()}</span></span>
                                    <span style={{ fontSize: '1rem', marginLeft: '0.4rem' }}>🔜</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Next Backup:</span>
                                    <span style={{ color: '#f59e0b', marginLeft: '0.3rem' }}>Backup Disabled ⚠️</span>
                                </div>
                            )}
                        </div>

                        {/* Row 2: File Stats */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem' }}>🗂️</span>
                                <span><span style={{ color: 'var(--color-text-primary)' }}>Total Files:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{files.length}</span></span>
                            </div>
                            {stats && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ opacity: 1 }} title={`Oldest: ${formatDate(stats.oldest.modified)}\nNewest: ${formatDate(stats.newest.modified)}`}>
                                        <span style={{ color: 'var(--color-text-primary)' }}>Range:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{new Date(stats.oldest.modified).toLocaleDateString()} → {new Date(stats.newest.modified).toLocaleDateString()}</span>
                                    </span>
                                    <span style={{ fontSize: '1rem' }}>📅</span>
                                </div>
                            )}
                        </div>

                        {/* Row 3: Size & Disk */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                            {/* Top Labels */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1rem' }}>💾</span>
                                    <span><span style={{ color: 'var(--color-text-primary)' }}>DB Folder Size:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{usage ? formatSize(usage.folderSize) : '0 B'}</span></span>
                                </div>

                                {usage?.disk?.total > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1rem' }}>🧮</span>
                                        <span style={{ color: 'white', fontWeight: 600 }}>
                                            {Math.round((usage.disk.used / usage.disk.total) * 100)}%
                                        </span>
                                    </div>
                                )}

                                {usage?.disk?.total > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span><span style={{ color: 'var(--color-text-primary)' }}>Disk:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{formatSize(usage.disk.used)} / {formatSize(usage.disk.total)}</span></span>
                                        <span style={{ fontSize: '1rem' }}>💿</span>
                                    </div>
                                )}
                            </div>

                            {/* Disk Bar */}
                            {usage?.disk?.total > 0 && (
                                <div style={{ height: '4px', background: 'rgba(0,0,0,0.1)', paddingBottom: '0', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, (usage.disk.used / usage.disk.total) * 100)}%`, height: '100%', background: (() => {
                                                const pct = (usage.disk.used / usage.disk.total) * 100;
                                                if (pct < 50) return '#22c55e'; // Green
                                                if (pct < 70) return '#eab308'; // Yellow
                                                if (pct < 85) return '#f97316'; // Orange
                                                return '#ef4444'; // Red
                                            })(), borderRadius: '2px'
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>
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
                            <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>Cancel</button>
                            <button className="btn" onClick={handleDelete} style={{ flex: 1, padding: '0.75rem', background: '#a855f7', color: 'white', border: 'none', fontWeight: 600 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Progress Modal */}
            {uploadProgress !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1700, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-primary)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗄️</div>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Uploading Database...</h3>
                        <div style={{ width: '100%', height: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s ease-out' }} />
                        </div>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{uploadProgress}%</p>
                    </div>
                </div>
            )}

            {/* Download Progress Modal */}
            {downloadProgress !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1700, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-primary)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗄️</div>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Downloading Database...</h3>
                        <div style={{ width: '100%', height: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s ease-out' }} />
                        </div>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{downloadProgress}%</p>
                    </div>
                </div>
            )}
            {/* Backup Progress Modal */}
            {(backupState.running || (backupState.sections && backupState.sections.length > 0)) && (
                <BackupProgressModal
                    sections={backupState.sections || []}
                    onClose={closeBackupModal}
                    onResult={(type, title, msg) => {
                        if (onResult) onResult(type, title, msg);
                        loadFiles();
                    }}
                />
            )}
        </React.Fragment>
    );
};

export default Dashboard;
