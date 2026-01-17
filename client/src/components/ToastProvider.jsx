import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const serverUnavailableRef = React.useRef(false); // Debounce flag

    const addToast = useCallback((message, options = {}) => {
        const id = Date.now();
        const toast = {
            id,
            message,
            type: options.type || 'info', // info, success, warning, achievement
            icon: options.icon || '📢',
            duration: options.duration || 4000
        };
        setToasts(prev => [...prev, toast]);

        // Auto-remove
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, toast.duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Listen for server:unavailable events (from api.js)
    useEffect(() => {
        const handleServerUnavailable = () => {
            // Debounce: only show once every 10 seconds
            if (serverUnavailableRef.current) return;
            serverUnavailableRef.current = true;

            addToast('Server is restarting...', {
                type: 'warning',
                icon: '🐣',
                duration: 5000,
                centered: true
            });

            setTimeout(() => {
                serverUnavailableRef.current = false;
            }, 60000); // 1 minute debounce
        };

        window.addEventListener('server:unavailable', handleServerUnavailable);
        return () => window.removeEventListener('server:unavailable', handleServerUnavailable);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);

const ToastContainer = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    const getTypeStyles = (type) => {
        switch (type) {
            case 'success':
                return { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white' };
            case 'warning':
                return { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'black' };
            case 'achievement':
                return { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white' };
            default:
                return { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' };
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 'calc(80px + var(--space-4))', // Above bottom nav
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            maxWidth: 'calc(100vw - var(--space-4))',
            width: '360px'
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    onClick={() => onDismiss(toast.id)}
                    style={{
                        ...getTypeStyles(toast.type),
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        cursor: 'pointer',
                        animation: 'slideUp 0.3s ease-out',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{toast.icon}</span>
                    <span style={{
                        fontWeight: 500,
                        flex: 1,
                        textAlign: toast.centered ? 'center' : 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};

export default ToastProvider;
