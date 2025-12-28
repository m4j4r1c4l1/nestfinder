import React, { useState } from 'react';

const RoutePanel = ({ points, mapBounds, onCalculate, onClear, userLocation }) => {
    const [routeData, setRouteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Status filter for route calculation
    const [statusFilter, setStatusFilter] = useState({
        pending: true,
        confirmed: true,
        deactivated: false
    });

    const statusOptions = [
        { id: 'confirmed', label: 'Confirmed', color: 'var(--color-confirmed)' },
        { id: 'pending', label: 'Pending', color: 'var(--color-pending)' },
        { id: 'deactivated', label: 'Deactivated', color: 'var(--color-deactivated)' }
    ];

    const toggleStatus = (status) => {
        setRouteData(null);
        onClear();
        setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Helper to check if a point is within the current map bounds
    const isPointInBounds = (point) => {
        if (!mapBounds) return true; // If no bounds, include all points
        return (
            point.latitude >= mapBounds.south &&
            point.latitude <= mapBounds.north &&
            point.longitude >= mapBounds.west &&
            point.longitude <= mapBounds.east
        );
    };

    // Filter points by BOTH status AND viewport bounds
    const getFilteredPoints = () => {
        return points.filter(p => statusFilter[p.status] && isPointInBounds(p));
    };

    // OSRM Route with Nearest Neighbor ordering
    const calculateRoute = async () => {
        const filteredPoints = getFilteredPoints();
        if (filteredPoints.length < 2) {
            setError('Need at least 2 points to calculate a route');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const waypoints = userLocation
                ? [{ latitude: userLocation.latitude, longitude: userLocation.longitude, isUser: true }, ...filteredPoints]
                : [...filteredPoints];

            // Nearest neighbor ordering
            let current = waypoints[0];
            let remaining = waypoints.slice(1);
            const orderedPath = [current];

            while (remaining.length > 0) {
                let nearestIdx = 0;
                let minDst = Infinity;

                for (let i = 0; i < remaining.length; i++) {
                    const p = remaining[i];
                    const d = Math.sqrt(
                        Math.pow(p.latitude - current.latitude, 2) +
                        Math.pow(p.longitude - current.longitude, 2)
                    );
                    if (d < minDst) {
                        minDst = d;
                        nearestIdx = i;
                    }
                }

                current = remaining[nearestIdx];
                orderedPath.push(current);
                remaining.splice(nearestIdx, 1);
            }

            const coordinates = orderedPath
                .map(p => `${p.longitude},${p.latitude}`)
                .join(';');

            const response = await fetch(
                `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`
            );
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes?.[0]) {
                throw new Error('Could not calculate route');
            }

            const route = data.routes[0];
            const result = {
                path: orderedPath.map((p, index) => ({
                    ...p,
                    sequence: (index === 0 && p.isUser) ? null : index
                })),
                geometry: route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] })),
                distance: (route.distance / 1000).toFixed(1),
                time: Math.round(route.duration / 60),
                pointCount: filteredPoints.length
            };

            setRouteData(result);
            onCalculate(result);
        } catch (err) {
            console.error('Route calculation error:', err);
            setError(err.message || 'Failed to calculate route. Try again.');
            onCalculate({ path: getFilteredPoints(), geometry: null });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setRouteData(null);
        setError('');
        onClear();
    };

    const filteredCount = getFilteredPoints().length;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Route Planner</h3>
            </div>
            <div className="card-body">
                {/* Status Filter */}
                <div className="mb-4">
                    <label className="form-label">Include in route:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {statusOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => toggleStatus(opt.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-3)',
                                    background: statusFilter[opt.id]
                                        ? `${opt.color}20`
                                        : 'var(--color-bg-secondary)',
                                    border: statusFilter[opt.id]
                                        ? `2px solid ${opt.color}`
                                        : '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: statusFilter[opt.id]
                                        ? opt.color
                                        : 'var(--color-text-secondary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: opt.color
                                }} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                        {filteredCount} points selected
                    </div>
                </div>

                {error && (
                    <div style={{ color: 'var(--color-deactivated)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {routeData ? (
                    <div>
                        <div className="route-info">
                            <div className="route-stat">
                                <div className="route-stat-value">{routeData.distance}</div>
                                <div className="route-stat-label">Kilometers</div>
                            </div>
                            <div className="route-stat">
                                <div className="route-stat-value">{routeData.time}</div>
                                <div className="route-stat-label">Minutes</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
                            Visiting {routeData.pointCount} locations
                        </div>
                        <button className="btn btn-secondary btn-block" onClick={handleClear}>
                            Clear Route
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-muted mb-4 text-sm" style={{ textAlign: 'center' }}>
                            Calculate the optimal walking path to visit selected points.
                        </p>
                        <button
                            className="btn btn-primary btn-block"
                            onClick={calculateRoute}
                            disabled={filteredCount < 2 || loading}
                        >
                            {loading ? 'Calculating...' :
                                filteredCount < 2
                                    ? `Need ${2 - filteredCount} more points`
                                    : `Calculate Route (${filteredCount} points)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoutePanel;
