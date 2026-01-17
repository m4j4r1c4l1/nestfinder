import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage } from '../i18n/LanguageContext';
import { logger } from '../utils/logger';
import VoiceButton from './VoiceButton';

const SubmitPoint = ({ onSubmit, onCancel, initialLocation }) => {
    const { t } = useLanguage();
    const { location, loading: locLoading, getCurrentLocation, getAddress, setLocation } = useGeolocation();
    const [inputMode, setInputMode] = useState(initialLocation ? 'map' : 'gps'); // 'gps', 'address', or 'map'
    const [address, setAddress] = useState('');
    const [manualAddress, setManualAddress] = useState({ city: '', street: '', number: '' });
    const [tags, setTags] = useState([]); // 'Who' tags
    const [needs, setNeeds] = useState([]); // 'What' tags
    const [voiceNotes, setVoiceNotes] = useState(''); // Voice input notes
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [error, setError] = useState('');

    // 'Who' tag options - expanded to 52 emojis
    // 'Who' tag options - Restored to original set
    const tagOptions = [
        { id: 'single', emoji: '👤', label: t('submit.onePerson') },
        { id: 'group', emoji: '👥', label: t('submit.multiple') },
        { id: 'children', emoji: '👶', label: t('submit.children') },
        { id: 'dog', emoji: '🐕', label: t('submit.animals') }
    ];

    // 'What' need options - expanded to 15 emojis
    // 'What' need options - Restored to original set
    const needOptions = [
        { id: 'food', emoji: '🍲', label: t('submit.needFood') },
        { id: 'water', emoji: '💧', label: t('submit.needWater') },
        { id: 'medicine', emoji: '💊', label: t('submit.needMedicine') },
        { id: 'clothes', emoji: '👕', label: t('submit.needClothes') }
    ];

    const toggleTag = (tagId) => {
        setTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const toggleNeed = (needId) => {
        setNeeds(prev =>
            prev.includes(needId)
                ? prev.filter(n => n !== needId)
                : [...prev, needId]
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

    const handleGeocodeAddress = async (addrToGeocode = null) => {
        const addressQuery = addrToGeocode || `${manualAddress.street} ${manualAddress.number}, ${manualAddress.city}`;

        if (!addrToGeocode && (!manualAddress.city || !manualAddress.street)) {
            setError(t('submit.addressRequired'));
            return;
        }

        setIsGeocoding(true);
        setError('');

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`
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
            // Update displayed address if in voice mode or generic address mode
            if (inputMode === 'voice') {
                setAddress(result.display_name);
            }
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
            logger.log('SubmitPoint', 'Error', 'Submission attempted without location');
            return;
        }

        try {
            setIsSubmitting(true);
            // Combine tags and voice notes
            const allNotes = [...tags, ...needs];
            if (voiceNotes.trim()) allNotes.push(voiceNotes.trim());

            logger.log('SubmitPoint', 'Action', `Submitting point at ${location.latitude},${location.longitude} [${allNotes.join(',')}]`);

            await onSubmit({
                latitude: location.latitude,
                longitude: location.longitude,
                address,
                notes: allNotes.join(',')
            });
            logger.log('SubmitPoint', 'Success', 'Point submitted successfully');
        } catch (err) {
            console.error('Submit point error:', err);
            setError(err.message || t('submit.error'));
            logger.log('SubmitPoint', 'Error', `Submission failed: ${err.message}`);
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
                <div className="mb-4">
                    <div className="toggle-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'gps' ? 'active' : ''}`}
                            onClick={() => setInputMode('gps')}
                            style={{ justifyContent: 'center', textAlign: 'center' }}
                        >
                            📍<br /><span style={{ fontSize: '0.75rem' }}>{t('submit.gpsMode')}</span>
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'map' ? 'active' : ''}`}
                            onClick={() => setInputMode('map')}
                            style={{ justifyContent: 'center', textAlign: 'center' }}
                        >
                            🗺️<br /><span style={{ fontSize: '0.75rem' }}>{t('submit.mapMode')}</span>
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'address' ? 'active' : ''}`}
                            onClick={() => setInputMode('address')}
                            style={{ justifyContent: 'center', textAlign: 'center' }}
                        >
                            🏠<br /><span style={{ fontSize: '0.75rem' }}>{t('submit.addressMode')}</span>
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${inputMode === 'voice' ? 'active' : ''}`}
                            onClick={() => setInputMode('voice')}
                            style={{ justifyContent: 'center', textAlign: 'center' }}
                        >
                            🎤<br /><span style={{ fontSize: '0.75rem' }}>{t('submit.voiceMode')}</span>
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
                                    ✅ {t('submit.foundPrefix')} {address.substring(0, 60)}...
                                </div>
                            )}
                        </div>
                    )}

                    {inputMode === 'voice' && (
                        <div className="form-group" style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                <label className="form-label">{t('submit.voiceInstructions')}</label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                                <VoiceButton
                                    onTranscript={(text) => {
                                        setAddress(text);
                                        handleGeocodeAddress(text);
                                    }}
                                    disabled={isGeocoding || isSubmitting}
                                />
                            </div>

                            {isGeocoding && (
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
                                    <span className="spinner" style={{ width: 14, height: 14, display: 'inline-block', marginRight: 6 }} />
                                    {t('common.searching')}
                                </div>
                            )}

                            {address && (
                                <div style={{
                                    padding: 'var(--space-3)',
                                    background: location ? 'var(--color-confirmed-light)' : 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: 'var(--space-2)',
                                    border: location ? '1px solid var(--color-confirmed)' : '1px solid var(--color-border)'
                                }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: 'var(--space-1)' }}>
                                        {location ? '✅' : '📝'}
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                                        "{address}"
                                    </div>
                                    {location && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-confirmed)', marginTop: 'var(--space-1)' }}>
                                            {t('submit.locationFound')}
                                        </div>
                                    )}
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
                            gap: 'var(--space-1)',
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
                                        gap: '2px',
                                        padding: 'var(--space-2) 4px',
                                        background: tags.includes(tag.id)
                                            ? 'var(--color-primary-light)'
                                            : 'var(--color-bg-secondary)',
                                        border: tags.includes(tag.id)
                                            ? '2px solid var(--color-primary)'
                                            : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        minWidth: 0 // Allow shrinking
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem', lineHeight: 1, marginBottom: '2px' }}>{tag.emoji}</span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        color: tags.includes(tag.id)
                                            ? 'var(--color-primary)'
                                            : 'var(--color-text-secondary)',
                                        textAlign: 'center',
                                        lineHeight: 1.1,
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {tag.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                        <label className="form-label">{t('submit.needsLabel')}</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--space-1)',
                            marginTop: 'var(--space-2)'
                        }}>
                            {needOptions.map(need => (
                                <button
                                    key={need.id}
                                    type="button"
                                    onClick={() => toggleNeed(need.id)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                        padding: 'var(--space-2) 4px',
                                        background: needs.includes(need.id)
                                            ? 'var(--color-primary-light)'
                                            : 'var(--color-bg-secondary)',
                                        border: needs.includes(need.id)
                                            ? '2px solid var(--color-primary)'
                                            : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        minWidth: 0 // Allow shrinking
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem', lineHeight: 1, marginBottom: '2px' }}>{need.emoji}</span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        textAlign: 'center',
                                        color: needs.includes(need.id)
                                            ? 'var(--color-primary)'
                                            : 'var(--color-text-secondary)',
                                        lineHeight: 1.1,
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {need.label}
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
            </div >
        </div >
    );
};

export default SubmitPoint;
