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
    const [isColorEnabled, setIsColorEnabled] = useState(false);
    const [liveTime, setLiveTime] = useState(new Date());
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [refreshDots, setRefreshDots] = useState('');
    const [animating, setAnimating] = useState(false);

    // --- SVGs ---
    const Icons = {
        Apple: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.3,12.7c0,2.4,2.5,3.6,2.6,3.7c-0.1,0.2-0.5,1.7-1.6,3.3c-1,1.4-2,2.8-3.6,2.8 c-1.5,0-2-0.9-3.7-0.9c-1.8,0-2.3,0.9-3.8,0.9c-1.5,0-2.7-1.5-3.8-3.2c-1.9-2.9-1.6-7-0.1-9.7c1.4-2.4,3.7-2.6,4.9-2.6 c1.7,0,3.1,1,4.1,1c1.1,0,2.6-1.5,4.7-1.3c0.4,0,2.4,0.1,4.2,2.3C21.1,9.3,17.4,10.6,17.3,12.7z M12.9,6.1 c0.8-1,1.3-2.3,1.2-3.8c-1.2,0.1-2.5,0.8-3.3,1.8C10,5,9.6,6.3,9.7,7.7C11,7.8,12.2,7,12.9,6.1z" /></svg>,
        Android: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.72l1.927-3.337c.1691-.2955.0688-.6718-.2256-.8421-.2949-.1691-.6702-.0681-.8404.2268l-1.9161 3.3183c-1.8211-1.0275-4.0792-1.6253-6.5262-1.6253-2.447 0-4.7061.5978-6.5273 1.6253L1.8568 4.6706c-.1691-.2949-.5454-.3959-.8393-.2268-.2955.1703-.3959.5466-.2268.8421l1.927 3.337C.683 10.3802 0 13.062 0 15.9055c0 .1085.0087.2158.0253.3218h23.9493c.0166-.106.0264-.2133.0264-.3218 0-2.8435-.683-5.5253-2.7032-7.2841" /></svg>,
        Windows: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0,3.449L9.124,2.193v8.834H0V3.449z M9.124,12.915v8.892L0,20.555v-7.64H9.124z M10.41,1.968L24,0v11.027H10.41V1.968z M10.41,12.914H24v11.086L10.41,22.03V12.914z" /></svg>,
        Linux: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C9,2,8,4,8,4s-1,2-1,6c0,2,2,3,2,3s1,4,0,5c-1,1-2,1-1,1s-1,2.5,1,2c2-0.5,5-3,5-3s3,2.5,5,3c2,0.5,1-2,1-2s0,0-1-1 c-1-1,0-4,0-5s2-1,2-3s-1-6-1-6S15,2,12,2z M10.5,8C10.5,8,10,8.5,10,9s0.5,1,0.5,1S10,11,9.5,11s-0.5-0.5-0.5-1S9.5,8,10.5,8z M13.5,8C13.5,8,13,8.5,13,9s0.5,1,0.5,1s0.5,1,0,1s-0.5-0.5-0.5-1S12.5,8,13.5,8z" /></svg>,
        Phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
        Browser: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="21.17" y1="8" x2="12" y2="8" /><line x1="3.95" y1="6.06" x2="8.54" y2="14" /><line x1="10.88" y1="21.94" x2="15.46" y2="14" /></svg>
    };

    // Category color map for COLOR toggle
    const CATEGORY_COLORS = {
        System: '#10b981',
        API: '#3b82f6',
        Interaction: '#f59e0b',
        MapView: '#06b6d4',
        Auth: '#8b5cf6',
        Debug: '#6b7280',
        App: '#ec4899',
        Report: '#14b8a6',
        Inbox: '#f472b6',
        Settings: '#a78bfa',
        Home: '#22d3ee',
        Default: '#94a3b8'
    };

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

    // Parse User Agent from logs (Task Phase 2)
    useEffect(() => {
        if (!logs.length) return;

        // Look for the "Debug Mode Activated" log which contains system info
        const initLog = logs.find(l => {
            const msg = typeof l === 'object' ? l.msg : l;
            return msg && msg.includes && msg.includes('Debug Mode Activated');
        });

        if (initLog) {
            let data = typeof initLog === 'object' ? initLog.data : null;
            // If data is stringified JSON in legacy string format
            if (!data && typeof initLog === 'string' && initLog.includes('{')) {
                try { data = JSON.parse(initLog.substring(initLog.indexOf('{'))); } catch { }
            }

            if (data && (data.userAgent || data.platform)) {
                // Simple Parser
                const ua = data.userAgent || '';
                const plat = data.platform || '';

                let os = { icon: 'Windows', name: 'Windows', ver: '' };
                let device = { icon: null, name: null };
                let browser = { icon: 'Browser', name: 'Browser', ver: '' };

                // OS / Platform
                if (plat.includes('Win')) os = { icon: 'Windows', name: 'Windows', ver: '' };
                else if (plat.includes('Mac')) os = { icon: 'Apple', name: 'macOS', ver: '' };
                else if (plat.includes('Linux')) os = { icon: 'Linux', name: 'Linux', ver: '' };
                else if (ua.includes('iPhone') || ua.includes('iPad')) os = { icon: 'Apple', name: 'iOS', ver: '' };
                else if (ua.includes('Android')) os = { icon: 'Android', name: 'Android', ver: '' };

                // Version Extraction (Simple regexes)
                if (os.name === 'iOS') {
                    const match = ua.match(/OS (\d+[._]\d+)/);
                    if (match) os.ver = match[1].replace('_', '.');
                    device = { icon: 'Phone', name: 'iPhone' }; // Assume iPhone if iOS
                } else if (os.name === 'Android') {
                    const match = ua.match(/Android (\d+(\.\d+)?)/);
                    if (match) os.ver = match[1];
                    device = { icon: 'Phone', name: 'Device' };
                } else if (os.name === 'macOS') {
                    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
                    if (match) os.ver = match[1].replace('_', '.');
                } else if (os.name === 'Windows') {
                    // Windows version mapping is messy in UA, simplified
                    if (ua.includes('Windows NT 10.0')) os.ver = '10/11';
                    else if (ua.includes('Windows NT 6.3')) os.ver = '8.1';
                }

                // Browser
                if (ua.includes('Chrome/')) { browser.name = 'Chrome'; browser.ver = ua.split('Chrome/')[1].split(' ')[0]; }
                else if (ua.includes('Firefox/')) { browser.name = 'Firefox'; browser.ver = ua.split('Firefox/')[1]; }
                else if (ua.includes('Safari/') && !ua.includes('Chrome/')) { browser.name = 'Safari'; browser.ver = ua.split('Version/')[1].split(' ')[0]; }
                else if (ua.includes('Edg/')) { browser.name = 'Edge'; browser.ver = ua.split('Edg/')[1]; }

                setDeviceInfo({ os, device, browser });
            }
        }
    }, [logs]);

    // Live Text Animation (Task Phase 2)
    useEffect(() => {
        if (!isFollowing) {
            setRefreshDots('');
            setAnimating(false);
            return;
        }

        // Trigger animation on new logs
        if (logs.length > 0 && isFollowing) {
            setAnimating(true);
            let count = 0;
            const maxCycles = 2; // Twice
            const cycleDur = 3; // 3 steps (. .. ...)
            let step = 0;

            const interval = setInterval(() => {
                step++;
                const dotCount = (step % 4); // 0, 1, 2, 3 (but we want 1,2,3)
                if (dotCount === 0) {
                    // Pause or reset
                    setRefreshDots('');
                } else {
                    setRefreshDots('.'.repeat(dotCount));
                }

                // Stop after 2 full cycles (approx 6-8 ticks)
                if (step >= 8) {
                    clearInterval(interval);
                    setAnimating(false);
                    setRefreshDots(''); // Reset to static
                }
            }, 500); // 0.5s per dot

            return () => clearInterval(interval);
        }
    }, [logs.length, isFollowing]);

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

    // Live timer for footer
    useEffect(() => {
        const timer = setInterval(() => setLiveTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
                <span style={{ color: isColorEnabled ? (CATEGORY_COLORS[category] || CATEGORY_COLORS.Default) : '#94a3b8', fontWeight: 600 }}>
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
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {deviceInfo && (
                                        <>
                                            {deviceInfo.device.name && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {Icons[deviceInfo.device.icon] || Icons.Phone}
                                                    <span>{deviceInfo.device.name}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {Icons[deviceInfo.os.icon] || Icons.Windows}
                                                <span>{deviceInfo.os.name} {deviceInfo.os.ver}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {Icons[deviceInfo.browser.icon] || Icons.Browser}
                                                <span>{deviceInfo.browser.name} {deviceInfo.browser.ver}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
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

                {/* Sub-header with Follow Toggle and COLOR Toggle */}
                <div style={{
                    padding: '8px 1.5rem',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                                backgroundColor: isFollowing ? '#059669' : 'transparent', // Updated Green
                                color: isFollowing ? 'white' : '#94a3b8',
                                border: `1px solid ${isFollowing ? '#059669' : '#334155'}`,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isFollowing ? '#ef4444' : '#64748b', // Red Glow
                                boxShadow: isFollowing ? '0 0 8px #ef4444' : 'none',
                                animation: isFollowing ? 'pulse 1.5s infinite' : 'none'
                            }} />
                            {isFollowing ? 'LIVE' : 'OFF'}
                        </button>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: isFollowing ? 'italic' : 'normal' }}>
                            {isFollowing ? `Auto-refreshing live${refreshDots}` : 'Auto-refreshing stopped'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsColorEnabled(!isColorEnabled)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: isColorEnabled ? '#059669' : 'transparent', // Updated Green
                            color: isColorEnabled ? 'white' : '#94a3b8',
                            border: `1px solid ${isColorEnabled ? '#059669' : '#334155'}`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isColorEnabled ? '#3b82f6' : '#64748b', // Blue Glow
                            boxShadow: isColorEnabled ? '0 0 8px #3b82f6' : 'none',
                            animation: isColorEnabled ? 'pulse 1.5s infinite' : 'none'
                        }} />
                        {isColorEnabled ? 'FOCUS ON' : 'FOCUS OFF'}
                    </button>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {logs.length > 0 && (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                    {(() => {
                                        const pad = (n, l = 2) => String(n).padStart(l, '0');
                                        const datePart = `${pad(liveTime.getDate())}/${pad(liveTime.getMonth() + 1)}/${liveTime.getFullYear()}`;
                                        const timePart = `${pad(liveTime.getHours())}:${pad(liveTime.getMinutes())}:${pad(liveTime.getSeconds())}`;
                                        return `${datePart} - ${timePart} CET`;
                                    })()}
                                </span>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    marginLeft: '4px',
                                    backgroundColor: !user.debug_enabled ? '#64748b' :
                                        user.debug_level === 'paranoic' ? '#ef4444' :
                                            user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6',
                                    boxShadow: user.debug_enabled ? `0 0 6px ${user.debug_level === 'paranoic' ? '#ef4444' :
                                        user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6'
                                        }` : 'none'
                                }} title={`Status: ${user.debug_enabled ? user.debug_level : 'Disabled'}`} />
                            </>
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
