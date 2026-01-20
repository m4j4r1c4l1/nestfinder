import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

export const usePoints = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: ['pending', 'confirmed', 'deactivated'] // Include all statuses
    });

    // WebSocket reference
    const wsRef = useRef(null);

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

    useEffect(() => {
        // Setup WebSocket for real-time updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`; // Use current host/port

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('Connected to real-time updates');
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleRealtimeUpdate(message);
            } catch (e) {
                console.error('WS message error:', e);
            }
        };

        wsRef.current.onclose = () => {
            console.log('Disconnected from updates');
            // Simple reconnect logic could go here
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

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
                // Could expose settings updates here if needed
                break;
            case 'debug_update':
                window.dispatchEvent(new CustomEvent('debug_update', { detail: message }));
                break;
            default:
                break;
        }
    };

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
