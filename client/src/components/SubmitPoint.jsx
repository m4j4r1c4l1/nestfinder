import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

const SubmitPoint = ({ onSubmit, onCancel, initialLocation }) => {
    const { location, loading: locLoading, getCurrentLocation, getAddress, setLocation } = useGeolocation();
    const [inputMode, setInputMode] = useState(initialLocation ? 'map' : 'gps'); // 'gps', 'address', or 'map'
    const [address, setAddress] = useState('');
    const [manualAddress, setManualAddress] = useState({ city: '', street: '', number: '' });
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [error, setError] = useState('');

    // Handle initialLocation from map click
    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation);
            setInputMode('map');
            // Reverse geocode to get address
            getAddress(initialLocation.latitude, initialLocation.longitude)
                .then(addr => setAddress(addr))
                .catch(() => setAddress(`${initialLocation.latitude.toFixed(4)}, ${initialLocation.longitude.toFixed(4)}`));
        }
    }, [initialLocation]);

    const handleGetLocation = async () => {
        try {
            setError('');
            const loc = await getCurrentLocation();
            const addr = await getAddress(loc.latitude, loc.longitude);
            setAddress(addr);
        } catch (err) {
            setError('Could not get location. Ensure GPS is enabled.');
        }
    };

    const handleGeocodeAddress = async () => {
        const fullAddress = `${manualAddress.street} ${manualAddress.number}, ${manualAddress.city}`;
        if (!manualAddress.city || !manualAddress.street) {
            setError('Please enter at least city and street');
            return;
        }

        setIsGeocoding(true);
        setError('');

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
            );
            const data = await response.json();

            if (data.length === 0) {
                setError('Address not found. Try a different format.');
                setIsGeocoding(false);
                return;
            }

            const result = data[0];
            if (setLocation) {
                setLocation({
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon)
                });
            }
            setAddress(result.display_name);
        } catch (err) {
            setError('Failed to geocode address. Check your connection.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            setError('Location is required. Use GPS, click on map, or enter an address.');
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                latitude: location.latitude,
                longitude: location.longitude,
                address,
                notes
            });
        } catch (err) {
            console.error('Submit point error:', err);
            setError(err.message || 'Failed to submit. Try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header flex-between flex-center">
                <h3 className="card-title" style={{ marginBottom: 0 }}>Report Location</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                    &times;
                </button>
            </div>

            <div className="card-body">
                {/* Mode Toggle */}
                <div className="mb-4">
                    <div className="toggle-group">
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'gps' ? 'active' : ''}`}
                            onClick={() => setInputMode('gps')}
                        >
                            📍 GPS
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'map' ? 'active' : ''}`}
                            onClick={() => setInputMode('map')}
                        >
                            🗺️ Map
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'address' ? 'active' : ''}`}
                            onClick={() => setInputMode('address')}
                        >
                            🏠 Address
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {inputMode === 'gps' && (
                        <div className="form-group">
                            <label className="form-label">Current Location</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={address || (location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '')}
                                    placeholder="Tap button to find location"
                                    readOnly
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-icon"
                                    onClick={handleGetLocation}
                                    disabled={locLoading}
                                >
                                    {locLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '📍'}
                                </button>
                            </div>
                        </div>
                    )}

                    {inputMode === 'map' && (
                        <div className="form-group">
                            <label className="form-label">Selected Location</label>
                            <div style={{
                                padding: 'var(--space-3)',
                                background: location ? 'var(--color-confirmed-light)' : 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem'
                            }}>
                                {location ? (
                                    <>
                                        <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                            ✅ Location selected
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ color: 'var(--color-text-muted)' }}>
                                        👆 Tap on the map to select a location
                                    </div>
                                )}
                            </div>
                            {!location && (
                                <div style={{ marginTop: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    Close this panel, tap on the map where you want to report, and it will open again with that location.
                                </div>
                            )}
                        </div>
                    )}

                    {inputMode === 'address' && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Madrid"
                                    value={manualAddress.city}
                                    onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label className="form-label">Street</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Gran Vía"
                                        value={manualAddress.street}
                                        onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., 42"
                                        value={manualAddress.number}
                                        onChange={(e) => setManualAddress({ ...manualAddress, number: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary btn-block"
                                onClick={handleGeocodeAddress}
                                disabled={isGeocoding || !manualAddress.city || !manualAddress.street}
                            >
                                {isGeocoding ? 'Searching...' : '🔍 Find Location'}
                            </button>
                            {location && address && inputMode === 'address' && (
                                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-confirmed-light)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                                    ✅ Found: {address.substring(0, 60)}...
                                </div>
                            )}
                        </div>
                    )}

                    {error && <div style={{ color: 'var(--color-deactivated)', fontSize: '12px', marginTop: 'var(--space-2)' }}>{error}</div>}

                    <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                        <label className="form-label">Notes (Optional)</label>
                        <textarea
                            className="form-input"
                            placeholder="Describe the location or situation..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2" style={{ marginTop: 'var(--space-4)' }}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={isSubmitting || !location}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Location'}
                        </button>
                    </div>

                    <p className="text-muted text-center text-sm" style={{ marginTop: 'var(--space-4)' }}>
                        This helps us track where assistance is needed.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SubmitPoint;
