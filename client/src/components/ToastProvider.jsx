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

        // Auto-remove if not persistent
        if (toast.duration !== Infinity) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, toast.duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Listen for server:unavailable events (from api.js)
    useEffect(() => {
        let pollingInterval = null;
        let toastId = null;

        const cleanup = () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
            if (toastId) {
                removeToast(toastId);
                toastId = null;
            }
            window.removeEventListener('click', dismiss);
            serverUnavailableRef.current = false;
        };

        const dismiss = () => {
            cleanup();
        };

        const checkServer = async () => {
            try {
                // Try a simple health check or config fetch
                const res = await fetch('/api/settings/app-config');
                if (res.ok) {
                    cleanup();
                }
            } catch (e) {
                // Still down, keep polling
            }
        };

        const handleServerUnavailable = () => {
            // Debounce: only show once every 10 seconds
            if (serverUnavailableRef.current) return;
            serverUnavailableRef.current = true;

            toastId = addToast('Server is restarting...', {
                type: 'warning',
                icon: '🙊',
                duration: Infinity, // Persistent
                centered: true
            });

            // Start polling
            pollingInterval = setInterval(checkServer, 2000);

            // Add global click listener for manual dismiss
            // Use setTimeout to avoid immediate trigger from the click that caused the error (if any)
            setTimeout(() => {
                window.addEventListener('click', dismiss, { once: true });
            }, 100);

            // Safety fallback: Clear after 2 minutes if polling fails forever
            setTimeout(cleanup, 120000);
        };

        window.addEventListener('server:unavailable', handleServerUnavailable);
        return () => {
            window.removeEventListener('server:unavailable', handleServerUnavailable);
            cleanup();
        };
    }, [addToast, removeToast]);

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
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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
                        justifyContent: toast.centered ? 'center' : 'flex-start',
                        gap: 'var(--space-3)',
                        cursor: 'pointer',
                        animation: 'slideUp 0.3s ease-out',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{toast.icon}</span>
                    <span style={{
                        fontWeight: 500,
                        flex: toast.centered ? '0 1 auto' : 1,
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
