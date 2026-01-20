import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../api';

const LogModal = ({ user, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await adminApi.getUserLogs(user.id);
                setLogs(res.logs || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchLogs();
        }
    }, [user]);

    // Syntax Highlighting parser
    const parseLogLine = (line) => {
        // Robustness check: Ensure line is a string (Task #104)
        if (typeof line !== 'string') {
            try {
                return <span style={{ color: '#94a3b8' }}>[RAW] {JSON.stringify(line)}</span>;
            } catch {
                return <span style={{ color: '#94a3b8' }}>[INVALID LOG ENTRY]</span>;
            }
        }

        // Expected Format: "DD-MM-YYYY - HH:MM:SS CET/CEST [Module][Action] Message"
        const regex = /^(\d{2}-\d{2}-\d{4} - \d{2}:\d{2}:\d{2}) (CET|CEST) \[([\w\s]+)\]\[([\w\s]+)\] (.+)$/;
        const match = line.match(regex);

        if (!match) return <span style={{ color: '#94a3b8' }}>{line}</span>;

        const [_, timestamp, tz, module, action, message] = match;

        let actionColor = '#fbbf24'; // Default Yellow
        if (action.toLowerCase().includes('error') || action.toLowerCase().includes('fail')) actionColor = '#ef4444'; // Red
        if (action.toLowerCase().includes('success') || action.toLowerCase().includes('recover')) actionColor = '#22c55e'; // Green

        let moduleColor = '#60a5fa'; // Blue
        if (module === 'App' && action === 'Crash') moduleColor = '#ef4444';

        return (
            <>
                <span style={{ color: '#64748b', marginRight: '8px' }}>{timestamp}</span>
                <span style={{ color: '#475569', fontSize: '0.75em', marginRight: '8px' }}>{tz}</span>
                <span style={{ color: moduleColor, fontWeight: 600 }}>[{module}]</span>
                <span style={{ color: actionColor, fontWeight: 600 }}>[{action}]</span>
                <span style={{ color: '#e2e8f0', marginLeft: '8px' }}>{message}</span>
            </>
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

                {/* Content */}
                <div style={{ flex: 1, padding: '0', overflowY: 'auto' }} ref={contentRef}>
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
        </div>
    );
};

export default LogModal;
