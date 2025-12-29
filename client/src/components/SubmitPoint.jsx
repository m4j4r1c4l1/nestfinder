import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage } from '../i18n/LanguageContext';

const SubmitPoint = ({ onSubmit, onCancel, initialLocation }) => {
    const { t } = useLanguage();
    const { location, loading: locLoading, getCurrentLocation, getAddress, setLocation } = useGeolocation();
    const [inputMode, setInputMode] = useState(initialLocation ? 'map' : 'gps'); // 'gps', 'address', or 'map'
    const [address, setAddress] = useState('');
    const [manualAddress, setManualAddress] = useState({ city: '', street: '', number: '' });
    const [tags, setTags] = useState([]); // Array of selected emoji tags
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [error, setError] = useState('');

    // Available tag options - use translated labels
    const tagOptions = [
        { id: 'single', emoji: '👤', label: t('submit.onePerson') },
        { id: 'group', emoji: '👥', label: t('submit.multiple') },
        { id: 'children', emoji: '👶', label: t('submit.children') },
        { id: 'animals', emoji: '🐕', label: t('submit.animals') }
    ];

    const toggleTag = (tagId) => {
        setTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

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
            setError(t('geo.unavailable'));
        }
    };

    const handleGeocodeAddress = async () => {
        const fullAddress = `${manualAddress.street} ${manualAddress.number}, ${manualAddress.city}`;
        if (!manualAddress.city || !manualAddress.street) {
            setError(t('submit.addressRequired'));
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
                setError(t('submit.addressNotFound'));
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
            setError(t('submit.geocodeError'));
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            setError(t('submit.locationRequired'));
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                latitude: location.latitude,
                longitude: location.longitude,
                address,
                notes: tags.join(',') // Send tags as comma-separated string for backwards compatibility
            });
        } catch (err) {
            console.error('Submit point error:', err);
            setError(err.message || t('submit.error'));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header flex-between items-center">
                <h3 className="card-title">{t('submit.title')}</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
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
                            📍 {t('submit.gpsMode')}
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'map' ? 'active' : ''}`}
                            onClick={() => setInputMode('map')}
                        >
                            🗺️ {t('submit.mapMode')}
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'address' ? 'active' : ''}`}
                            onClick={() => setInputMode('address')}
                        >
                            🏠 {t('submit.addressMode')}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {inputMode === 'gps' && (
                        <div className="form-group">
                            <label className="form-label">{t('submit.currentLocationLabel')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={address || (location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '')}
                                    placeholder={t('submit.tapToLocate')}
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
                            <label className="form-label">{t('submit.selectedLocation')}</label>
                            <div style={{
                                padding: 'var(--space-3)',
                                background: location ? 'var(--color-confirmed-light)' : 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem'
                            }}>
                                {location ? (
                                    <>
                                        <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                            ✅ {t('submit.locationSelected')}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ color: 'var(--color-text-muted)' }}>
                                        👆 {t('submit.tapMapPrompt')}
                                    </div>
                                )}
                            </div>
                            {!location && (
                                <div style={{ marginTop: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {t('submit.mapInstructions')}
                                </div>
                            )}
                        </div>
                    )}

                    {inputMode === 'address' && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">{t('submit.cityLabel')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('submit.cityPlaceholder')}
                                    value={manualAddress.city}
                                    onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label className="form-label">{t('submit.streetLabel')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('submit.streetPlaceholder')}
                                        value={manualAddress.street}
                                        onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">{t('submit.numberLabel')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('submit.numberPlaceholder')}
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
                                {isGeocoding ? t('common.loading') : `🔍 ${t('submit.findLocation')}`}
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
                        <label className="form-label">{t('submit.tagsLabel')}</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--space-2)',
                            marginTop: 'var(--space-2)'
                        }}>
                            {tagOptions.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 'var(--space-1)',
                                        padding: 'var(--space-3) var(--space-2)',
                                        background: tags.includes(tag.id)
                                            ? 'var(--color-primary-light)'
                                            : 'var(--color-bg-secondary)',
                                        border: tags.includes(tag.id)
                                            ? '2px solid var(--color-primary)'
                                            : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{tag.emoji}</span>
                                    <span style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: tags.includes(tag.id)
                                            ? 'var(--color-primary)'
                                            : 'var(--color-text-secondary)'
                                    }}>
                                        {tag.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2" style={{ marginTop: 'var(--space-4)' }}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={isSubmitting || !location}
                        >
                            {isSubmitting ? t('submit.submitting') : t('submit.submitBtn')}
                        </button>
                    </div>

                    <p className="text-muted text-center text-sm" style={{ marginTop: 'var(--space-4)' }}>
                        {t('submit.subtitle')}
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SubmitPoint;
