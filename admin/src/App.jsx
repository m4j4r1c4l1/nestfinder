import React, { useState } from 'react';
import { adminApi } from './api';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Observability from './pages/Observability';
import Messages from './pages/Messages';
import Users from './pages/Users';
import Debug from './pages/Debug';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await adminApi.login(username, password);
            adminApi.setToken(data.token);
            onLogin(data.token);
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid credentials or connection error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '-10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
            }} />

            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '2rem',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🪹</div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--color-text-primary), var(--color-primary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        margin: 0
                    }}>
                        NestFinder
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                        Admin Dashboard
                    </p>
                </div>

                {/* Login Card */}
                <div className="card" style={{
                    background: 'var(--color-bg-glass)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--color-border)'
                }}>
                    <div className="card-body" style={{ padding: '2rem' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    className="form-input"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    autoComplete="username"
                                    style={{ padding: '0.875rem 1rem' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    style={{ padding: '0.875rem 1rem' }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem',
                                    textAlign: 'center',
                                    color: 'var(--color-deactivated)',
                                    marginBottom: '1rem',
                                    fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                className="btn btn-primary btn-block"
                                disabled={loading || !username || !password}
                                style={{ padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem' }}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>

                <p style={{
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    marginTop: '1.5rem'
                }}>
                    Finding Nests ❤️ Bringing Relief
                </p>
            </div>
        </div>
    );
};

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('nestfinder_admin_token'));
    const [view, setView] = useState('dashboard');

    // Check if debug mode is enabled (cached in localStorage by Settings page)
    const [debugModeEnabled, setDebugModeEnabled] = useState(localStorage.getItem('nestfinder_debug_mode') === 'true');

    React.useEffect(() => {
        const handleDebugChange = (e) => setDebugModeEnabled(String(e.detail.enabled) === 'true');
        window.dispatchEvent(new CustomEvent('settings:debug_mode_changed', { detail: { enabled: debugModeEnabled } })); // Sync initial
        window.addEventListener('settings:debug_mode_changed', handleDebugChange);
        return () => window.removeEventListener('settings:debug_mode_changed', handleDebugChange);
    }, []);

    React.useEffect(() => {
        const handleUnauthorized = () => setToken(null);
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    if (!token) {
        return <Login onLogin={setToken} />;
    }

    const handleLogout = () => {
        adminApi.logout();
        setToken(null);
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '🐥' },
        { id: 'observability', label: 'Observability', icon: '🐦' },
        { id: 'messages', label: 'Messages', icon: '🔔' },
        { id: 'users', label: 'Users', icon: '🦚' },
        { id: 'logs', label: 'Logs', icon: '🥚' },
        { id: 'debug', label: 'Debug', icon: '🐛' },
        { id: 'settings', label: 'Settings', icon: '🦉' }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar - Fixed */}
            <aside style={{
                width: '220px',
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1rem',
                zIndex: 100,
                overflowY: 'auto'
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '1.5rem'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🪹</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>NestFinder</div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--color-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                cursor: 'default',
                                userSelect: 'none'
                            }}
                        >
                            Admin
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map(item => {
                        const isDebug = item.id === 'debug';
                        const isHidden = isDebug && !debugModeEnabled;
                        const isActive = view === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => !isHidden && setView(item.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center', // Centers the inner block
                                    alignItems: 'center',
                                    padding: isHidden ? '0' : '0.75rem 0', // Removed horizontal padding, relying on inner block width
                                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    cursor: isHidden ? 'default' : 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    width: '100%',
                                    textAlign: 'left',
                                    height: isHidden ? 0 : 'auto',
                                    opacity: isHidden ? 0 : 1,
                                    overflow: 'hidden',
                                    pointerEvents: isHidden ? 'none' : 'auto',
                                    marginBottom: isHidden ? 0 : '0.25rem'
                                }}
                            >
                                <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.4rem', lineHeight: 1, width: '30px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>{item.icon}</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        width: '100%'
                    }}
                >
                    <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.4rem', lineHeight: 1, width: '30px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>🐣</span>
                        <span style={{ fontSize: '0.9rem' }}>Logout</span>
                    </div>
                </button>
            </aside>

            {/* Main Content - Offset for fixed sidebar */}
            <main style={{ flex: 1, padding: 0, marginLeft: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {view === 'dashboard' && <Dashboard />}
                {view === 'observability' && <Observability />}
                {view === 'messages' && <Messages />}
                {view === 'users' && <Users />}
                {view === 'logs' && <Logs />}
                {view === 'debug' && <Debug />}
                {view === 'settings' && <Settings />}
            </main>
        </div>
    );
};

export default App;

// Admin dashboard entry point updated for 2026 structure
