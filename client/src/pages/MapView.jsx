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
    const { location: userLocation, getCurrentLocation, error: geoError, permissionState } = useGeolocation();

    // UI State
    const [activeSheet, setActiveSheet] = useState(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [routePath, setRoutePath] = useState(null);
    const [toast, setToast] = useState(null);
    const [clickedLocation, setClickedLocation] = useState(null); // For map click to report
    const [mapBounds, setMapBounds] = useState(null); // Track visible map area

    // DO NOT auto-request location on mobile - requires user gesture
    // Location is only requested when user clicks "Enable Location" button
    // and is allowed from Global/Per-Website Settings (See GEOLOCATION.md)

    // Show geolocation errors
    useEffect(() => {
        if (geoError) {
            const isDenied = geoError.code === 1 || geoError.message?.toLowerCase().includes('denied');

            if (isDenied && permissionState === 'denied') {
                setToast({
                    message: 'Location blocked. Clear browser data and try again.',
                    type: 'error',
                    duration: 6000
                });
            } else {
                setToast({
                    message: geoError.message || 'Location request failed',
                    type: 'error'
                });
            }
        }
    }, [geoError, permissionState]);

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
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <span>{toast.message}</span>
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            style={{
                                background: 'white',
                                color: 'var(--color-deactivated)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
            )}

            {/* Enable Location Banner - Shows when location not available */}
            {!userLocation && (() => {
                // Detect platform
                const userAgent = navigator.userAgent || navigator.vendor || window.opera;
                const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
                const isAndroid = /android/i.test(userAgent);

                const platformInstructions = isIOS
                    ? 'iOS: Settings → Privacy → Location Services → Safari → Allow'
                    : isAndroid
                        ? 'Android: Settings → Apps → Browser → Permissions → Location → Allow'
                        : 'Check your browser settings to enable location access';

                return (
                    <div style={{
                        position: 'fixed',
                        top: 'var(--space-4)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 350,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-xl)',
                        maxWidth: '90%',
                        width: '400px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>📍</div>
                        <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.1rem', fontWeight: 600 }}>
                            Enable Your Location
                        </h3>
                        <p style={{ margin: '0 0 var(--space-3) 0', fontSize: '0.9rem', opacity: 0.95 }}>
                            Tap below to enable location for personalized routes
                        </p>
                        <button
                            onClick={() => {
                                setToast(null);
                                getCurrentLocation()
                                    .then(() => {
                                        showToast('Location enabled!', 'success');
                                    })
                                    .catch(err => {
                                        console.error('Location error:', err);
                                        if (err.code === 1) {
                                            const tip = isIOS
                                                ? 'Settings → Privacy → Location Services → Safari'
                                                : isAndroid
                                                    ? 'Settings → Apps → Browser → Permissions → Location'
                                                    : 'browser settings';
                                            showToast(`Location denied. Check ${tip}`, 'error');
                                        } else if (err.code === 2) {
                                            showToast('Location unavailable. Check your device GPS.', 'error');
                                        } else if (err.code === 3 || err.message?.includes('timeout')) {
                                            showToast('Location timed out. Try again or check GPS.', 'error');
                                        }
                                    });
                            }}
                            style={{
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3) var(--space-5)',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-md)',
                                transition: 'transform 0.2s',
                                width: '100%'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            📍 Enable Location
                        </button>
                        <p style={{
                            margin: 'var(--space-3) 0 0 0',
                            fontSize: '0.75rem',
                            opacity: 0.85
                        }}>
                            {platformInstructions}
                        </p>
                    </div>
                );
            })()}

            {/* Main Map */}
            <Map
                points={points}
                userLocation={userLocation}
                onPointClick={handlePointClick}
                onMapClick={handleMapClick}
                onBoundsChange={setMapBounds}
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
                            mapBounds={mapBounds}
                            userLocation={userLocation}
                            onCalculate={handleRouteCalculate}
                            onClear={handleClearRoute}
                        />
                    )}

                    {activeSheet === 'download' && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Download & Settings</h3></div>
                            <div className="card-body flex-col gap-3">
                                <button className="btn btn-secondary btn-block" onClick={() => handleDownload('json')}>
                                    Download JSON
                                </button>
                                <button className="btn btn-secondary btn-block" onClick={() => handleDownload('csv')}>
                                    Download CSV
                                </button>

                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                                    <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem' }}>🔔 Notifications</h4>
                                    <button
                                        className="btn btn-primary btn-block"
                                        onClick={async () => {
                                            try {
                                                // Step 1: Request permission
                                                const perm = await Notification.requestPermission();
                                                if (perm !== 'granted') {
                                                    setToast({ message: `Permission: ${perm}. Check browser settings.`, type: 'error', duration: 5000 });
                                                    return;
                                                }

                                                // Step 2: Register service worker
                                                const registration = await navigator.serviceWorker.register('/sw.js');
                                                await navigator.serviceWorker.ready;

                                                // Step 3: Get VAPID public key
                                                const API_URL = import.meta.env.VITE_API_URL || '';
                                                const keyResponse = await fetch(`${API_URL}/api/push/vapid-public-key`);
                                                const { publicKey, error } = await keyResponse.json();
                                                if (error) {
                                                    setToast({ message: `Server: ${error}`, type: 'error', duration: 5000 });
                                                    return;
                                                }

                                                // Step 4: Convert VAPID key
                                                const urlBase64ToUint8Array = (base64String) => {
                                                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                                                    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                                                    const rawData = window.atob(base64);
                                                    const outputArray = new Uint8Array(rawData.length);
                                                    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
                                                    return outputArray;
                                                };

                                                // Step 5: Subscribe to push
                                                const sub = await registration.pushManager.subscribe({
                                                    userVisibleOnly: true,
                                                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                                                });

                                                // Step 6: Send subscription to server
                                                await fetch(`${API_URL}/api/push/subscribe`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        subscription: sub.toJSON(),
                                                        userId: user?.id || 'anonymous'
                                                    })
                                                });

                                                setToast({ message: '✅ Notifications enabled & subscribed!', type: 'success' });
                                            } catch (err) {
                                                console.error('Push subscription error:', err);
                                                setToast({ message: `Error: ${err.message}`, type: 'error', duration: 5000 });
                                            }
                                        }}
                                    >
                                        Enable Notifications
                                    </button>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                                        Get alerts when new locations are reported
                                    </div>
                                </div>
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
