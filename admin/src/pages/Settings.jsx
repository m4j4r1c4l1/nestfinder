import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';

const Settings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [changingPassword, setChangingPassword] = useState(false);

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
        setMessage({ text: '', type: '' });
        try {
            await adminApi.updateSettings(settings);
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
        } catch (err) {
            setMessage({ text: 'Error saving settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            return;
        }

        if (passwords.new.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        setChangingPassword(true);
        setMessage({ text: '', type: '' });

        try {
            await adminApi.changePassword(passwords.current, passwords.new);
            setMessage({ text: 'Password changed successfully!', type: 'success' });
            setPasswords({ current: '', new: '', confirm: '' });
            setShowPasswordChange(false);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to change password', type: 'error' });
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div style={{ maxWidth: '700px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Settings</h2>

            {message.text && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: message.type === 'success' ? 'var(--color-confirmed)' : 'var(--color-deactivated)'
                }}>
                    {message.text}
                </div>
            )}

            {/* App Settings */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>📱 Application Settings</h3>
                </div>
                <div className="card-body" style={{ padding: '1.5rem' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    Confirmations needed to change status from Pending to Confirmed.
                                </p>
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
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    User reports required to mark a point as Deactivated.
                                </p>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="weekly_reminder_enabled"
                                    checked={settings.weekly_reminder_enabled === 'true'}
                                    onChange={(e) => setSettings({ ...settings, weekly_reminder_enabled: e.target.checked ? 'true' : 'false' })}
                                    style={{ width: 18, height: 18 }}
                                />
                                Enable Weekly Validation Reminders
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{ padding: '0.75rem 2rem' }}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Security Settings */}
            <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>🔒 Security</h3>
                </div>
                <div className="card-body" style={{ padding: '1.5rem' }}>
                    {!showPasswordChange ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 500 }}>Admin Password</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    Change your admin login password
                                </div>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowPasswordChange(true)}
                            >
                                Change Password
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={changingPassword}
                                >
                                    {changingPassword ? 'Changing...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowPasswordChange(false);
                                        setPasswords({ current: '', new: '', confirm: '' });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
