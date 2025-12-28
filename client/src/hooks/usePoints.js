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
                setPoints(prev => [message.point, ...prev]);
                break;
            case 'point_updated':
                setPoints(prev => prev.map(p => p.id === message.point.id ? message.point : p));
                break;
            case 'settings_updated':
                // Could expose settings updates here if needed
                break;
            default:
                break;
        }
    };

    const submitPoint = async (data) => {
        const result = await api.submitPoint(data);
        // Optimistic update handled by WS usually, but can add here if WS fails
        return result;
    };

    const confirmPoint = async (id) => {
        await api.confirmPoint(id);
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
        refresh: fetchPoints
    };
};
