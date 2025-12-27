import React, { useState } from 'react';

// ========================================
// ROUTING PROVIDER CONFIGURATION
// Change this to switch between providers:
// - 'osrm' = OSRM /route with nearest-neighbor ordering
// - 'osrm-trip' = OSRM /trip with OSRM optimization
// - 'openroute' = OpenRouteService (may require API key for heavy use)
// ========================================
const ROUTING_PROVIDER = 'osrm';

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

    // ========================================
    // OSRM Route Provider (original)
    // ========================================
    const calculateOSRMRoute = async (waypoints) => {
        // Use nearest neighbor to order points
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
            throw new Error('OSRM route failed');
        }

        const route = data.routes[0];
        return {
            path: orderedPath,
            geometry: route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] })),
            distance: (route.distance / 1000).toFixed(1),
            time: Math.round(route.duration / 60)
        };
    };

    // ========================================
    // OSRM Trip Provider
    // ========================================
    const calculateOSRMTrip = async (waypoints) => {
        const coordinates = waypoints
            .map(p => `${p.longitude},${p.latitude}`)
            .join(';');

        const response = await fetch(
            `https://router.project-osrm.org/trip/v1/foot/${coordinates}?overview=full&geometries=geojson&roundtrip=false&source=first`
        );
        const data = await response.json();

        if (data.code !== 'Ok' || !data.trips?.[0]) {
            throw new Error('OSRM trip failed');
        }

        const trip = data.trips[0];
        const orderedWaypoints = data.waypoints
            .sort((a, b) => a.waypoint_index - b.waypoint_index)
            .map(wp => waypoints[wp.waypoint_index]);

        return {
            path: orderedWaypoints,
            geometry: trip.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] })),
            distance: (trip.distance / 1000).toFixed(1),
            time: Math.round(trip.duration / 60)
        };
    };

    // ========================================
    // OpenRouteService Provider
    // ========================================
    const calculateOpenRoute = async (waypoints) => {
        // Order waypoints using nearest neighbor first
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

        // OpenRouteService API (free tier, no API key needed for limited use)
        const coordinates = orderedPath.map(p => [p.longitude, p.latitude]);

        const response = await fetch(
            'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinates: coordinates
                })
            }
        );

        const data = await response.json();

        if (data.error || !data.features?.[0]) {
            throw new Error(data.error?.message || 'OpenRouteService failed');
        }

        const feature = data.features[0];
        const props = feature.properties.summary;

        return {
            path: orderedPath,
            geometry: feature.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] })),
            distance: (props.distance / 1000).toFixed(1),
            time: Math.round(props.duration / 60)
        };
    };

    // ========================================
    // Main Calculate Function
    // ========================================
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
                ? [{ latitude: userLocation.latitude, longitude: userLocation.longitude }, ...filteredPoints]
                : [...filteredPoints];

            let result;

            switch (ROUTING_PROVIDER) {
                case 'osrm-trip':
                    result = await calculateOSRMTrip(waypoints);
                    break;
                case 'openroute':
                    result = await calculateOpenRoute(waypoints);
                    break;
                case 'osrm':
                default:
                    result = await calculateOSRMRoute(waypoints);
                    break;
            }

            result.pointCount = filteredPoints.length;
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
