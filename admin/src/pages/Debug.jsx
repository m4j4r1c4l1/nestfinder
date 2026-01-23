import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

// CET/CEST timestamp formatter
const formatTimestampCET = (isoString) => {
    if (!isoString) return { date: '—', time: '' };
    // Ensure UTC interpretation if Z is missing, though usually API returns ISO
    const dateObj = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');

    // Check if date is valid
    if (isNaN(dateObj.getTime())) return { date: '—', time: '' };

    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' });
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });

    // Simple DST approximation for label (exact logic handled by browser timezone, this is just for the suffix)
    // We can just rely on the fact that the time ITSELF is correct now.
    const jan = new Date(dateObj.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(dateObj.getFullYear(), 6, 1).getTimezoneOffset();
    const parisOffset = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
    const isDST = Math.max(jan, jul) !== parisOffset;

    return { date: dateStr, time: `${timeStr} ${isDST ? 'CEST' : 'CET'}` };
};

import LogModal from '../components/LogModal';



const Debug = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // ID of user being processed
    const [viewingUser, setViewingUser] = useState(null); // User currently being viewed in modal
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'user' | 'all', id?: string, name?: string }
    const [page, setPage] = useState(1);
    const pageSize = 30;



    const fetchUsers = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await adminApi.fetch('/debug/users');
            // Sort by debug_enabled desc, then last_active desc to keep relevant users on top
            const sorted = (res.users || []).sort((a, b) => {
                if (a.debug_enabled !== b.debug_enabled) return b.debug_enabled - a.debug_enabled;
                return new Date(b.last_active || 0) - new Date(a.last_active || 0);
            });
            setUsers(sorted);
        } catch (err) {
            console.error('Failed to fetch debug users:', err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ column: 'debug_enabled', direction: 'desc' });

    // Column widths with localStorage persistence
    const STORAGE_KEY = 'debug_table_col_widths';
    const DEFAULT_WIDTHS = { user: 200, lastActive: 140, sessionStart: 140, sessionEnd: 140, debugMode: 100, debugLevel: 120, logs: 260 };
    const [colWidths, setColWidths] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...DEFAULT_WIDTHS, ...JSON.parse(saved) } : DEFAULT_WIDTHS;
        } catch { return DEFAULT_WIDTHS; }
    });

    // Resize state: stores left column, right column, and starting widths
    const [resizing, setResizing] = useState(null);

    // Save column widths
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths)); } catch { }
    }, [colWidths]);

    // Handle resize - redistribute space between adjacent columns
    useEffect(() => {
        if (!resizing) return;
        const handleMouseMove = (e) => {
            const delta = e.clientX - resizing.startX;
            const newLeftWidth = Math.max(60, resizing.startLeftWidth + delta);
            const newRightWidth = Math.max(60, resizing.startRightWidth - delta);
            // Ensure both columns stay above minimum
            if (newLeftWidth >= 60 && newRightWidth >= 60) {
                setColWidths(prev => ({
                    ...prev,
                    [resizing.leftCol]: newLeftWidth,
                    [resizing.rightCol]: newRightWidth
                }));
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

    // Filter users based on search
    const filteredUsers = users.filter(u =>
        (u.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort users
    const sortedUsers = React.useMemo(() => {
        const sorted = [...filteredUsers];
        sorted.sort((a, b) => {
            let aVal, bVal;
            switch (sortConfig.column) {
                case 'user':
                    aVal = (a.nickname || '').toLowerCase();
                    bVal = (b.nickname || '').toLowerCase();
                    break;
                case 'lastActive':
                    // Logic from original: prioritize debug_last_seen if newer
                    const aTime = (a.debug_last_seen && new Date(a.debug_last_seen) > new Date(a.last_active || 0))
                        ? a.debug_last_seen : (a.last_active || a.debug_last_seen);
                    const bTime = (b.debug_last_seen && new Date(b.debug_last_seen) > new Date(b.last_active || 0))
                        ? b.debug_last_seen : (b.last_active || b.debug_last_seen);
                    aVal = new Date(aTime || 0).getTime();
                    bVal = new Date(bTime || 0).getTime();
                    break;
                case 'debugMode':
                    aVal = a.debug_enabled ? 1 : 0;
                    bVal = b.debug_enabled ? 1 : 0;
                    break;
                case 'logs':
                    aVal = a.log_count || 0;
                    bVal = b.log_count || 0;
                    break;
                case 'debugLevel':
                    const levels = { default: 0, aggressive: 1, paranoic: 2 };
                    aVal = levels[a.debug_level || 'default'];
                    bVal = levels[b.debug_level || 'default'];
                    break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredUsers, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedUsers.length / pageSize);
    const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const handleSort = (column) => {
        setSortConfig(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Toggle debug mode for user
    const handleToggleDebug = async (user) => {
        setActionLoading(user.id);
        try {
            const res = await adminApi.fetch(`/debug/users/${user.id}/toggle`, { method: 'POST' });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, debug_enabled: res.debug_enabled ? 1 : 0 } : u));
        } catch (err) {
            console.error('Failed to toggle debug:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Cycle debug level: Default -> Aggressive -> Paranoic -> Default
    const handleCycleDebugLevel = async (user) => {
        const levels = ['default', 'aggressive', 'paranoic'];
        const currentIdx = levels.indexOf(user.debug_level || 'default');
        const nextLevel = levels[(currentIdx + 1) % levels.length];

        // Optimistic update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, debug_level: nextLevel } : u));

        try {
            await adminApi.fetch(`/debug/users/${user.id}/level`, {
                method: 'POST',
                body: JSON.stringify({ level: nextLevel })
            });
        } catch (err) {
            console.error('Failed to set debug level:', err);
            // Revert on failure
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, debug_level: user.debug_level } : u));
        }
    };

    // Download logs
    const handleDownloadLogs = async (userId) => {
        try {
            await adminApi.downloadLogs(userId);
        } catch (err) {
            console.error('Failed to download logs:', err);
            alert('Failed to download logs');
        }
    };

    // Clear logs
    const handleClearLogs = async (userId, nickname) => {
        setDeleteConfirm({ type: 'user', id: userId, name: nickname || 'Anonymous' });
    };

    const confirmClearLogs = async () => {
        if (!deleteConfirm) return;
        const { type, id } = deleteConfirm;
        const targetId = type === 'user' ? id : null;

        setDeleteConfirm(null);
        if (targetId) setActionLoading(targetId);

        try {
            if (type === 'all') {
                await adminApi.fetch('/debug/logs', { method: 'DELETE' });
                fetchUsers();
            } else {
                await adminApi.fetch(`/debug/users/${targetId}/logs`, { method: 'DELETE' });
                setUsers(prev => prev.map(u => u.id === targetId ? { ...u, log_count: 0 } : u));
            }
        } catch (err) {
            console.error('Failed to clear logs:', err);
        } finally {
            if (targetId) setActionLoading(null);
        }
    };

    // Stats
    const debugEnabledCount = users.filter(u => u.debug_enabled).length;
    const usersWithLogs = users.filter(u => u.log_count > 0).length;

    // Resize handle sits between leftCol and rightCol
    const ResizeHandle = ({ leftCol, rightCol }) => (
        <div
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                background: resizing?.leftCol === leftCol ? '#3b82f6' : 'transparent',
                transition: 'background 0.15s',
                zIndex: 20
            }}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setResizing({
                    leftCol,
                    rightCol,
                    startX: e.clientX,
                    startLeftWidth: colWidths[leftCol],
                    startRightWidth: colWidths[rightCol]
                });
            }}
            onMouseEnter={(e) => { if (!resizing) e.currentTarget.style.background = '#475569'; }}
            onMouseLeave={(e) => { if (!resizing) e.currentTarget.style.background = 'transparent'; }}
        />
    );

    const SortIndicator = ({ column }) => {
        if (sortConfig.column !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return <span style={{ marginLeft: '4px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: resizing ? 'col-resize' : 'default', userSelect: resizing ? 'none' : 'auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🐛 Debug
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                    Manage client debug logging and retrieve diagnostic data
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginBottom: '0.5rem', fontWeight: 600, alignSelf: 'flex-start', textAlign: 'left' }}>🐛 Debug Enabled</div>
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>{debugEnabledCount}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'left' }}>users enabled</div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.5rem', fontWeight: 600, alignSelf: 'flex-start', textAlign: 'left' }}>📨 Users with Logs</div>
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', lineHeight: 1 }}>{usersWithLogs}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'left' }}>have logs</div>
                    </div>
                </div>

                {/* Golden Badge - Total Events */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.5rem', fontWeight: 600, alignSelf: 'flex-start', textAlign: 'left' }}>📚 Total Events</div>
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>
                            {users.reduce((acc, u) => acc + (u.log_count || 0), 0)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'left' }}>entries stored</div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '0.5rem', fontWeight: 600, alignSelf: 'flex-start', textAlign: 'left' }}>👥 Total Users</div>
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e', lineHeight: 1 }}>{users.length}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'left' }}>in database</div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                {/* Search Bar - Detached */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                    />
                </div>

                {/* Global Actions */}
                <button
                    onClick={() => setDeleteConfirm({ type: 'all' })}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(168, 85, 247, 0.1)', // Purple Badge
                        color: '#a855f7',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Delete All Logs
                </button>
            </div>

            {/* Main Content - Detached Table Card */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                {/* Table */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
                            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                                <th style={{ width: colWidths.user, position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('user')}>
                                    User <SortIndicator column="user" />
                                    <ResizeHandle leftCol="user" rightCol="lastActive" />
                                </th>
                                <th style={{ width: colWidths.lastActive, position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('lastActive')}>
                                    Last Active <SortIndicator column="lastActive" />
                                    <ResizeHandle leftCol="lastActive" rightCol="debugMode" />
                                </th>
                                <th style={{ width: colWidths.debugMode, position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('debugMode')}>
                                    Debug Mode <SortIndicator column="debugMode" />
                                    <ResizeHandle leftCol="debugMode" rightCol="debugLevel" />
                                </th>
                                <th style={{ width: colWidths.debugLevel, position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('debugLevel')}>
                                    Debug Level <SortIndicator column="debugLevel" />
                                    <ResizeHandle leftCol="debugLevel" rightCol="sessionStart" />
                                </th>
                                <th style={{ width: colWidths.sessionStart, position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('sessionStart')}>
                                    Session Start <SortIndicator column="sessionStart" />
                                    <ResizeHandle leftCol="sessionStart" rightCol="sessionEnd" />
                                </th>
                                <th style={{ width: colWidths.sessionEnd, position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('sessionEnd')}>
                                    Session End <SortIndicator column="sessionEnd" />
                                    <ResizeHandle leftCol="sessionEnd" rightCol="logs" />
                                </th>
                                <th style={{ position: 'relative', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('logs')}>
                                    Logs & Actions <SortIndicator column="logs" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No users found matching "{searchTerm}"</td>
                                </tr>
                            ) : (
                                paginatedUsers.map(user => {
                                    const rawTimestamp = (user.debug_last_seen && new Date(user.debug_last_seen) > new Date(user.last_active || 0))
                                        ? user.debug_last_seen
                                        : (user.last_active || user.debug_last_seen);
                                    const lastActive = formatTimestampCET(rawTimestamp);
                                    const sessionStart = user.debug_session_start ? formatTimestampCET(user.debug_session_start) : null;
                                    const sessionEnd = user.debug_session_end ? formatTimestampCET(user.debug_session_end) : null;

                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #334155' }} onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: 500 }}>{user.nickname || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{user.id}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.8rem' }}>
                                                <div>{lastActive.date}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{lastActive.time}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleDebug(user); }}
                                                    disabled={actionLoading === user.id}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '20px',
                                                        border: user.debug_enabled
                                                            ? '1px solid rgba(34, 197, 94, 0.3)'
                                                            : '1px solid rgba(148, 163, 184, 0.3)',
                                                        background: user.debug_enabled
                                                            ? 'rgba(34, 197, 94, 0.1)'
                                                            : (actionLoading === user.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'),
                                                        color: user.debug_enabled
                                                            ? '#22c55e'
                                                            : (actionLoading === user.id ? '#3b82f6' : '#94a3b8'),
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        opacity: 1,
                                                        transition: 'all 0.2s ease',
                                                        minWidth: '80px',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {user.debug_enabled ? 'Enabled' : (actionLoading === user.id ? 'Enabling...' : 'Off')}
                                                </button>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCycleDebugLevel(user); }}
                                                    style={{
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '6px',
                                                        border: '1px solid',
                                                        borderColor: (user.debug_level || 'default') === 'paranoic' ? '#ef4444' : (user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6'),
                                                        background: (user.debug_level || 'default') === 'paranoic' ? '#ef444420' : (user.debug_level === 'aggressive' ? '#a855f720' : '#3b82f620'),
                                                        color: (user.debug_level || 'default') === 'paranoic' ? '#ef4444' : (user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6'),
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        minWidth: '90px',
                                                        opacity: user.debug_enabled ? 1 : 0.5,
                                                        transition: 'all 0.2s ease',
                                                        textTransform: 'capitalize'
                                                    }}
                                                    title="Click to cycle verbosity"
                                                >
                                                    {(user.debug_level || 'default')}
                                                </button>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.8rem' }}>
                                                {sessionStart ? (
                                                    <>
                                                        <div>{sessionStart.date}</div>
                                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{sessionStart.time}</div>
                                                    </>
                                                ) : <span style={{ opacity: 0.5 }}>—</span>}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.8rem' }}>
                                                {sessionEnd ? (
                                                    <>
                                                        <div>{sessionEnd.date}</div>
                                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{sessionEnd.time}</div>
                                                    </>
                                                ) : <span style={{ opacity: 0.5 }}>—</span>}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                    {/* Events Status */}
                                                    {user.debug_enabled ? (
                                                        <>
                                                            {/* Clickable Events Badge */}
                                                            <div
                                                                onClick={() => user.log_count > 0 && setViewingUser(user)}
                                                                style={{
                                                                    padding: '0.4rem 0.8rem',
                                                                    borderRadius: '20px',
                                                                    border: user.log_count > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)',
                                                                    background: user.log_count > 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                                                    color: user.log_count > 0 ? '#f59e0b' : '#94a3b8',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 600,
                                                                    minWidth: '80px',
                                                                    textAlign: 'center',
                                                                    cursor: user.log_count > 0 ? 'pointer' : 'default',
                                                                    transition: 'all 0.2s ease'
                                                                }}>
                                                                {user.log_count > 0 ? `${user.log_count} Events` : 'No Events'}
                                                            </div>



                                                        </>
                                                    ) : (
                                                        /* Debug Disabled: Just Text */
                                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.4rem 0' }}>
                                                            No events
                                                        </div>
                                                    )}

                                                    {/* Actions (Download/Clear) */}
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {user.log_count > 0 && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleDownloadLogs(user.id)}
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                                        color: '#3b82f6',
                                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Download
                                                                </button>
                                                                <button
                                                                    onClick={() => handleClearLogs(user.id, user.nickname)}
                                                                    disabled={actionLoading === user.id}
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        background: 'rgba(168, 85, 247, 0.1)', // Purple Badge
                                                                        color: '#a855f7',
                                                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Clear
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Footer - Detached from Table (matching Users.jsx) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0.75rem 0', marginTop: '0.5rem', borderTop: '1px solid #334155' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Showing {sortedUsers.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedUsers.length)} of {sortedUsers.length} users
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', visibility: totalPages > 1 ? 'visible' : 'hidden' }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: page === 1 ? '#1e293b' : '#334155', color: page === 1 ? '#64748b' : '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        ◀ Prev
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', minWidth: '80px', textAlign: 'center' }}>
                        Page {page} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: page >= totalPages ? '#1e293b' : '#334155', color: page >= totalPages ? '#64748b' : '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next ▶
                    </button>
                </div>

                {/* Empty right column to balance grid */}
                <div></div>
            </div>

            {viewingUser && (
                <LogModal
                    user={viewingUser}
                    onClose={() => setViewingUser(null)}
                    onUserUpdate={(updatedFields) => {
                        // Update the local viewingUser state immediately
                        setViewingUser(prev => ({ ...prev, ...updatedFields }));
                        // Also update the main users list to keep it in sync
                        setUsers(prev => prev.map(u => u.id === viewingUser.id ? { ...u, ...updatedFields } : u));
                    }}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1600, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', textAlign: 'center', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', background: '#1e293b', border: '1px solid #334155' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'white' }}>
                            {deleteConfirm.type === 'all' ? 'Delete All Logs?' : 'Clear User Logs?'}
                        </h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            {deleteConfirm.type === 'all' ? (
                                <>WARNING: This will delete ALL logs from all users.<br />This action cannot be undone.</>
                            ) : (
                                <>Are you sure you want to clear logs for <br /><span style={{ color: 'white', fontWeight: 600 }}>{deleteConfirm.name}</span>?<br /><br />This action cannot be undone.</>
                            )}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: 'white' }}>Cancel</button>
                            <button className="btn" onClick={confirmClearLogs} style={{ flex: 1, padding: '0.75rem', background: '#a855f7', color: 'white', border: 'none', fontWeight: 600 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Debug;
