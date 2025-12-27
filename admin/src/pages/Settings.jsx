import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

const Settings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        adminApi.getSettings().then(data => {
            setSettings(data.settings);
            setLoading(false);
        });
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await adminApi.updateSettings(settings);
            setMessage('Settings saved successfully!');
        } catch (err) {
            setMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div style={{ maxWidth: '600px' }}>
            <h2 className="mb-4">Global App Settings</h2>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">App Name</label>
                            <input
                                name="app_name"
                                className="form-input"
                                value={settings.app_name || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmations to Verify Point</label>
                            <input
                                name="confirmations_required"
                                type="number"
                                className="form-input"
                                value={settings.confirmations_required || ''}
                                onChange={handleChange}
                                min="1"
                            />
                            <p className="text-muted text-sm mt-auto">Number of confirmations needed to change status from Pending to Confirmed.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reports to Deactivate Point</label>
                            <input
                                name="deactivations_required"
                                type="number"
                                className="form-input"
                                value={settings.deactivations_required || ''}
                                onChange={handleChange}
                                min="1"
                            />
                            <p className="text-muted text-sm mt-auto">Number of different user reports required to mark a point as Deactivated.</p>
                        </div>

                        <div className="form-group">
                            <label className="flex gap-2" style={{ alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    name="weekly_reminder_enabled"
                                    checked={settings.weekly_reminder_enabled === 'true'}
                                    onChange={(e) => setSettings({ ...settings, weekly_reminder_enabled: e.target.checked ? 'true' : 'false' })}
                                />
                                Enable Weekly Validation Reminders
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        {message && <div className="text-center mt-auto" style={{ color: 'var(--color-confirmed)', marginTop: '1rem' }}>{message}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
