import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ limit: 50 });
    const [exporting, setExporting] = useState(false);

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
            const data = await adminApi.getLogs({ ...filters, page });
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
    }, [page, filters]);

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

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', flex: 1, maxHeight: 'calc(100vh - 180px)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-secondary)', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                <th style={{ padding: '1rem' }}>Time</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                                <th style={{ padding: '1rem' }}>User</th>
                                <th style={{ padding: '1rem' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="badge" style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontWeight: 500,
                                            fontSize: '0.85rem',
                                            ...getActionStyle(log.action)
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {log.user_nickname || <span className="text-muted">{log.user_id?.substring(0, 8)}...</span>}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex-center gap-4 mt-auto" style={{ padding: '1rem' }}>
                <button
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </button>
                <span className="text-muted">Page {page} of {totalPages}</span>
                <button
                    className="btn btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Logs;
