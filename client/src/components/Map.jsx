import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: null,
    iconUrl: null,
    shadowUrl: null,
});

// Custom Icons
const createIcon = (color) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-marker ${color}" style="background-color: var(--color-${color});"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

const icons = {
    confirmed: createIcon('confirmed'),
    pending: createIcon('pending'),
    deactivated: createIcon('deactivated'),
    user: L.divIcon({
        className: 'user-marker-icon',
        html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })
};

// Component to handle initial centering only (not auto-recenter)
const InitialCenter = ({ center, userLocation }) => {
    const map = useMap();
    const initialized = React.useRef(false);

    useEffect(() => {
        // Wait for actual user location before centering
        if (userLocation && !initialized.current) {
            map.flyTo([userLocation.latitude, userLocation.longitude], 15);
            initialized.current = true;
        }
    }, [userLocation, map]);
    return null;
};

// Recenter button component
const RecenterButton = ({ userLocation }) => {
    const map = useMap();

    if (!userLocation) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '120px',
            right: '10px',
            zIndex: 1000
        }}>
            <button
                onClick={() => {
                    map.flyTo([userLocation.latitude, userLocation.longitude], 15);
                }}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-bg-secondary)',
                    border: '2px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: 'var(--shadow-md)'
                }}
                title="Center on my location"
            >
                📍
            </button>
        </div>
    );
};

// Helper for routing display
const RouteLayer = ({ route }) => {
    const map = useMap();
    const routeRef = React.useRef(null);
    const markersRef = React.useRef([]);

    useEffect(() => {
        // Clear existing route and markers
        if (routeRef.current) {
            map.removeLayer(routeRef.current);
            routeRef.current = null;
        }
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        if (!route) return;

        // Determine what coordinates to use for the line
        let latlngs;
        let waypoints = null;

        if (route.geometry && route.geometry.length > 0) {
            // Use OSRM walking route geometry
            latlngs = route.geometry.map(p => [p.latitude, p.longitude]);
            waypoints = route.path; // Ordered waypoints for numbering
        } else if (route.path && route.path.length >= 2) {
            // Fallback to straight lines between waypoints
            latlngs = route.path.map(p => [p.latitude, p.longitude]);
            waypoints = route.path;
        } else if (Array.isArray(route) && route.length >= 2) {
            // Legacy format: array of points
            latlngs = route.map(p => [p.latitude, p.longitude]);
            waypoints = route;
        } else {
            return;
        }

        // Create the polyline
        routeRef.current = L.polyline(latlngs, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        // Add numbered markers for waypoints
        if (waypoints && waypoints.length > 0) {
            waypoints.forEach((point, index) => {
                // Use explicit sequence if available (from RoutePanel), otherwise fallback to index if it has an ID
                // Note: user location usually has sequence=null or no ID
                const number = (point.sequence !== undefined) ? point.sequence : (point.id ? index : null);

                if (number === null || number === 0) return; // Skip user location or 0-indexed start logic if needed

                const displayNumber = point.id ? index : index;

                const numberIcon = L.divIcon({
                    className: 'route-number-icon',
                    html: `<div style="
                        background: #3b82f6;
                        color: white;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: bold;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">${displayNumber}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const marker = L.marker([point.latitude, point.longitude], { icon: numberIcon }).addTo(map);
                markersRef.current.push(marker);
            });
        }

        // Fit map to show entire route
        map.fitBounds(routeRef.current.getBounds(), { padding: [50, 50] });

        return () => {
            if (routeRef.current) {
                map.removeLayer(routeRef.current);
            }
            markersRef.current.forEach(m => map.removeLayer(m));
            markersRef.current = [];
        };
    }, [route, map]);

    return null;
};

// Map click handler
const MapClickHandler = ({ onMapClick }) => {
    const map = useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick({
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng
                });
            }
        }
    });
    return null;
};

const Map = ({ points = [], userLocation, onPointClick, onMapClick, route }) => {
    // Default to London if no location yet
    const defaultCenter = [51.505, -0.09];
    const center = userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter;

    return (
        <div className="map-container">
            <MapContainer
                center={center}
                zoom={13}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles"
                />

                <ZoomControl position="bottomright" />

                {/* Recenter button */}
                <RecenterButton userLocation={userLocation} />

                {userLocation && (
                    <Marker
                        position={[userLocation.latitude, userLocation.longitude]}
                        icon={icons.user}
                    >
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {points.map(point => (
                    <Marker
                        key={point.id}
                        position={[point.latitude, point.longitude]}
                        icon={icons[point.status] || icons.pending}
                        eventHandlers={{
                            click: () => onPointClick && onPointClick(point)
                        }}
                    >
                        {/* Tooltip on hover/click handled by PointDetails instead */}
                    </Marker>
                ))}

                <InitialCenter center={center} userLocation={userLocation} />
                <RouteLayer route={route} />
                <MapClickHandler onMapClick={onMapClick} />
            </MapContainer>

            {/* Styles for Dark Mode Map Tiles Override */}
            <style>{`
        .leaflet-layer {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .leaflet-container {
          background: #333;
        }
      `}</style>
        </div>
    );
};

export default Map;
