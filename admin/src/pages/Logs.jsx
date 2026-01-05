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
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
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
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    backgroundColor: '#0f172a', // Dark theme bg
                    border: '1px solid #334155', // Dark theme border
                    color: '#e2e8f0', // Light text
                    borderRadius: '6px',
                    transition: 'border-color 0.2s'
                }}
            />
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '100%', // Match parent width
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    zIndex: 50,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    marginTop: '4px'
                }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelect(opt)}
                                style={{
                                    padding: '0.5rem 0.75rem',
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
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                                        {typeof opt === 'object' ? (
                                            <>
                                                <span style={{ fontWeight: 700, marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
                                                    {opt.nickname || 'Anonymous'}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace',
                                                    flex: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'
                                                }}>
                                                    {opt.id}
                                                </span>
                                            </>
                                        ) : (
                                            <span>{opt}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Helpers ---

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
        case 'notification_sent': return '250, 204, 21'; // Yellow
        case 'push_notification_sent': return '6, 182, 212'; // Cyan-500 (Distinct from Green)
        case 'push_notifications_sent': return '6, 182, 212'; // Cyan-500
        case 'notifications_cleared': return '253, 224, 71'; // Light Yellow
        case 'push_subscribe': return '147, 51, 234'; // Purple-600
        case 'broadcast_created': return '234, 179, 8'; // Yellow-600
        case 'broadcast_deleted': return '194, 65, 12'; // dark Orange
        case 'history_cleared': return '120, 113, 108'; // Stone
        case 'trust_score_updated': return '202, 138, 4'; // Yellow-600
        case 'Trust_score_updated': return '202, 138, 4'; // Case variant

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
        boxShadow: isImportant ? `0 0 10px rgba(${baseColor}, 0.1)` : 'none',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        maxWidth: '100%', // Flexible width
        display: 'inline-block',
        textAlign: 'center',
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: 600
    };
};

// --- Log Detail Modal ---
const LogDetailModal = ({ log, onClose }) => {
    if (!log) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.4)', padding: '1rem'
        }} onClick={onClose}>
            <div className="card" onClick={e => e.stopPropagation()} style={{
                width: '37.5vw', // Reduced to half as requested
                maxWidth: '1500px', // Match Main Container MaxWidth
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)'
            }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: '12px 12px 0 0' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🥚 Log Details
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>

                        {/* 1. Header Info */}
                        {/* 1. Header Info: Time (Left), User (Center), Action (Right) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'start', gap: '1rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: '1rem' }}>Time</label>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2, marginTop: '0.5rem' }}>
                                    {(() => {
                                        const d = new Date(log.created_at);
                                        const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
                                        const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
                                        const parisOffset = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
                                        const isDST = Math.max(jan, jul) !== parisOffset;
                                        const hours = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });

                                        return (
                                            <>
                                                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#e2e8f0' }}>{d.toLocaleDateString()}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{hours} {isDST ? 'CEST' : 'CET'}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: '1rem' }}>User</label>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginTop: '0.5rem', lineHeight: 1.2 }}>{log.user_nickname || 'Anonymous'}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontFamily: 'monospace', fontStyle: 'italic' }}>{log.user_id}</div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: '1rem' }}>Action</label>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <span className="badge" style={getActionStyle(log.action)}>
                                        {log.action}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '1px', background: '#334155' }} />

                        {/* 2. Metadata / Details */}
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>Payload Details</label>

                            <div style={{
                                background: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
                                padding: '1rem',
                                fontFamily: 'monospace', fontSize: '0.85rem', color: '#cbd5e1',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap' // formatted JSON
                            }}>
                                {log.metadata ? JSON.stringify(log.metadata, null, 2) : 'No additional details'}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogsCount, setTotalLogsCount] = useState(0);
    const [selectedLog, setSelectedLog] = useState(null); // For modal
    const [filters, setFilters] = useState({ limit: 30 });
    const [exporting, setExporting] = useState(false);
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

    // Resizable columns state
    const [columnWidths, setColumnWidths] = useState(() => {
        const defaults = {
            time: 140,
            action: 200, // Reduced from 260
            user: 180, // Reduced from 200
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



    const [availableActions, setAvailableActions] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getLogs({ ...filters, page, sortBy: sortColumn, sortDir: sortDirection });
            setLogs(data.logs);
            setTotalPages(data.pagination.pages);
            setTotalLogsCount(data.pagination.total || 0);
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
        <div style={{ width: '75%', maxWidth: '1500px', margin: '0 auto', padding: '1.5rem 1rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>🥚 Logs</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>View and filter system activity and audit trails</p>
                </div>

            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Filters Toolbar - Moved above table */}
                    <div style={{
                        padding: '1rem', borderBottom: '1px solid #334155',
                        display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                        background: '#1e293b'
                    }}>
                        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                            <SearchableDropdown
                                options={availableActions}
                                value={filters.action}
                                onChange={(val) => setFilters(prev => ({ ...prev, action: val }))}
                                placeholder="Filter Action"
                                renderItem={(action) => (
                                    <span className="badge" style={{
                                        ...getActionStyle(action),
                                        maxWidth: '100%'
                                    }}>
                                        {action}
                                    </span>
                                )}
                                style={{ flex: 1, minWidth: '150px' }}
                            />
                            <SearchableDropdown
                                options={availableUsers}
                                value={filters.userId}
                                onChange={(val) => setFilters(prev => ({ ...prev, userId: val }))}
                                placeholder="Filter User"
                                style={{ flex: 1, minWidth: '150px' }}
                            />
                        </div>
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'background 0.2s',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; }}
                        >
                            <span>📥</span> {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
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
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Server-side sorting - logs already sorted */}
                                {logs.map(log => (
                                    <tr
                                        key={log.id}
                                        style={{ borderBottom: '1px solid #334155', color: '#cbd5e1', cursor: 'pointer', transition: 'background 0.1s' }}
                                        onClick={() => setSelectedLog(log)}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                    {(() => {
                                                        const d = new Date(log.created_at);
                                                        const hours = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris', hour12: false });
                                                        // Determine CET vs CEST based on DST
                                                        const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
                                                        const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
                                                        const parisOffset = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTimezoneOffset();
                                                        const isDST = Math.max(jan, jul) !== parisOffset;
                                                        return `${hours} ${isDST ? 'CEST' : 'CET'}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <span className="badge" style={getActionStyle(log.action)}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 500, color: '#e2e8f0', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_nickname || 'Anonymous'}>
                                                {(log.user_nickname || '').length > 30 ? (log.user_nickname.substring(0, 30) + '...') : (log.user_nickname || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Anonymous</span>)}
                                            </div>
                                            <code style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_id}>
                                                {(log.user_id || '').length > 30 ? (log.user_id.substring(0, 30) + '...') : (log.user_id || 'N/A')}
                                            </code>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {(() => {
                                                // log.metadata is already parsed by the API
                                                const meta = log.metadata;

                                                if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
                                                    // Filter out sensitive fields and show raw JSON format
                                                    const filtered = Object.fromEntries(
                                                        Object.entries(meta).filter(([k]) => !['password', 'token'].includes(k.toLowerCase()))
                                                    );
                                                    const rawJson = JSON.stringify(filtered);

                                                    return (
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: '#94a3b8',
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            width: '100%'
                                                        }} title={rawJson}>
                                                            {rawJson}
                                                        </div>
                                                    );
                                                }

                                                return <span style={{ color: '#64748b', fontStyle: 'italic' }}>—</span>;
                                            })()}
                                        </td>
                                    </tr>
                                ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination - Buttons */}
                {/* Pagination - Matching Messages.jsx Style */}

            </div>

            {/* Pagination - Buttons (Moved Outside Card) */}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0.75rem 0', marginTop: '0.5rem', borderTop: '1px solid #334155' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Showing {logs.length === 0 ? 0 : (page - 1) * (filters.limit || 30) + 1}-{Math.min((page - 1) * (filters.limit || 30) + 1 + logs.length - 1, totalLogsCount)} of {totalLogsCount} logs
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', visibility: totalPages > 1 ? 'visible' : 'hidden' }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: page <= 1 ? '#1e293b' : '#334155', color: page <= 1 ? '#64748b' : '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                        ◀ Prev
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', minWidth: '80px', textAlign: 'center' }}>
                        Page {page} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                        disabled={page >= totalPages}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: page >= totalPages ? '#1e293b' : '#334155', color: page >= totalPages ? '#64748b' : '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next ▶
                    </button>
                </div>
                {/* Empty right column to balance grid */}
                <div></div>
            </div>

            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>

    );
};

export default Logs;
