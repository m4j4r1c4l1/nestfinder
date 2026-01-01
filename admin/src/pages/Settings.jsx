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

    // Reset state
    const [resetting, setResetting] = useState(null); // 'logs' | 'points' | 'users' | 'all' | null
    const [confirmReset, setConfirmReset] = useState(null);

    useEffect(() => {
        adminApi.getSettings().then(data => {
            setSettings(data.settings);
            setLoading(false);
        });
    }, []);

    // Auto-hide success messages after 4 seconds
    useEffect(() => {
        if (message.text && message.type === 'success') {
            const timer = setTimeout(() => setMessage({ text: '', type: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

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

    const handleReset = async (target) => {
        setResetting(target);
        setMessage({ text: '', type: '' });
        try {
            const result = await adminApi.resetDatabase(target);
            setMessage({ text: result.message, type: 'success' });
            setConfirmReset(null);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to reset', type: 'error' });
        } finally {
            setResetting(null);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    const resetOptions = [
        { target: 'logs', label: 'Clear Logs', desc: 'Delete all activity logs', icon: '📜', color: '#f59e0b' },
        { target: 'points', label: 'Clear Points', desc: 'Delete all points and confirmations', icon: '📍', color: '#ef4444' },
        { target: 'users', label: 'Clear Users', desc: 'Delete all users (also clears points, logs)', icon: '👥', color: '#dc2626' },
        { target: 'all', label: 'Reset All', desc: 'Delete everything except settings', icon: '💣', color: '#991b1b' }
    ];

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
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
                        {/* App Name Section */}
                        <div className="form-group">
                            <label className="form-label">App Name</label>
                            <input name="app_name" className="form-input" value={settings.app_name || ''} onChange={handleChange} />
                        </div>

                        {/* Separator */}
                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

                        {/* Thresholds Section */}
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>⚙️ Thresholds</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Confirmations to Verify</label>
                                <input name="confirmations_required" type="number" className="form-input" value={settings.confirmations_required || ''} onChange={handleChange} min="1" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reports to Deactivate</label>
                                <input name="deactivations_required" type="number" className="form-input" value={settings.deactivations_required || ''} onChange={handleChange} min="1" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Deactivated Point Retention (Days)</label>
                            <input name="deactivation_retention_days" type="number" className="form-input" value={settings.deactivation_retention_days || '7'} onChange={handleChange} min="1" max="365" />
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                Deactivated points are removed from the map after this many days
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="weekly_reminder_enabled" checked={settings.weekly_reminder_enabled === 'true'} onChange={(e) => setSettings({ ...settings, weekly_reminder_enabled: e.target.checked ? 'true' : 'false' })} style={{ width: 18, height: 18 }} />
                                Enable Weekly Validation Reminders
                            </label>
                        </div>

                        {/* Separator */}
                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

                        {/* Client Polling Section */}
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>📡 Client Message Polling</span>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0' }}>
                            <label className="form-label">Client Message Polling Interval (seconds)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={Math.floor(parseInt(settings.polling_interval_ms || '60000', 10) / 1000)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val >= 5) {
                                        setSettings({ ...settings, polling_interval_ms: (val * 1000).toString() });
                                    }
                                }}
                                min="5"
                                max="3600"
                            />
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                Frequency of client check-ins (Default: 60s). Lower values increase server load.
                            </div>
                        </div>

                        {/* Separator */}
                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />


                        {/* Testing Banner Section */}
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>🧪 Testing Banner</span>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="testing_banner_enabled"
                                    checked={settings.testing_banner_enabled === 'true'}
                                    onChange={(e) => setSettings({ ...settings, testing_banner_enabled: e.target.checked ? 'true' : 'false' })}
                                    style={{ width: 18, height: 18 }}
                                />
                                Show testing banner on client app
                            </label>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.85rem' }}>Badge Text</label>
                            <input
                                name="testing_banner_text"
                                className="form-input"
                                value={settings.testing_banner_text || 'Beta Testing'}
                                onChange={handleChange}
                                placeholder="e.g., Beta Testing, Alpha, Preview"
                                style={{ fontSize: '0.9rem', background: 'var(--color-bg-tertiary)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.75rem 2rem' }}>
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Security Settings */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>🔒 Security</h3>
                </div>
                <div className="card-body" style={{ padding: '1.5rem' }}>
                    <form onSubmit={handleSave}>
                        {/* Rate Limits Section */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>API Rate Limits</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Configure protection against abuse</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Global Limit</label>
                                <input name="rate_limit_global" type="number" className="form-input" value={settings.rate_limit_global || '60'} onChange={handleChange} min="1" />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requests per minute per IP</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Admin Login</label>
                                <input name="rate_limit_admin_login" type="number" className="form-input" value={settings.rate_limit_admin_login || '5'} onChange={handleChange} min="1" />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Attempts per 15 minutes</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Registration</label>
                                <input name="rate_limit_register" type="number" className="form-input" value={settings.rate_limit_register || '10'} onChange={handleChange} min="1" />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requests per hour</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Point Submission</label>
                                <input name="rate_limit_submit" type="number" className="form-input" value={settings.rate_limit_submit || '20'} onChange={handleChange} min="1" />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requests per hour</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Voting</label>
                                <input name="rate_limit_vote" type="number" className="form-input" value={settings.rate_limit_vote || '30'} onChange={handleChange} min="1" />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requests per hour</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Update Rate Limits'}
                            </button>
                        </div>
                    </form>

                    {/* Separator */}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 1.5rem 0' }} />

                    {!showPasswordChange ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 500 }}>Admin Password</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Change your admin login password</div>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setShowPasswordChange(true)}>Change Password</button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" className="form-input" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input type="password" className="form-input" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} required minLength={6} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input type="password" className="form-input" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={changingPassword}>{changingPassword ? 'Changing...' : 'Update Password'}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowPasswordChange(false); setPasswords({ current: '', new: '', confirm: '' }); }}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <div className="card-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-deactivated)' }}>⚠️ Danger Zone</h3>
                </div>
                <div className="card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {resetOptions.map(opt => (
                            <div key={opt.target} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `3px solid ${opt.color}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                                    </div>
                                </div>
                                {confirmReset === opt.target ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn"
                                            style={{ background: opt.color, color: 'white', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                            onClick={() => handleReset(opt.target)}
                                            disabled={resetting === opt.target}
                                        >
                                            {resetting === opt.target ? '...' : 'Confirm'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                            onClick={() => setConfirmReset(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn"
                                        style={{ background: 'transparent', border: `1px solid ${opt.color}`, color: opt.color, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                        onClick={() => setConfirmReset(opt.target)}
                                    >
                                        {opt.label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
