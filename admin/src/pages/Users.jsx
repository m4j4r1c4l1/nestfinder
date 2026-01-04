import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api';

// Badge system - matching client-side thresholds
const getBadge = (score = 0) => {
    if (score >= 50) return { name: 'Eagle', icon: '🦅', color: '#f59e0b', nextAt: null };
    if (score >= 30) return { name: 'Owl', icon: '🦉', color: '#8b5cf6', nextAt: 50 };
    if (score >= 10) return { name: 'Sparrow', icon: '🐦', color: '#3b82f6', nextAt: 30 };
    return { name: 'Hatchling', icon: '🥚', color: '#94a3b8', nextAt: 10 };
};

// CET/CEST timestamp formatter (matching Sent History table)
const formatTimestampCET = (isoString) => {
    if (!isoString) return { date: '—', time: '' };
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
    // Determine CET vs CEST
    const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
    const parisOffset = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
    const isDST = Math.max(jan, jul) !== parisOffset;
    return { date: dateStr, time: `${timeStr} ${isDST ? 'CEST' : 'CET'}` };
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [sortColumn, setSortColumn] = useState('last_active');
    const [sortDirection, setSortDirection] = useState('desc');
    const [page, setPage] = useState(1);
    const pageSize = 30;
    const [badgePickerUser, setBadgePickerUser] = useState(null); // User ID for badge picker dropdown
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchWrapperRef = useRef(null);

    // Click outside handler for search dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Badge options with minimum trust scores
    const badgeOptions = [
        { name: 'Hatchling', icon: '🥚', color: '#94a3b8', minScore: 0 },
        { name: 'Sparrow', icon: '🐦', color: '#3b82f6', minScore: 10 },
        { name: 'Owl', icon: '🦉', color: '#8b5cf6', minScore: 30 },
        { name: 'Eagle', icon: '🦅', color: '#f59e0b', minScore: 50 }
    ];

    // Column widths (resizable, persisted to localStorage)
    const [columnWidths, setColumnWidths] = useState(() => {
        const defaults = { nickname: 180, badge: 130, trust: 120, points: 80, lastActive: 150, status: 90, actions: 140 };
        try {
            const saved = localStorage.getItem('admin_users_columns');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch { return defaults; }
    });
    const [resizing, setResizing] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    // Resize handlers
    const handleResizeStart = (e, column) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(column);
        setStartX(e.clientX);
        setStartWidth(columnWidths[column] || 100);
    };

    useEffect(() => {
        if (!resizing) return;
        const handleMouseMove = (e) => {
            const diff = e.clientX - startX;
            const newWidth = Math.max(60, startWidth + diff);
            setColumnWidths(prev => {
                const updated = { ...prev, [resizing]: newWidth };
                localStorage.setItem('admin_users_columns', JSON.stringify(updated));
                return updated;
            });
        };
        const handleMouseUp = () => setResizing(null);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, startX, startWidth]);

    const ResizeHandle = ({ column }) => (
        <div
            onMouseDown={(e) => handleResizeStart(e, column)}
            style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px',
                cursor: 'col-resize', background: resizing === column ? 'rgba(59,130,246,0.5)' : 'transparent',
                zIndex: 10
            }}
            onMouseEnter={(e) => { if (!resizing) e.currentTarget.style.background = 'rgba(59,130,246,0.3)'; }}
            onMouseLeave={(e) => { if (!resizing) e.currentTarget.style.background = 'transparent'; }}
        />
    );

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

    useEffect(() => { fetchUsers(); }, []);

    // Sort users
    const sortedUsers = [...users].sort((a, b) => {
        let aVal = a[sortColumn], bVal = b[sortColumn];
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

    // Filter and paginate
    const filteredUsers = sortedUsers.filter(user => {
        const search = searchTerm.toLowerCase();
        return (user.nickname || '').toLowerCase().includes(search) ||
            (user.id || '').toLowerCase().includes(search) ||
            getBadge(user.trust_score).name.toLowerCase().includes(search);
    });
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const handleDeleteUser = async (userId) => {
        // if (!confirm('Delete this user and all their data?')) return;
        setActionLoading(true);
        try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) { alert('Failed: ' + err.message); }
        finally { setActionLoading(false); }
    };

    const handleBlockUser = async (userId) => {
        // if (!confirm('Block this user?')) return;
        setActionLoading(true);
        try {
            await adminApi.blockUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: true } : u));
        } catch (err) { alert('Failed: ' + err.message); }
        finally { setActionLoading(false); }
    };

    const handleUnblockUser = async (userId) => {
        setActionLoading(true);
        try {
            await adminApi.unblockUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: false } : u));
        } catch (err) { alert('Failed: ' + err.message); }
        finally { setActionLoading(false); }
    };

    const handleUpdateTrustScore = async (userId, delta) => {
        const user = users.find(u => u.id === userId);
        const newScore = Math.max(0, (user.trust_score || 0) + delta);
        try {
            await adminApi.updateUserTrustScore(userId, newScore);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, trust_score: newScore } : u));
        } catch (err) { alert('Failed: ' + err.message); }
    };

    // Badge counts for stats
    const badgeCounts = {
        eagle: users.filter(u => (u.trust_score || 0) >= 50).length,
        owl: users.filter(u => (u.trust_score || 0) >= 30 && (u.trust_score || 0) < 50).length,
        sparrow: users.filter(u => (u.trust_score || 0) >= 10 && (u.trust_score || 0) < 30).length,
        hatchling: users.filter(u => (u.trust_score || 0) < 10).length,
    };

    return (
        <div style={{ width: '75%', maxWidth: '1500px', margin: '0 auto', padding: '1.5rem 1rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🦚 Users
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                    Manage users, badges, and trust scores
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{users.length}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.25rem', fontWeight: 600 }}>
                        <span>🦅 Eagle</span>
                        <span style={{ color: '#ffffff' }}>≥50</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{badgeCounts.eagle}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8b5cf6', marginBottom: '0.25rem', fontWeight: 600 }}>
                        <span>🦉 Owl</span>
                        <span style={{ color: '#ffffff' }}>≥30</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{badgeCounts.owl}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem', fontWeight: 600 }}>
                        <span>🐦 Sparrow</span>
                        <span style={{ color: '#ffffff' }}>≥10</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{badgeCounts.sparrow}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05))', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: 600 }}>
                        <span>🥚 Hatchling</span>
                        <span style={{ color: '#ffffff' }}>&lt;10</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#94a3b8' }}>{badgeCounts.hatchling}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>🚫 Blocked</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{users.filter(u => u.blocked).length}</div>
                </div>
            </div>

            {/* Search Bar with Dropdown */}
            <div style={{ marginBottom: '1rem', position: 'relative' }} ref={searchWrapperRef}>
                <input
                    type="text"
                    placeholder="🔍 Search by nickname, ID, or badge..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); setShowSearchDropdown(true); }}
                    onFocus={() => setShowSearchDropdown(true)}
                    className="form-control-search"
                    style={{
                        width: '100%', maxWidth: '400px', padding: '0.75rem 1rem',
                        background: '#1e293b', // Lighter than page bg
                        border: '1px solid #475569', // More visible border
                        borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                    }}
                />
                {/* Search Suggestions Dropdown */}
                {showSearchDropdown && searchTerm && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        maxWidth: '400px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0 0 8px 8px',
                        zIndex: 50,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        {filteredUsers.slice(0, 10).map(user => (
                            <div
                                key={user.id}
                                onClick={() => {
                                    setSearchTerm(user.nickname || user.id);
                                    setShowSearchDropdown(false);
                                }}
                                style={{
                                    padding: '0.6rem 1rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontSize: '1rem' }}>{getBadge(user.trust_score).icon}</span>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.85rem' }}>
                                        {(user.nickname || 'Anonymous').substring(0, 30)}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                        {user.id.substring(0, 12)}... • {getBadge(user.trust_score).name}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                No users found
                            </div>
                        )}
                        {filteredUsers.length > 10 && (
                            <div style={{ padding: '0.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', borderTop: '1px solid #334155' }}>
                                + {filteredUsers.length - 10} more results
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                                <th onClick={() => handleSort('nickname')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', width: columnWidths.nickname, position: 'relative' }}>
                                    Nickname {sortColumn === 'nickname' && (sortDirection === 'asc' ? '▲' : '▼')}
                                    <ResizeHandle column="nickname" />
                                </th>
                                <th onClick={() => handleSort('trust_score')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'center', width: columnWidths.badge, position: 'relative' }}>
                                    Badge {sortColumn === 'trust_score' && (sortDirection === 'asc' ? '▲' : '▼')}
                                    <ResizeHandle column="badge" />
                                </th>
                                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'center', width: columnWidths.trust, position: 'relative' }}>
                                    Trust Score
                                    <ResizeHandle column="trust" />
                                </th>
                                <th onClick={() => handleSort('points_count')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'center', width: columnWidths.points, position: 'relative' }}>
                                    Points {sortColumn === 'points_count' && (sortDirection === 'asc' ? '▲' : '▼')}
                                    <ResizeHandle column="points" />
                                </th>
                                <th onClick={() => handleSort('last_active')} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'center', width: columnWidths.lastActive, position: 'relative' }}>
                                    Last Active {sortColumn === 'last_active' && (sortDirection === 'asc' ? '▲' : '▼')}
                                    <ResizeHandle column="lastActive" />
                                </th>
                                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'center', width: columnWidths.status, position: 'relative' }}>
                                    Status
                                    <ResizeHandle column="status" />
                                </th>
                                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'center', width: columnWidths.actions, position: 'relative' }}>
                                    Actions
                                    <ResizeHandle column="actions" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No users found</td></tr>
                            ) : (
                                paginatedUsers.map(user => {
                                    const badge = getBadge(user.trust_score);
                                    const lastActive = formatTimestampCET(user.last_active);
                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #334155', color: '#cbd5e1', background: user.blocked ? 'rgba(239, 68, 68, 0.05)' : 'transparent', opacity: user.blocked ? 0.7 : 1 }}>
                                            {/* Nickname + ID */}
                                            <td style={{ padding: '0.6rem 0.75rem' }}>
                                                <div style={{ fontWeight: 500, color: '#e2e8f0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.nickname || 'Anonymous'}>
                                                    {(user.nickname || '').length > 30 ? (user.nickname.substring(0, 30) + '...') : (user.nickname || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Anonymous</span>)}
                                                </div>
                                                <code style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.id}>
                                                    {user.id.length > 30 ? (user.id.substring(0, 30) + '...') : user.id}
                                                </code>
                                            </td>
                                            {/* Badge - Clickable */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', position: 'relative' }}>
                                                <div
                                                    onClick={() => setBadgePickerUser(badgePickerUser === user.id ? null : user.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: `${badge.color}20`, border: `1px solid ${badge.color}40`, borderRadius: '999px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, color: badge.color, cursor: 'pointer', transition: 'transform 0.1s' }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    title="Click to change badge"
                                                >
                                                    <span style={{ fontSize: '0.9rem' }}>{badge.icon}</span>
                                                    {badge.name}
                                                    <span style={{ fontSize: '0.6rem', marginLeft: '2px', opacity: 0.7 }}>▼</span>
                                                </div>
                                                {/* Badge Picker Dropdown */}
                                                {badgePickerUser === user.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        background: '#1e293b',
                                                        border: '1px solid #475569',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        zIndex: 100,
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                                        minWidth: '130px'
                                                    }}>
                                                        {badgeOptions.map(opt => (
                                                            <div
                                                                key={opt.name}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateTrustScore(user.id, opt.minScore - (user.trust_score || 0));
                                                                    setBadgePickerUser(null);
                                                                }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    padding: '0.4rem 0.6rem',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    background: badge.name === opt.name ? `${opt.color}20` : 'transparent',
                                                                    color: opt.color,
                                                                    fontWeight: 500,
                                                                    fontSize: '0.8rem',
                                                                    transition: 'background 0.15s'
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = `${opt.color}30`}
                                                                onMouseLeave={e => e.currentTarget.style.background = badge.name === opt.name ? `${opt.color}20` : 'transparent'}
                                                            >
                                                                <span style={{ fontSize: '1rem' }}>{opt.icon}</span>
                                                                <span>{opt.name}</span>
                                                                <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: 'auto' }}>({opt.minScore}+)</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            {/* Trust Score with +/- */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <button onClick={() => handleUpdateTrustScore(user.id, -1)} style={{ width: '22px', height: '22px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1 }}>−</button>
                                                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 600, color: badge.color, fontSize: '0.85rem' }}>{user.trust_score || 0}</span>
                                                    <button onClick={() => handleUpdateTrustScore(user.id, 1)} style={{ width: '22px', height: '22px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '4px', color: '#22c55e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1 }}>+</button>
                                                </div>
                                                {badge.nextAt && <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>{badge.nextAt - (user.trust_score || 0)} to next</div>}
                                            </td>
                                            {/* Points */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#94a3b8' }}>{user.points_count || 0}</td>
                                            {/* Last Active - Stacked CET/CEST format */}
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{lastActive.date}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{lastActive.time}</span>
                                                </div>
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

            {/* Pagination Footer - Grid for Left Text + Center Buttons */}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0.75rem 0', marginTop: '0.5rem', borderTop: '1px solid #334155' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Showing {paginatedUsers.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min((page - 1) * pageSize + 1 + paginatedUsers.length - 1, filteredUsers.length)} of {filteredUsers.length} users
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
        </div>
    );
};

export default Users;
