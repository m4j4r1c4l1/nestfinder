import React, { useState, useEffect } from 'react';

export const ScreenLogger = () => {
    const [logs, setLogs] = useState([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;

        const addLog = (type, args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');

            setLogs(prev => [...prev.slice(-19), { type, message, time: new Date().toLocaleTimeString() }]);
        };

        console.log = (...args) => {
            originalLog.apply(console, args);
            addLog('LOG', args);
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            addLog('ERR', args);
            setVisible(true); // Auto-show on error
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, []);

    if (!visible) {
        return (
            <button
                onClick={() => setVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 100000,
                    opacity: 0.3,
                    fontSize: '10px'
                }}
            >
                🐞
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '200px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            zIndex: 99990,
            overflowY: 'auto',
            fontSize: '10px',
            fontFamily: 'monospace',
            padding: '5px'
        }}>
            <div style={{ position: 'sticky', top: 0, background: '#333', padding: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Debug Log</span>
                <button onClick={() => setVisible(false)}>Close</button>
            </div>
            {logs.map((log, i) => (
                <div key={i} style={{
                    borderBottom: '1px solid #333',
                    padding: '2px 0',
                    color: log.type === 'ERR' ? '#ff6b6b' : '#ced4da'
                }}>
                    <span style={{ color: '#666' }}>[{log.time}]</span>{' '}
                    <strong>{log.type}:</strong> {log.message}
                </div>
            ))}
        </div>
    );
};
