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
    const [copied, setCopied] = useState(false);

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

    // Syntax Highlighting parser
    const parseLogLine = (line) => {
        let ts, level, category, msg, data;

        // Task #108: Handle both Object (new) and String (legacy) formats
        let dl; // Source Debug Level
        if (typeof line === 'object' && line !== null) {
            ({ ts, level, category, msg, data, dl } = line);
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
                second: '2-digit',
                fractionalSecondDigits: 3 // Task: Add milliseconds
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

        // 3. Source Level Indicator
        const getDlStyle = (sourceLvl) => {
            const s = (sourceLvl || 'default').toLowerCase();
            if (s === 'paranoic') return { color: '#ef4444', char: 'P' };
            if (s === 'aggressive') return { color: '#a855f7', char: 'A' };
            return { color: '#3b82f6', char: 'D' };
        };
        const { color: dlColor, char: dlChar } = getDlStyle(dl);

        return (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                {/* Source Log Level Indicator (D/A/P) */}
                <span title={`Source Level: ${dl || 'Default'}`} style={{
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    color: dlColor,
                    backgroundColor: `${dlColor}22`,
                    border: `1px solid ${dlColor}44`,
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    flexShrink: 0
                }}>
                    {dlChar}
                </span>

                {/* Timestamp */}
                <span style={{ color: '#64748b', fontSize: '0.85em', minWidth: '110px' }}>
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

    const handleCopy = () => {
        const text = logs.map(line => {
            if (typeof line === 'object') {
                const { ts, level, category, msg, data } = line;
                return `${ts} [${category}] [${level}] ${msg} ${data ? JSON.stringify(data) : ''}`;
            }
            return line;
        }).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        });
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <div style={{ fontSize: '1.5rem' }}>📃</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                                Debug Logs
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace', width: '100%', marginTop: '2px' }}>
                                <div>
                                    {user.nickname} • {user.id}
                                </div>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: !user.debug_enabled ? '#64748b' :
                                        user.debug_level === 'paranoic' ? '#ef4444' :
                                            user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6',
                                    boxShadow: user.debug_enabled ? `0 0 6px ${user.debug_level === 'paranoic' ? '#ef4444' :
                                        user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6'
                                        }` : 'none'
                                }} title={`Status: ${user.debug_enabled ? user.debug_level : 'Disabled'}`} />
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
                    padding: '0.75rem 1.5rem',
                    borderTop: '1px solid #334155',
                    background: '#1e293b',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {logs.length} entries
                    </span>

                    <div style={{ textAlign: 'center' }}>
                        {logs.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {(() => {
                                    const firstTs = logs[0].ts;
                                    if (!firstTs) return 'N/A';
                                    const d = new Date(firstTs);
                                    const pad = (n, l = 2) => String(n).padStart(l, '0');
                                    const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                                    const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
                                    return `${datePart} - ${timePart} CET`;
                                })()}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {logs.length > 0 && (
                            <button onClick={handleCopy} style={{
                                padding: '0.4rem 0.8rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem',
                                transition: 'color 0.2s'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>
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
