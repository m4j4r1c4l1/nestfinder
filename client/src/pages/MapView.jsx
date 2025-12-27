import React, { useState, useEffect } from 'react';
import Map from '../components/Map';
import SubmitPoint from '../components/SubmitPoint';
import PointDetails from '../components/PointDetails';
import FilterPanel from '../components/FilterPanel';
import RoutePanel from '../components/RoutePanel';
import { usePoints } from '../hooks/usePoints';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import { api } from '../utils/api';

const MapView = () => {
    const { user } = useAuth();
    const {
        points,
        filters,
        updateFilters,
        submitPoint,
        confirmPoint,
        deactivatePoint
    } = usePoints();
    const { location: userLocation, getCurrentLocation } = useGeolocation();

    // UI State
    const [activeSheet, setActiveSheet] = useState(null); // 'submit', 'details', 'filter', 'route', 'download'
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [routePath, setRoutePath] = useState(null);

    // Initialize location
    useEffect(() => {
        getCurrentLocation().catch(() => { });
    }, []);

    const handlePointClick = (point) => {
        setSelectedPoint(point);
        setActiveSheet('details');
    };

    const handleSheetClose = () => {
        setActiveSheet(null);
        setSelectedPoint(null);
    };

    const handleSubmit = async (data) => {
        await submitPoint(data);
        setActiveSheet(null);
    };

    const handleRouteCalculate = (path) => {
        setRoutePath(path);
        setActiveSheet(null); // Close panel to see map
    };

    const handleClearRoute = () => {
        setRoutePath(null);
    };

    const handleDownload = (format) => {
        api.downloadPoints(format, filters.status.join(','));
        setActiveSheet(null);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Main Map */}
            <Map
                points={points}
                userLocation={userLocation}
                onPointClick={handlePointClick}
                route={routePath}
            />

            {/* Floating Action Button (FAB) for Submission */}
            {!activeSheet && (
                <div className="map-fab">
                    <button
                        className="btn btn-primary btn-icon shadow-lg"
                        style={{ width: 56, height: 56, borderRadius: '50%', fontSize: '1.5rem' }}
                        onClick={() => setActiveSheet('submit')}
                    >
                        +
                    </button>
                </div>
            )}

            {/* Bottom Sheet Container */}
            <div className={`bottom-sheet ${activeSheet ? 'open' : ''}`}>
                <div className="bottom-sheet-handle" onClick={handleSheetClose} />
                <div className="bottom-sheet-content">

                    {activeSheet === 'submit' && (
                        <SubmitPoint onSubmit={handleSubmit} onCancel={handleSheetClose} />
                    )}

                    {activeSheet === 'details' && selectedPoint && (
                        <PointDetails
                            point={selectedPoint}
                            user={user}
                            onConfirm={() => { confirmPoint(selectedPoint.id); setActiveSheet(null); }}
                            onDeactivate={() => { deactivatePoint(selectedPoint.id); setActiveSheet(null); }}
                            onClose={handleSheetClose}
                        />
                    )}

                    {activeSheet === 'filter' && (
                        <FilterPanel
                            filters={filters}
                            onChange={updateFilters}
                            onClose={handleSheetClose}
                        />
                    )}

                    {activeSheet === 'route' && (
                        <RoutePanel
                            points={points}
                            userLocation={userLocation}
                            onCalculate={handleRouteCalculate}
                            onClear={handleClearRoute}
                        />
                    )}

                    {activeSheet === 'download' && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Download Data</h3></div>
                            <div className="card-body flex-col gap-3">
                                <button className="btn btn-secondary btn-block" onClick={() => handleDownload('json')}>
                                    Download JSON
                                </button>
                                <button className="btn btn-secondary btn-block" onClick={() => handleDownload('csv')}>
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button
                    className={`bottom-nav-item ${!activeSheet ? 'active' : ''}`}
                    onClick={() => setActiveSheet(null)}
                >
                    <span>🗺️</span>
                    Map
                </button>
                <button
                    className={`bottom-nav-item ${activeSheet === 'route' ? 'active' : ''}`}
                    onClick={() => setActiveSheet('route')}
                >
                    <span>🚶</span>
                    Route
                </button>
                <button
                    className={`bottom-nav-item ${activeSheet === 'filter' ? 'active' : ''}`}
                    onClick={() => setActiveSheet('filter')}
                >
                    <span>🔍</span>
                    Filter
                </button>
                <button
                    className={`bottom-nav-item ${activeSheet === 'download' ? 'active' : ''}`}
                    onClick={() => setActiveSheet('download')}
                >
                    <span>⬇️</span>
                    Data
                </button>
            </nav>
        </div>
    );
};

export default MapView;
