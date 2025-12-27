import React, { useState } from 'react';

const RoutePanel = ({ points, onCalculate, onClear, userLocation }) => {
    const [routeData, setRouteData] = useState(null);

    const calculateRoute = () => {
        if (points.length < 3) return;

        // Simple robust TSP solver (Nearest Neighbor)
        // Start from user location or first point
        let current = userLocation || points[0];
        let remaining = userLocation ? [...points] : points.slice(1);
        const path = [current];
        let totalDist = 0;

        while (remaining.length > 0) {
            let nearest = null;
            let minDst = Infinity;
            let nearestIdx = -1;

            for (let i = 0; i < remaining.length; i++) {
                const p = remaining[i];
                // Haversine approx
                const d = Math.sqrt(Math.pow(p.latitude - current.latitude, 2) + Math.pow(p.longitude - current.longitude, 2));
                if (d < minDst) {
                    minDst = d;
                    nearest = p;
                    nearestIdx = i;
                }
            }

            if (nearest) {
                path.push(nearest);
                totalDist += minDst * 111; // Approx km per degree
                current = nearest;
                remaining.splice(nearestIdx, 1);
            }
        }

        // Walking speed approx 5km/h
        const timeHours = totalDist / 5;
        const timeMins = Math.round(timeHours * 60);

        const result = {
            path,
            distance: totalDist.toFixed(1),
            time: timeMins
        };

        setRouteData(result);
        onCalculate(path);
    };

    const handleClear = () => {
        setRouteData(null);
        onClear();
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Optimize Route</h3>
            </div>
            <div className="card-body">
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
                        <button className="btn btn-secondary btn-block" onClick={handleClear}>
                            Clear Route
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-muted mb-4 text-sm">
                            Calculate the most efficient walking path to visit all visible points.
                        </p>
                        <button
                            className="btn btn-primary btn-block"
                            onClick={calculateRoute}
                            disabled={points.length < 3}
                        >
                            {points.length < 3
                                ? `Need ${3 - points.length} more points`
                                : 'Calculate Walking Route'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoutePanel;
