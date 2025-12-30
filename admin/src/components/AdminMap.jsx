import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: null,
    iconUrl: null,
    shadowUrl: null,
});

const createIcon = (color) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-marker ${color}" style="background-color: var(--color-${color});"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const icons = {
    confirmed: createIcon('confirmed'),
    pending: createIcon('pending'),
    deactivated: createIcon('deactivated')
};

// Component to handle map resize
const MapResizer = () => {
    const map = useMap();

    useEffect(() => {
        // Invalidate size after mount and on window resize
        const handleResize = () => {
            setTimeout(() => map.invalidateSize(), 100);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Also observe parent container size changes
        const resizeObserver = new ResizeObserver(handleResize);
        if (map.getContainer().parentElement) {
            resizeObserver.observe(map.getContainer().parentElement);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
        };
    }, [map]);

    return null;
};

const AdminMap = ({ points, filteredPoints, onDelete }) => {
    // Set max bounds to prevent world wrapping
    const maxBounds = L.latLngBounds(
        L.latLng(-85, -180),  // Southwest
        L.latLng(85, 180)     // Northeast
    );

    // Component to fit bounds when filtered
    const FitBounds = () => {
        const map = useMap();

        useEffect(() => {
            const targetPoints = (filteredPoints && filteredPoints.length > 0) ? filteredPoints : points;

            if (targetPoints && targetPoints.length > 0) {
                const bounds = L.latLngBounds(
                    targetPoints.map(p => [p.latitude, p.longitude])
                );
                // Valid bounds check
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
            }
        }, [filteredPoints, points, map]);

        return null;
    };

    return (
        <MapContainer
            center={[40.0, -4.0]}
            zoom={6}
            minZoom={2}
            maxZoom={18}
            maxBounds={maxBounds}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)', minHeight: '300px' }}
        >
            <MapResizer />
            <FitBounds />
            <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap={true}
                bounds={maxBounds}
            />
            {points.map(point => (
                <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    icon={icons[point.status] || icons.pending}
                >
                    <Popup>
                        <strong>ID: {point.id}</strong><br />
                        Status: {point.status}<br />
                        Submitter: {point.submitter_nickname || 'Anon'}<br />
                        {point.address}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(point.id)}
                                style={{
                                    marginTop: '0.5rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    width: '100%'
                                }}
                            >
                                🗑️ Delete Point
                            </button>
                        )}
                    </Popup>
                </Marker>
            ))}
            <style>{`
                .leaflet-container {
                    background: var(--color-bg-secondary) !important;
                }
                .leaflet-layer {
                    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
                }
                .custom-marker {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
            `}</style>
        </MapContainer>
    );
};

export default AdminMap;
