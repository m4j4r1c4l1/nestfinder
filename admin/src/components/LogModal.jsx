import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../api';

const LogModal = ({ user, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(true);
    const [lastBatchId, setLastBatchId] = useState(0);
    const contentRef = useRef(null);
    const scrollRef = useRef(null);
    const pollingRef = useRef(null);
    const isUserScrollingRef = useRef(false);

    const fetchLogs = async (sinceId = 0) => {
        try {
            const res = await adminApi.getUserLogs(user.id, sinceId);
            if (sinceId === 0) {
                setLogs(res.logs || []);
                setLastBatchId(res.max_id || 0);
                setError(null); // Clear any previous error on full refresh
            } else if (res.logs && res.logs.length > 0) {
                setLogs(prev => [...prev, ...res.logs]);
                setLastBatchId(res.max_id);
            }
        } catch (err) {
            if (sinceId === 0) {
                setError(err.message);
            } else {
                console.warn('Log polling failed:', err.message);
                // Don't set global error state for background polls to avoid UI jitter
                // Maybe a small transient indicator?
            }
        } finally {
            if (sinceId === 0) setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (user) {
            fetchLogs(0);
        }
    }, [user]);

    // Polling fetch (tail -f)
    useEffect(() => {
        if (isFollowing && user) {
            pollingRef.current = setInterval(() => {
                fetchLogs(lastBatchId);
            }, 3000); // Poll every 3 seconds
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isFollowing, user, lastBatchId]);

    // Auto-scroll logic
    useEffect(() => {
        if (isFollowing && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isFollowing]);

    // Detect manual scroll up to pause following maybe? 
    // Actually, user requested a specific "stop" button or modal close.
    // I'll stick to the toggle button for clarity.

    // Syntax Highlighting parser
    const parseLogLine = (line) => {
        let ts, level, category, msg, data;

        // Task #108: Handle both Object (new) and String (legacy) formats
        if (typeof line === 'object' && line !== null) {
            ({ ts, level, category, msg, data } = line);
        } else if (typeof line === 'string') {
            // Check if it's a JSON string disguised as a string
            if (line.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(line);
                    ({ ts, level, category, msg, data } = parsed);
                } catch {
                    // Fallback to regex if parsing fails
                }
            }

            if (!ts) {
                // Legacy Regex: "DD-MM-YYYY - HH:MM:SS CET/CEST [Module][Action] Message"
                const regex = /^(\d{2}-\d{2}-\d{4} - \d{2}:\d{2}:\d{2}) (CET|CEST) \[([\w\s]+)\]\[([\w\s]+)\] (.+)$/;
                const match = line.match(regex);
                if (!match) return <span style={{ color: '#94a3b8' }}>{line}</span>;
                [_, ts, category, level, msg] = match; // Note: legacy mapped Action to msg usually
            }
        } else {
            return <span style={{ color: '#ef4444' }}>[INVALID LOG ENTRY]</span>;
        }

        // --- Formatting Helpers ---

        // 1. Timezone Correction (Task #108: Always show CET/CEST)
        const formatTime = (iso) => {
            if (!iso) return 'N/A';
            const date = new Date(iso);
            return date.toLocaleString('en-GB', {
                timeZone: 'Europe/Paris',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) + ' CET';
        };

        // 2. Vibrant Level Colors
        const getLevelStyles = (lvl) => {
            const l = lvl?.toLowerCase() || '';
            if (l.includes('error') || l.includes('fail')) return { color: '#ef4444', label: 'ERROR' };
            if (l.includes('warn')) return { color: '#fbbf24', label: 'WARN' };
            if (l.includes('debug')) return { color: '#a855f7', label: 'DEBUG' };
            if (l.includes('system')) return { color: '#10b981', label: 'SYSTEM' };
            return { color: '#3b82f6', label: 'INFO' };
        };

        const { color: levelColor, label: levelLabel } = getLevelStyles(level);

        return (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                {/* Timestamp */}
                <span style={{ color: '#64748b', fontSize: '0.85em', minWidth: '85px' }}>
                    {formatTime(ts)}
                </span>

                {/* Level Badge */}
                <span style={{
                    color: levelColor,
                    fontWeight: 800,
                    fontSize: '0.7em',
                    letterSpacing: '0.05em',
                    border: `1px solid ${levelColor}44`,
                    padding: '1px 4px',
                    borderRadius: '3px',
                    minWidth: '50px',
                    textAlign: 'center',
                    backgroundColor: `${levelColor}11`
                }}>
                    {levelLabel}
                </span>

                {/* Hierarchy: [Category] */}
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                    [{category || 'General'}]
                </span>

                {/* Message */}
                <span style={{ color: '#f8fafc', flex: 1 }}>
                    {msg}
                </span>

                {/* Data Payload (Task #108) */}
                {data && (
                    <div style={{
                        width: '100%',
                        marginTop: '4px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        borderLeft: `2px solid ${levelColor}`,
                        color: levelColor === '#3b82f6' ? '#94a3b8' : levelColor, // Dim info data
                        fontSize: '0.85em',
                        borderRadius: '0 4px 4px 0',
                        fontFamily: 'monospace',
                        overflowX: 'auto'
                    }}>
                        <span style={{ opacity: 0.6, marginRight: '8px' }}>DATA:</span>
                        {typeof data === 'object' ? JSON.stringify(data) : data}
                    </div>
                )}
            </div>
        );
    };

    if (!user) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                width: '90%',
                maxWidth: '1000px',
                height: '85vh',
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1e293b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>📃</div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                                Debug Logs
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                {user.nickname} • {user.id}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '4px',
                        lineHeight: 1
                    }}>
                        &times;
                    </button>
                </div>

                {/* Sub-header with Follow Toggle */}
                <div style={{
                    padding: '8px 1.5rem',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => setIsFollowing(!isFollowing)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: isFollowing ? '#059669' : 'transparent',
                            color: isFollowing ? 'white' : '#94a3b8',
                            border: `1px solid ${isFollowing ? '#059669' : '#334155'}`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isFollowing ? '#34d399' : '#64748b',
                            boxShadow: isFollowing ? '0 0 8px #34d399' : 'none',
                            animation: isFollowing ? 'pulse 1.5s infinite' : 'none'
                        }} />
                        {isFollowing ? 'FOLLOWING (tail -f)' : 'FOLLOW OFF'}
                    </button>
                    {isFollowing && (
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            Auto-refreshing live...
                        </span>
                    )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '0', overflowY: 'auto', scrollBehavior: 'smooth' }} ref={scrollRef}>
                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            Loading logs...
                        </div>
                    ) : error ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                            Error: {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            No logs found for this user.
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            {logs.map((log, index) => (
                                <div key={index} style={{
                                    padding: '4px 8px',
                                    borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                                    marginBottom: '2px',
                                    borderRadius: '4px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}>
                                    {parseLogLine(log)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid #334155',
                    background: '#1e293b',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }}>
                    <span style={{ marginRight: 'auto', color: '#64748b', fontSize: '0.85rem', alignSelf: 'center' }}>
                        {logs.length} entries
                    </span>
                    <button onClick={onClose} style={{
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: '1px solid #475569',
                        color: '#e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                        Close
                    </button>
                </div>
            </div>
            <style>
                {`
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}
            </style>
        </div>
    );
};

export default LogModal;
