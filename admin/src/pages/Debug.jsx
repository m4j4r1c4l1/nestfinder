import React, { useState, useEffect, useRef } from 'react';
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
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logs, setLogs] = useState(null);
    const searchRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch users with debug status
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminApi.fetch('/debug/users');
            setUsers(res.users || []);
        } catch (err) {
            console.error('Failed to fetch debug users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(u =>
        (u.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Select a user
    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setSearchTerm(user.nickname || user.id.substring(0, 12));
        setShowDropdown(false);
        setLogs(null);

        // Fetch logs for this user
        if (user.log_count > 0) {
            setLogsLoading(true);
            try {
                const res = await adminApi.fetch(`/debug/users/${user.id}/logs`);
                setLogs(res);
            } catch (err) {
                console.error('Failed to fetch logs:', err);
            } finally {
                setLogsLoading(false);
            }
        }
    };

    // Toggle debug mode for user
    const handleToggleDebug = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const res = await adminApi.fetch(`/debug/users/${selectedUser.id}/toggle`, { method: 'POST' });
            setSelectedUser({ ...selectedUser, debug_enabled: res.debug_enabled ? 1 : 0 });
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, debug_enabled: res.debug_enabled ? 1 : 0 } : u));
        } catch (err) {
            console.error('Failed to toggle debug:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Download logs
    const handleDownloadLogs = () => {
        if (!selectedUser) return;
        window.open(`${import.meta.env.VITE_API_URL || ''}/api/debug/users/${selectedUser.id}/logs/download`, '_blank');
    };

    // Clear logs
    const handleClearLogs = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.fetch(`/debug/users/${selectedUser.id}/logs`, { method: 'DELETE' });
            setLogs({ logs: [], log_count: 0 });
            setSelectedUser({ ...selectedUser, log_count: 0 });
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, log_count: 0 } : u));
        } catch (err) {
            console.error('Failed to clear logs:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Stats
    const debugEnabledCount = users.filter(u => u.debug_enabled).length;
    const usersWithLogs = users.filter(u => u.log_count > 0).length;

    return (
        <div style={{ width: '75%', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginBottom: '0.25rem', fontWeight: 600 }}>🐛 Debug Enabled</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{debugEnabledCount}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>users with debug mode on</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem', fontWeight: 600 }}>📨 Users with Logs</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{usersWithLogs}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>have uploaded logs</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '0.25rem', fontWeight: 600 }}>👥 Total Users</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>{users.length}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>in debug system</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
                {/* User Selector */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>
                        Select Client to Debug
                    </label>
                    <div style={{ position: 'relative' }} ref={searchRef}>
                        <input
                            type="text"
                            placeholder="Search by nickname or ID..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                padding: '0.85rem 1rem',
                                background: '#0f172a',
                                border: selectedUser ? '2px solid #8b5cf6' : '1px solid #475569',
                                borderRadius: '10px',
                                color: '#e2e8f0',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s'
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedUser(null); setLogs(null); }}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '1.3rem',
                                    cursor: 'pointer',
                                    lineHeight: 1
                                }}
                            >×</button>
                        )}
                        {/* Dropdown */}
                        {showDropdown && searchTerm && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                width: '100%',
                                maxWidth: '500px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                background: '#0f172a',
                                border: '1px solid #475569',
                                borderRadius: '0 0 10px 10px',
                                zIndex: 50,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}>
                                {loading ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
                                ) : filteredUsers.length === 0 ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No users found</div>
                                ) : (
                                    filteredUsers.slice(0, 15).map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                transition: 'background 0.1s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: user.debug_enabled ? '#22c55e' : '#475569',
                                                flexShrink: 0
                                            }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.9rem' }}>
                                                    {user.nickname || 'Anonymous'}
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: '0.7rem', display: 'flex', gap: '0.75rem' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{user.id}</span>
                                                    {user.log_count > 0 && <span style={{ color: '#3b82f6' }}>📨 {user.log_count}</span>}
                                                </div>
                                            </div>
                                            {user.debug_enabled ? (
                                                <span style={{ fontSize: '0.7rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>DEBUG ON</span>
                                            ) : null}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected User Panel */}
                {selectedUser && (
                    <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                        {/* User Info Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.25rem' }}>
                                    {selectedUser.nickname || 'Anonymous'}
                                </div>
                                <code style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedUser.id}</code>
                            </div>

                            {/* Debug Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Debug Mode</div>
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: selectedUser.debug_enabled ? '#22c55e' : '#64748b'
                                    }}>
                                        {selectedUser.debug_enabled ? '🟢 ENABLED' : '⚫ DISABLED'}
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleDebug}
                                    disabled={actionLoading}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        background: selectedUser.debug_enabled
                                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                            : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        transition: 'transform 0.1s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {actionLoading ? '...' : selectedUser.debug_enabled ? 'Disable Debug' : 'Enable Debug'}
                                </button>
                            </div>
                        </div>

                        {/* Status Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Last Active</div>
                                <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
                                    {selectedUser.last_active ? formatTimestampCET(selectedUser.last_active).date + ' ' + formatTimestampCET(selectedUser.last_active).time : '—'}
                                </div>
                            </div>
                            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Debug Last Seen</div>
                                <div style={{ fontSize: '0.9rem', color: selectedUser.debug_last_seen ? '#22c55e' : '#64748b' }}>
                                    {selectedUser.debug_last_seen ? formatTimestampCET(selectedUser.debug_last_seen).date + ' ' + formatTimestampCET(selectedUser.debug_last_seen).time : 'Never'}
                                </div>
                            </div>
                            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Log Entries</div>
                                <div style={{ fontSize: '0.9rem', color: selectedUser.log_count > 0 ? '#3b82f6' : '#64748b' }}>
                                    {selectedUser.log_count || 0} entries
                                </div>
                            </div>
                        </div>

                        {/* Logs Section */}
                        <div style={{ background: '#0f172a', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>📋 Client Logs</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={handleDownloadLogs}
                                        disabled={!logs || logs.log_count === 0}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.8rem',
                                            background: logs?.log_count > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            color: logs?.log_count > 0 ? '#3b82f6' : '#64748b',
                                            border: `1px solid ${logs?.log_count > 0 ? 'rgba(59, 130, 246, 0.3)' : '#334155'}`,
                                            borderRadius: '6px',
                                            cursor: logs?.log_count > 0 ? 'pointer' : 'not-allowed',
                                            fontWeight: 500
                                        }}
                                    >
                                        📥 Download
                                    </button>
                                    <button
                                        onClick={handleClearLogs}
                                        disabled={!logs || logs.log_count === 0 || actionLoading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.8rem',
                                            background: logs?.log_count > 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                            color: logs?.log_count > 0 ? '#ef4444' : '#64748b',
                                            border: `1px solid ${logs?.log_count > 0 ? 'rgba(239, 68, 68, 0.3)' : '#334155'}`,
                                            borderRadius: '6px',
                                            cursor: logs?.log_count > 0 ? 'pointer' : 'not-allowed',
                                            fontWeight: 500
                                        }}
                                    >
                                        🗑️ Clear
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {logsLoading ? (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading logs...</div>
                                ) : !logs || logs.log_count === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                                        <div>No logs available</div>
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                            {selectedUser.debug_enabled ? 'Waiting for client to upload logs...' : 'Enable debug mode to start collecting'}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                        {logs.logs.slice(0, 100).map((log, i) => (
                                            <div key={i} style={{ padding: '0.25rem 0', borderBottom: '1px solid #1e293b' }}>{log}</div>
                                        ))}
                                        {logs.logs.length > 100 && (
                                            <div style={{ padding: '0.5rem', textAlign: 'center', color: '#64748b' }}>
                                                ... and {logs.logs.length - 100} more entries (download for full logs)
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!selectedUser && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                        <div style={{ textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐛</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select a Client</div>
                            <div style={{ fontSize: '0.9rem' }}>Search and select a user above to manage their debug settings</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Debug;
