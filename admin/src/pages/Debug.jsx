import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

// CET/CEST timestamp formatter
const formatTimestampCET = (isoString) => {
    if (!isoString) return { date: '—', time: '' };
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
    const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
    const parisOffset = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
    const isDST = Math.max(jan, jul) !== parisOffset;
    return { date: dateStr, time: `${timeStr} ${isDST ? 'CEST' : 'CET'}` };
};

const Debug = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // ID of user being processed

    // Fetch users with debug status
    useEffect(() => {
        fetchUsers();
        // Poll every 5 seconds for live updates
        const interval = setInterval(() => fetchUsers(true), 5000);
        return () => clearInterval(interval);
    }, []);

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

    // Filter users based on search
    const filteredUsers = users.filter(u =>
        (u.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
    const handleClearLogs = async (userId) => {
        if (!confirm('Are you sure you want to clear logs for this user?')) return;
        setActionLoading(userId);
        try {
            await adminApi.fetch(`/debug/users/${userId}/logs`, { method: 'DELETE' });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, log_count: 0 } : u));
        } catch (err) {
            console.error('Failed to clear logs:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Stats
    const debugEnabledCount = users.filter(u => u.debug_enabled).length;
    const usersWithLogs = users.filter(u => u.log_count > 0).length;

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginBottom: '0.25rem', fontWeight: 600 }}>🐛 Debug Enabled</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{debugEnabledCount}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>users with debug mode on</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem', fontWeight: 600 }}>📨 Users with Logs</div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>
                            {(users.reduce((acc, u) => acc + (u.log_count || 0), 0))} Total Logs
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{usersWithLogs}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>have uploaded logs</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '0.25rem', fontWeight: 600 }}>👥 Total Users</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>{users.length}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>in debug system (top 5000)</div>
                </div>
            </div>

            {/* Search Bar - Detached */}
            <div style={{ marginBottom: '1rem', position: 'relative', width: '100%', maxWidth: '400px' }}>
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

            {/* Main Content - Detached Table Card */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>

                {/* Table */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #334155', width: '30%', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #334155', width: '20%', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Active</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', borderBottom: '1px solid #334155', width: '15%', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debug Mode</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #334155', width: '35%', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logs & Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No users found matching "{searchTerm}"</td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const lastActive = formatTimestampCET(user.last_active);
                                    const debugLastSeen = formatTimestampCET(user.debug_last_seen);

                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #334155' }} onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem', color: '#e2e8f0' }}>
                                                <div style={{ fontWeight: 500 }}>{user.nickname || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{user.id}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                                <div>{lastActive.date}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{lastActive.time}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleToggleDebug(user)}
                                                    disabled={actionLoading === user.id}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '20px', // More badge-like
                                                        border: user.debug_enabled
                                                            ? '1px solid rgba(34, 197, 94, 0.3)'
                                                            : '1px solid rgba(148, 163, 184, 0.3)',
                                                        background: user.debug_enabled
                                                            ? 'rgba(34, 197, 94, 0.1)'
                                                            : (actionLoading === user.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'), // Blue when enabling
                                                        color: user.debug_enabled
                                                            ? '#22c55e'
                                                            : (actionLoading === user.id ? '#3b82f6' : '#94a3b8'),
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        opacity: 1, // Remove opacity change, use color/text instead
                                                        transition: 'all 0.2s ease',
                                                        minWidth: '80px',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {user.debug_enabled ? 'Enabled' : (actionLoading === user.id ? 'Enabling...' : 'Off')}
                                                </button>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                    {/* Logs Status */}
                                                    <div style={{ minWidth: '120px' }}>
                                                        <div style={{ fontSize: '0.85rem', color: user.log_count > 0 ? '#3b82f6' : '#64748b', fontWeight: 500 }}>
                                                            {user.log_count > 0 ? `📨 ${user.log_count} Logs` : 'No Logs'}
                                                        </div>
                                                        {user.debug_last_seen && (
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                Last seen: {debugLastSeen.time}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
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
                                                                    onClick={() => handleClearLogs(user.id)}
                                                                    disabled={actionLoading === user.id}
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                                        color: '#ef4444',
                                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
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
                <div style={{ borderTop: '1px solid #334155', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>
                    Showing top {users.length} users
                </div>
            </div>
        </div>
    );
};

export default Debug;
