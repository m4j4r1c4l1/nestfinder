import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
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

// Component to handle map center updates
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

// Helper for routing display
const RouteLayer = ({ route }) => {
    const map = useMap();
    const routeRef = React.useRef(null);

    useEffect(() => {
        if (!route || route.length < 2) {
            if (routeRef.current) {
                map.removeLayer(routeRef.current);
                routeRef.current = null;
            }
            return;
        }

        if (routeRef.current) {
            map.removeLayer(routeRef.current);
        }

        const latlngs = route.map(p => [p.latitude, p.longitude]);

        // Sort points by distance essentially (simple path for MVP)
        // In real app, we'd use OSRM polyline
        routeRef.current = L.polyline(latlngs, {
            color: 'var(--color-primary)',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(map);

        map.fitBounds(routeRef.current.getBounds(), { padding: [50, 50] });

        return () => {
            if (routeRef.current) {
                map.removeLayer(routeRef.current);
            }
        };
    }, [route, map]);

    return null;
};

const Map = ({ points = [], userLocation, onPointClick, route }) => {
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

                <RecenterMap center={center} />
                <RouteLayer route={route} />
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
