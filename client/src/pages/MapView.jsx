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
        deactivatePoint,
        reactivatePoint
    } = usePoints();
    const { location: userLocation, getCurrentLocation } = useGeolocation();

    // UI State
    const [activeSheet, setActiveSheet] = useState(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [routePath, setRoutePath] = useState(null);
    const [toast, setToast] = useState(null);
    const [clickedLocation, setClickedLocation] = useState(null); // For map click to report

    // Initialize location
    useEffect(() => {
        getCurrentLocation().catch(() => { });
    }, []);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handlePointClick = (point) => {
        setSelectedPoint(point);
        setActiveSheet('details');
    };

    const handleMapClick = (coords) => {
        // When user clicks map, open submit panel with that location
        setClickedLocation(coords);
        setActiveSheet('submit');
        showToast('Location selected! Add details below.', 'success');
    };

    const handleSheetClose = () => {
        setActiveSheet(null);
        setSelectedPoint(null);
    };

    const handleSubmit = async (data) => {
        await submitPoint(data);
        setActiveSheet(null);
        showToast('Location submitted successfully!', 'success');
    };

    const handleConfirm = async (pointId) => {
        try {
            await confirmPoint(pointId);
            setActiveSheet(null);
            showToast('Point confirmed!', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to confirm point', 'error');
        }
    };

    const handleDeactivate = async (pointId) => {
        try {
            await deactivatePoint(pointId);
            setActiveSheet(null);
            showToast('Point deactivated', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to deactivate point', 'error');
        }
    };

    const handleReactivate = async (pointId) => {
        try {
            await reactivatePoint(pointId);
            setActiveSheet(null);
            showToast('Point reactivated - now pending confirmation', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to reactivate point', 'error');
        }
    };

    const handleRouteCalculate = (routeData) => {
        setRoutePath(routeData);
        setActiveSheet(null);
        if (routeData.distance && routeData.time) {
            showToast(`Route: ${routeData.distance}km, ~${routeData.time} min walking`, 'success');
        }
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
            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`} style={{
                    position: 'fixed',
                    top: 'var(--space-4)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 400,
                    padding: 'var(--space-3) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    background: toast.type === 'error' ? 'var(--color-deactivated)' : 'var(--color-confirmed)',
                    color: 'white',
                    fontWeight: 500,
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    {toast.message}
                </div>
            )}

            {/* Main Map */}
            <Map
                points={points}
                userLocation={userLocation}
                onPointClick={handlePointClick}
                onMapClick={handleMapClick}
                route={routePath}
            />

            {/* Bottom Sheet Container */}
            <div className={`bottom-sheet ${activeSheet ? 'open' : ''}`}>
                <div className="bottom-sheet-handle" onClick={handleSheetClose} />
                <div className="bottom-sheet-content">

                    {activeSheet === 'submit' && (
                        <SubmitPoint
                            onSubmit={handleSubmit}
                            onCancel={handleSheetClose}
                            initialLocation={clickedLocation}
                        />
                    )}

                    {activeSheet === 'details' && selectedPoint && (
                        <PointDetails
                            point={selectedPoint}
                            user={user}
                            onConfirm={() => handleConfirm(selectedPoint.id)}
                            onDeactivate={() => handleDeactivate(selectedPoint.id)}
                            onReactivate={() => handleReactivate(selectedPoint.id)}
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
                    className={`bottom-nav-item ${activeSheet === 'submit' ? 'active' : ''}`}
                    onClick={() => setActiveSheet('submit')}
                    style={activeSheet === 'submit' ? {} : { color: 'var(--color-primary)' }}
                >
                    <span>🐦</span>
                    Report
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
