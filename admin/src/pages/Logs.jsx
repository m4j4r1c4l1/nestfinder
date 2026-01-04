import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api';

// --- Custom Searchable Dropdown Component ---
const SearchableDropdown = ({ options, value, onChange, placeholder, renderItem, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Filter options based on search. If no search, show all.
    const filteredOptions = options.filter(opt => {
        const str = typeof opt === 'string' ? opt : (opt.label || opt.id || '');
        return str.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        // Pass specialized value if object, else string directly
        onChange(typeof opt === 'object' ? opt.id : opt);
        setSearchTerm(typeof opt === 'object' ? (opt.nickname || opt.id) : opt);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm || value || ''}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if (!e.target.value) onChange(undefined); // Clear filter on empty
                }}
                onFocus={() => setIsOpen(true)}
                className="form-control"
                style={{
                    width: '100%',
                    padding: '0.25rem 0.5rem', // Keep compact
                    fontSize: '0.8rem',
                    backgroundColor: '#0f172a', // Dark theme bg
                    border: '1px solid #334155', // Dark theme border
                    color: '#e2e8f0', // Light text
                    borderRadius: '4px'
                }}
            />
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '100%', // Match parent width (which is 300px)
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelect(opt)}
                                style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #334155',
                                    transition: 'background 0.1s',
                                    color: '#e2e8f0',
                                    display: 'flex',
                                    justifyContent: renderItem ? 'center' : 'flex-start'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {renderItem ? renderItem(opt) : (
                                    <span style={{ fontSize: '0.85rem' }}>
                                        {typeof opt === 'object' ? `${opt.nickname || 'Anonymous'} (${opt.id.substring(0, 8)})` : opt}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ limit: 50 });
    const [exporting, setExporting] = useState(false);
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

    // Resizable columns state
    const [columnWidths, setColumnWidths] = useState(() => {
        const defaults = {
            time: 140,
            action: 260, // Increased to fit wider badges (220px + padding)
            user: 200,
            details: null // flex
        };
        try {
            const saved = localStorage.getItem('admin_logs_columns');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (e) {
            return defaults;
        }
    });
    const [resizing, setResizing] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

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
            const newWidth = Math.max(40, startWidth + diff);
            setColumnWidths(prev => {
                const updated = { ...prev, [resizing]: newWidth };
                localStorage.setItem('admin_logs_columns', JSON.stringify(updated));
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
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px',
                cursor: 'col-resize', background: resizing === column ? '#3b82f6' : 'transparent', transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3b82f6'}
            onMouseLeave={(e) => { if (resizing !== column) e.target.style.background = 'transparent'; }}
        />
    );

    // Optimized Color Palette for Specific Actions
    // Using HSL-like variations for distinctiveness
    const getActionBaseColor = (action) => {
        if (!action) return '148, 163, 184'; // Slate

        switch (action) {
            // --- Content / Points ---
            case 'submit_point': return '34, 197, 94'; // Is Spring Green
            case 'confirm_point': return '21, 128, 61'; // Deep Green
            case 'validate_point': return '16, 185, 129'; // Emerald
            case 'deactivate_point': return '168, 85, 247'; // Purple
            case 'vote_deactivate_point': return '249, 115, 22'; // Orange
            case 'reactivate_point': return '217, 70, 239'; // Fuchsia
            case 'export_points': return '14, 165, 233'; // Sky Blue
            case 'feedback_submitted': return '236, 72, 153'; // Pink

            // --- Auth / User ---
            case 'login': return '59, 130, 246'; // Blue
            case 'register': return '99, 102, 241'; // Indigo
            case 'update_nickname': return '139, 92, 246'; // Violet
            case 'admin_login': return '239, 68, 68'; // Red
            case 'admin_login_failed': return '153, 27, 27'; // Dark Red
            case 'recovery_key_generated': return '20, 184, 166'; // Teal (Longest)
            case 'identity_recovered': return '234, 179, 8'; // Yellow

            // --- Notifications / Broadcats ---
            case 'notification_sent': return '250, 204, 21'; // Yellow-400
            case 'notifications_cleared': return '253, 224, 71'; // Light Yellow
            case 'broadcast_created': return '251, 146, 60'; // Orange-400
            case 'broadcast_deleted': return '194, 65, 12'; // Deep Orange
            case 'history_cleared': return '120, 113, 108'; // Stone

            // --- System ---
            case 'rate_limit_exceeded': return '87, 83, 78'; // Warm Grey

            default: return '148, 163, 184'; // Default Grey
        }
    };

    const getActionStyle = (action) => {
        const baseColor = getActionBaseColor(action);
        const isImportant = action && (action.includes('admin') || action.includes('failed'));

        return {
            background: `rgba(${baseColor}, 0.15)`,
            color: `rgb(${baseColor})`,
            border: `1px solid rgba(${baseColor}, 0.3)`,
            boxShadow: isImportant ? `0 0 10px rgba(${baseColor}, 0.2)` : 'none',
            textShadow: '0 0 1px rgba(0,0,0,0.5)',
            width: '220px', // Wider fixed width for longest action
            display: 'inline-block',
            textAlign: 'center',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
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
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem' }}>🥚 Logs</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>View and filter system activity and audit trails</p>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                                <th
                                    onClick={() => { setSortColumn('created_at'); setSortDirection(d => sortColumn === 'created_at' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }}
                                    style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: columnWidths.time, position: 'relative' }}
                                >
                                    Time {sortColumn === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    <ResizeHandle column="time" />
                                </th>
                                <th
                                    onClick={() => { setSortColumn('action'); setSortDirection(d => sortColumn === 'action' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', userSelect: 'none', width: columnWidths.action, position: 'relative' }}
                                >
                                    Action {sortColumn === 'action' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    <ResizeHandle column="action" />
                                </th>
                                <th
                                    onClick={() => { setSortColumn('user_nickname'); setSortDirection(d => sortColumn === 'user_nickname' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                                    style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', width: columnWidths.user, position: 'relative' }}
                                >
                                    User {sortColumn === 'user_nickname' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                                    <ResizeHandle column="user" />
                                </th>
                                <th style={{ padding: '0.5rem 1rem', fontWeight: 600, position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Details</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                            <SearchableDropdown
                                                options={availableActions}
                                                value={filters.action}
                                                onChange={(val) => setFilters(prev => ({ ...prev, action: val }))}
                                                placeholder="Filter Action"
                                                renderItem={(action) => (
                                                    <span className="badge" style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontWeight: 500,
                                                        ...getActionStyle(action)
                                                    }}>
                                                        {action}
                                                    </span>
                                                )}
                                                style={{ width: '300px' }}
                                            />
                                            <SearchableDropdown
                                                options={availableUsers}
                                                value={filters.userId}
                                                onChange={(val) => setFilters(prev => ({ ...prev, userId: val }))}
                                                placeholder="Filter User"
                                                style={{ width: '300px' }}
                                            />
                                            <button
                                                className="btn btn-secondary"
                                                onClick={handleExportCSV}
                                                disabled={exporting}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                            >
                                                {exporting ? '...' : 'Export'}
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Server-side sorting - logs already sorted */}
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #334155', color: '#cbd5e1' }}>
                                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    timeZone: 'Europe/Paris',
                                                    timeZoneName: 'short',
                                                    hour12: false
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <span className="badge" style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontWeight: 500,
                                            ...getActionStyle(log.action)
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.user_nickname || 'Anonymous'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {log.user_id ? log.user_id.substring(0, 8) + '...' : 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        {(() => {
                                            // Parse metadata if available
                                            let meta = {};
                                            try {
                                                meta = log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : {};
                                            } catch (e) { meta = {}; }

                                            // Build a readable summary
                                            const parts = [];
                                            if (meta.title) parts.push(meta.title);
                                            if (meta.body) parts.push(meta.body.substring(0, 50) + (meta.body.length > 50 ? '...' : ''));
                                            if (meta.count) parts.push(`${meta.count} users`);
                                            if (meta.target) parts.push(`Target: ${meta.target}`);
                                            if (meta.template) parts.push(`Template: ${meta.template}`);

                                            // Fallback to legacy details field
                                            if (parts.length === 0 && log.details) {
                                                try {
                                                    const details = JSON.parse(log.details);
                                                    const detailStr = Object.entries(details)
                                                        .map(([k, v]) => `${k}: ${v}`)
                                                        .join(', ');
                                                    if (detailStr) parts.push(detailStr);
                                                } catch (e) { }
                                            }

                                            const summary = parts.join(' • ');

                                            return summary ? (
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: '#cbd5e1',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '400px'
                                                }} title={summary}>
                                                    {summary}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#64748b', fontStyle: 'italic' }}>—</span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))
                            }
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
