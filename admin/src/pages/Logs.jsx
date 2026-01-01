import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ limit: 50 });
    const [exporting, setExporting] = useState(false);
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

    // Helper to get matching colors for actions (Vibrant Warm Palette)
    // Returns solid RGB values for text/border
    const getActionBaseColor = (action) => {
        if (!action) return '148, 163, 184'; // Slate-400 (Grey)
        const a = action.toLowerCase();

        // Admin actions -> RED (User request)
        if (a.includes('admin') && !a.includes('notification')) return '239, 68, 68'; // Red-500

        // Notifications -> YELLOW WARM (User request)
        if (a.includes('notification')) return '234, 179, 8'; // Yellow-500 (Warm Amber)

        // Auth/Registration -> BLUE (User request)
        if (a.includes('login') || a.includes('register')) return '59, 130, 246'; // Blue-500

        // Creation/Submission/Confirmation -> GREEN (User request)
        if (a.includes('create') || a.includes('submit') || a.includes('confirm') || a.includes('validate')) return '34, 197, 94'; // Green-500

        // Deletion/Rejection -> PURPLE (Distinct from Admin Red)
        if (a.includes('delete') || a.includes('reject') || a.includes('deactivate')) return '168, 85, 247'; // Purple-500

        // Updates -> ORANGE
        if (a.includes('update') || a.includes('edit')) return '249, 115, 22'; // Orange-500

        return '148, 163, 184'; // Default Grey
    };

    const getActionStyle = (action) => {
        const baseColor = getActionBaseColor(action);
        const isImportant = action && action.toLowerCase().includes('admin');

        return {
            background: `rgba(${baseColor}, 0.15)`, // Subtle tinted background
            color: `rgb(${baseColor})`, // Solid vibrant text
            border: `1px solid rgba(${baseColor}, 0.3)`, // Subtle matching border
            boxShadow: isImportant ? `0 0 10px rgba(${baseColor}, 0.2)` : 'none',
            textShadow: '0 0 1px rgba(0,0,0,0.5)' // Typos happen, legible text is key
        };
    };

    const [availableActions, setAvailableActions] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getLogs({ ...filters, page, sortBy: sortColumn, sortDir: sortDirection });
            setLogs(data.logs);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [actionsData, usersData] = await Promise.all([
                    adminApi.getLogActions(),
                    adminApi.getUsers()
                ]);
                setAvailableActions(actionsData.actions);
                setAvailableUsers(usersData.users);
            } catch (err) {
                console.error('Failed to load filters', err);
            }
        };
        loadFilters();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, filters, sortColumn, sortDirection]);

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const response = await fetch('/api/admin/logs/export?format=csv', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nestfinder-logs.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export logs');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <div className="flex-between flex-center mb-4">
                <h2>System Logs</h2>
                <div className="flex gap-2">
                    <input
                        list="actionOptions"
                        type="text"
                        placeholder="Filter by Action..."
                        className="form-control"
                        onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value || undefined }))}
                        style={{ width: '200px' }}
                    />
                    <datalist id="actionOptions">
                        {availableActions.map(action => (
                            <option key={action} value={action} />
                        ))}
                    </datalist>

                    <input
                        list="userOptions"
                        type="text"
                        placeholder="Filter by User ID..."
                        className="form-control"
                        onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value || undefined }))}
                        style={{ width: '200px' }}
                    />
                    <datalist id="userOptions">
                        {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.nickname || 'Anonymous'} ({user.id.substring(0, 8)})</option>
                        ))}
                    </datalist>
                    <button
                        className="btn btn-secondary"
                        onClick={handleExportCSV}
                        disabled={exporting}
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, maxHeight: 'calc(100vh - 140px)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                                <th
                                    onClick={() => { setSortColumn('created_at'); setSortDirection(d => sortColumn === 'created_at' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }}
                                    style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none', minWidth: '170px' }}
                                >
                                    Time {sortColumn === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th
                                    onClick={() => { setSortColumn('action'); setSortDirection(d => sortColumn === 'action' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    Action {sortColumn === 'action' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th
                                    onClick={() => { setSortColumn('user_nickname'); setSortDirection(d => sortColumn === 'user_nickname' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                                >
                                    User {sortColumn === 'user_nickname' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Server-side sorting - logs already sorted */}
                            {logs.map(log => {
                                // Timezone fix for display
                                let safeIso = log.created_at;
                                if (typeof safeIso === 'string' && !safeIso.endsWith('Z') && !safeIso.includes('+') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(safeIso)) { safeIso += 'Z'; }
                                const date = new Date(safeIso);

                                return (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{date.toLocaleDateString()}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <span className="badge" style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontWeight: 500,
                                                ...getActionStyle(log.action)
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', verticalAlign: 'middle', color: '#e2e8f0' }}>
                                            {log.user_nickname || <span style={{ color: '#64748b' }}>
                                                {log.user_id?.length > 13 ? `${log.user_id.substring(0, 13)}...` : log.user_id}
                                            </span>}
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#94a3b8', verticalAlign: 'middle' }}>
                                            {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - simple row of icons */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', marginTop: '0.5rem' }}>
                <button
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    style={{ background: 'none', border: 'none', color: page <= 1 ? '#475569' : '#94a3b8', fontSize: '1.2rem', cursor: page <= 1 ? 'default' : 'pointer', padding: '0.25rem' }}
                    title="First Page"
                >
                    ◀◀
                </button>
                <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page <= 1}
                    style={{ background: 'none', border: 'none', color: page <= 1 ? '#475569' : '#94a3b8', fontSize: '1.2rem', cursor: page <= 1 ? 'default' : 'pointer', padding: '0.25rem' }}
                    title="Previous Page"
                >
                    ◀
                </button>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{page} / {totalPages}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                    style={{ background: 'none', border: 'none', color: page >= totalPages ? '#475569' : '#94a3b8', fontSize: '1.2rem', cursor: page >= totalPages ? 'default' : 'pointer', padding: '0.25rem' }}
                    title="Next Page"
                >
                    ▶
                </button>
                <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    style={{ background: 'none', border: 'none', color: page >= totalPages ? '#475569' : '#94a3b8', fontSize: '1.2rem', cursor: page >= totalPages ? 'default' : 'pointer', padding: '0.25rem' }}
                    title="Last Page"
                >
                    ▶▶
                </button>
            </div>
        </div>
    );
};

export default Logs;
