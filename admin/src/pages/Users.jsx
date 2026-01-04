import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

// Badge system - matching client-side thresholds
const getBadge = (score = 0) => {
    if (score >= 50) return { name: 'Eagle', icon: '🦅', color: '#f59e0b', nextAt: null };
    if (score >= 30) return { name: 'Owl', icon: '🦉', color: '#8b5cf6', nextAt: 50 };
    if (score >= 10) return { name: 'Sparrow', icon: '🐦', color: '#3b82f6', nextAt: 30 };
    return { name: 'Hatchling', icon: '🥚', color: '#94a3b8', nextAt: 10 };
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [sortColumn, setSortColumn] = useState('last_active');
    const [sortDirection, setSortDirection] = useState('desc');
    const [editingTrust, setEditingTrust] = useState(null); // userId being edited

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Sort users
    const sortedUsers = [...users].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        if (sortColumn === 'last_active' || sortColumn === 'created_at') {
            aVal = new Date(aVal || 0).getTime();
            bVal = new Date(bVal || 0).getTime();
        } else if (typeof aVal === 'string') {
            aVal = (aVal || '').toLowerCase();
            bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Filter users
    const filteredUsers = sortedUsers.filter(user => {
        const search = searchTerm.toLowerCase();
        return (
            (user.nickname || '').toLowerCase().includes(search) ||
            (user.id || '').toLowerCase().includes(search) ||
            getBadge(user.trust_score).name.toLowerCase().includes(search)
        );
    });

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This will remove all their data.')) return;
        setActionLoading(true);
        try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            alert('Failed to delete user: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlockUser = async (userId) => {
        if (!confirm('Block this user?')) return;
        setActionLoading(true);
        try {
            await adminApi.blockUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: true } : u));
        } catch (err) {
            alert('Failed to block user: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnblockUser = async (userId) => {
        setActionLoading(true);
        try {
            await adminApi.unblockUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: false } : u));
        } catch (err) {
            alert('Failed to unblock user: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTrustScore = async (userId, delta) => {
        const user = users.find(u => u.id === userId);
        const newScore = Math.max(0, (user.trust_score || 0) + delta);

        try {
            await adminApi.updateUserTrustScore(userId, newScore);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, trust_score: newScore } : u));
        } catch (err) {
            alert('Failed to update trust score: ' + err.message);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    // Badge counts for stats
    const badgeCounts = {
        eagle: users.filter(u => (u.trust_score || 0) >= 50).length,
        owl: users.filter(u => (u.trust_score || 0) >= 30 && (u.trust_score || 0) < 50).length,
        sparrow: users.filter(u => (u.trust_score || 0) >= 10 && (u.trust_score || 0) < 30).length,
        hatchling: users.filter(u => (u.trust_score || 0) < 10).length,
    };

    return (
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    👤 Users
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                    Manage users, badges, and trust scores
                </p>
            </div>

            {/* Stats Cards - Updated with Badge Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{users.length}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>🦅 Eagle</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{badgeCounts.eagle}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>🦉 Owl</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{badgeCounts.owl}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>🐦 Sparrow</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{badgeCounts.sparrow}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05))', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>🥚 Hatchling</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#94a3b8' }}>{badgeCounts.hatchling}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>🚫 Blocked</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{users.filter(u => u.blocked).length}</div>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by nickname, ID, or badge..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '0.75rem 1rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            {/* Users Table */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                                <th onClick={() => handleSort('nickname')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                                    Nickname {sortColumn === 'nickname' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th onClick={() => handleSort('trust_score')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
                                    Badge {sortColumn === 'trust_score' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Trust Score</th>
                                <th onClick={() => handleSort('points_count')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
                                    Points {sortColumn === 'points_count' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th onClick={() => handleSort('last_active')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                                    Last Active {sortColumn === 'last_active' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No users found</td></tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const badge = getBadge(user.trust_score);
                                    return (
                                        <tr
                                            key={user.id}
                                            style={{
                                                borderBottom: '1px solid #334155',
                                                color: '#cbd5e1',
                                                background: user.blocked ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                                opacity: user.blocked ? 0.7 : 1
                                            }}
                                        >
                                            {/* Nickname */}
                                            <td style={{ padding: '0.6rem 0.75rem' }}>
                                                <div style={{ fontWeight: 500, color: '#e2e8f0' }}>
                                                    {user.nickname || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Anonymous</span>}
                                                </div>
                                                <code style={{ fontSize: '0.65rem', color: '#64748b' }}>{user.id.substring(0, 10)}...</code>
                                            </td>

                                            {/* Badge */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    background: `${badge.color}20`,
                                                    border: `1px solid ${badge.color}40`,
                                                    borderRadius: '999px',
                                                    padding: '0.25rem 0.6rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: badge.color
                                                }}>
                                                    <span style={{ fontSize: '0.9rem' }}>{badge.icon}</span>
                                                    {badge.name}
                                                </div>
                                            </td>

                                            {/* Trust Score with +/- buttons */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <button
                                                        onClick={() => handleUpdateTrustScore(user.id, -1)}
                                                        style={{
                                                            width: '22px', height: '22px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            borderRadius: '4px',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700,
                                                            lineHeight: 1
                                                        }}
                                                    >−</button>
                                                    <span style={{
                                                        minWidth: '32px',
                                                        textAlign: 'center',
                                                        fontWeight: 600,
                                                        color: badge.color,
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {user.trust_score || 0}
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdateTrustScore(user.id, 1)}
                                                        style={{
                                                            width: '22px', height: '22px',
                                                            background: 'rgba(34, 197, 94, 0.1)',
                                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                                            borderRadius: '4px',
                                                            color: '#22c55e',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700,
                                                            lineHeight: 1
                                                        }}
                                                    >+</button>
                                                </div>
                                                {badge.nextAt && (
                                                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
                                                        {badge.nextAt - (user.trust_score || 0)} to next
                                                    </div>
                                                )}
                                            </td>

                                            {/* Points */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#94a3b8' }}>
                                                {user.points_count || 0}
                                            </td>

                                            {/* Last Active */}
                                            <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                {formatDate(user.last_active)}
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                                {user.blocked ? (
                                                    <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600 }}>BLOCKED</span>
                                                ) : (
                                                    <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600 }}>ACTIVE</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                    {user.blocked ? (
                                                        <button onClick={() => handleUnblockUser(user.id)} disabled={actionLoading} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Unblock</button>
                                                    ) : (
                                                        <button onClick={() => handleBlockUser(user.id)} disabled={actionLoading} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Block</button>
                                                    )}
                                                    <button onClick={() => handleDeleteUser(user.id)} disabled={actionLoading} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
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

            {/* Footer */}
            <div style={{ padding: '0.5rem 0', marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                Showing {filteredUsers.length} of {users.length} users
            </div>
        </div>
    );
};

export default Users;
