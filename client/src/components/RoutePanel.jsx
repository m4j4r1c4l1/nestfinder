import React, { useState } from 'react';

const RoutePanel = ({ points, onCalculate, onClear, userLocation }) => {
    const [routeData, setRouteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Status filter for route calculation
    const [statusFilter, setStatusFilter] = useState({
        pending: true,
        confirmed: true,
        deactivated: false
    });

    const toggleStatus = (status) => {
        setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Get filtered points based on status selection
    const getFilteredPoints = () => {
        return points.filter(p => statusFilter[p.status]);
    };

    const calculateRoute = async () => {
        const filteredPoints = getFilteredPoints();
        if (filteredPoints.length < 2) {
            setError('Need at least 2 points to calculate a route');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // First, use nearest neighbor to order points
            let current = userLocation
                ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                : filteredPoints[0];
            let remaining = userLocation ? [...filteredPoints] : filteredPoints.slice(1);
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

            // Now get actual walking route from OSRM
            const coordinates = orderedPath
                .map(p => `${p.longitude},${p.latitude}`)
                .join(';');

            const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`;

            const response = await fetch(osrmUrl);
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('Could not calculate walking route');
            }

            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1);
            const timeMins = Math.round(route.duration / 60);

            // Extract the geometry coordinates for the actual walking path
            const geometry = route.geometry.coordinates.map(coord => ({
                latitude: coord[1],
                longitude: coord[0]
            }));

            const result = {
                path: orderedPath,      // Waypoints in order
                geometry,               // Actual walking route geometry
                distance: distanceKm,
                time: timeMins,
                pointCount: filteredPoints.length
            };

            setRouteData(result);
            onCalculate(result);
        } catch (err) {
            console.error('Route calculation error:', err);
            setError(err.message || 'Failed to calculate route. Try again.');

            // Fallback to straight lines
            const filteredPoints = getFilteredPoints();
            onCalculate({ path: filteredPoints, geometry: null });
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
                <h3 className="card-title">Optimize Route</h3>
            </div>
            <div className="card-body">
                {/* Status Filter */}
                <div className="mb-4">
                    <label className="form-label">Include in route:</label>
                    <div className="toggle-group">
                        <button
                            type="button"
                            className={`toggle-btn pending ${statusFilter.pending ? 'active' : ''}`}
                            onClick={() => toggleStatus('pending')}
                        >
                            ⏳ Pending
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn confirmed ${statusFilter.confirmed ? 'active' : ''}`}
                            onClick={() => toggleStatus('confirmed')}
                        >
                            ✅ Confirmed
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn deactivated ${statusFilter.deactivated ? 'active' : ''}`}
                            onClick={() => toggleStatus('deactivated')}
                        >
                            ❌ Deactivated
                        </button>
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                        {filteredCount} points selected
                    </div>
                </div>

                {error && (
                    <div style={{ color: 'var(--color-deactivated)', fontSize: '0.85rem', marginBottom: '1rem' }}>
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
                        <p className="text-muted mb-4 text-sm">
                            Calculate the most efficient walking path through streets to visit selected points.
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
