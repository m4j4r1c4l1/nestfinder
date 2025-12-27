import React, { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

const SubmitPoint = ({ onSubmit, onCancel }) => {
    const { location, loading: locLoading, getCurrentLocation, getAddress } = useGeolocation();
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Get location on mount logic could go here, but better to let user trigger it explicitly to save battery

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            setError('Location is required. Tap "Get My Location"');
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
            setError('Failed to submit. Try again.');
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
                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label className="form-label">Location</label>
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
                        {error && <div style={{ color: 'var(--color-deactivated)', fontSize: '12px', marginTop: 4 }}>{error}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (Optional)</label>
                        <textarea
                            className="form-input"
                            placeholder="Describe the location or situation..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2" style={{ marginTop: 'var(--space-6)' }}>
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
        </div >
    );
};

export default SubmitPoint;
