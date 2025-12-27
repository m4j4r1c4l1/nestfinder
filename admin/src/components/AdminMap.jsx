import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reuse icon logic or simplify
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

const AdminMap = ({ points }) => {
    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={2}
            style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-lg)' }}
        >
            <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles"
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
                    </Popup>
                </Marker>
            ))}
            <style>{`
        .leaflet-layer {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
        </MapContainer>
    );
};

export default AdminMap;
