import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

export const usePoints = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: ['pending', 'confirmed', 'deactivated'] // Include all statuses
    });

    const fetchPoints = async () => {
        try {
            setLoading(true);
            const data = await api.getPoints({
                status: filters.status.join(',')
            });
            setPoints(data.points);
        } catch (error) {
            console.error('Failed to fetch points:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, [filters]);

    // WebSocket reference
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    // Use a ref for the handler to avoid stale closures in the socket onmessage
    const handleMessageRef = useRef(null);

    const handleRealtimeUpdate = (message) => {
        switch (message.type) {
            case 'point_added':
                setPoints(prev => {
                    // Check if point already exists (avoid duplicates from optimistic update)
                    if (prev.some(p => p.id === message.point.id)) {
                        return prev;
                    }
                    return [message.point, ...prev];
                });
                // Trigger proximity callback if provided
                if (onNewPointCallback.current && message.point) {
                    onNewPointCallback.current(message.point);
                }
                break;
            case 'point_updated':
                setPoints(prev => prev.map(p => p.id === message.point.id ? message.point : p));
                break;
            case 'settings_updated':
                // ASAP Sync: If global settings change (like debug mode), notify the logger
                logger._handleSocketUpdate({ type: 'debug_update', global: true });
                break;
            case 'debug_update':
                logger._handleSocketUpdate(message);
                window.dispatchEvent(new CustomEvent('debug_update', { detail: message }));
                break;
            default:
                break;
        }
    };

    // Update the ref whenever the function changes (though it shouldn't really change)
    useEffect(() => {
        handleMessageRef.current = handleRealtimeUpdate;
    }, [handleRealtimeUpdate]);

    useEffect(() => {
        const connect = () => {
            // Setup WebSocket for real-time updates
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

            // Task 113: Improve host detection for local dev
            let host = window.location.host;
            if (host.includes('localhost:5173')) {
                host = 'localhost:3001'; // Default dev backend port
            }

            const wsUrl = `${protocol}//${host}`;

            console.log(`[WS] Connecting to ${wsUrl}...`);
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                console.log('[WS] Connected to real-time updates');
                reconnectAttemptsRef.current = 0;
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (handleMessageRef.current) {
                        handleMessageRef.current(message);
                    }
                } catch (e) {
                    console.error('[WS] Message error:', e);
                }
            };

            socket.onclose = (event) => {
                if (event.wasClean) {
                    console.log('[WS] Disconnected cleanly');
                } else {
                    console.warn('[WS] Connection lost');

                    // Reconnect logic with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    reconnectAttemptsRef.current++;

                    console.log(`[WS] Reconnecting in ${delay}ms...`);
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            };

            socket.onerror = (error) => {
                console.error('[WS] Socket error:', error);
                socket.close(); // Force onclose logic
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    // Callback for new point notifications
    const onNewPointCallback = useRef(null);
    const setNewPointCallback = (callback) => {
        onNewPointCallback.current = callback;
    };

    const submitPoint = async (data) => {
        // Optimistic update: assume success or use result from API (if returns point)
        const result = await api.submitPoint(data);
        if (result && result.point) {
            setPoints(prev => {
                if (prev.some(p => p.id === result.point.id)) return prev;
                return [result.point, ...prev];
            });
        }
        return result;
    };

    const confirmPoint = async (id) => {
        const result = await api.confirmPoint(id);
        return result;
    };

    const deactivatePoint = async (id) => {
        await api.deactivatePoint(id);
    };

    const reactivatePoint = async (id) => {
        await api.reactivatePoint(id);
    };

    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return {
        points,
        loading,
        filters,
        updateFilters,
        submitPoint,
        confirmPoint,
        deactivatePoint,
        reactivatePoint,
        refresh: fetchPoints,
        setNewPointCallback
    };
};
