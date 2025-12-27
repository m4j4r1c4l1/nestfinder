import React, { useState, useEffect } from 'react';
import { adminApi } from './api';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await adminApi.login(username, password);
            adminApi.setToken(data.token);
            onLogin(data.token);
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
            <h1 className="welcome-title mb-6">NestFinder Admin</h1>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        {error && <div className="text-center mb-4" style={{ color: 'var(--color-deactivated)' }}>{error}</div>}
                        <button className="btn btn-primary btn-block">Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('nestfinder_admin_token'));
    const [view, setView] = useState('dashboard');

    if (!token) {
        return <Login onLogin={setToken} />;
    }

    const handleLogout = () => {
        adminApi.logout();
        setToken(null);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)', padding: '2rem 1rem' }}>
                <div className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🐦 NestFinder <span style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '5px' }}>ADMIN</span>
                </div>

                <nav className="flex-col gap-2">
                    <button className={`btn btn-block ${view === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('dashboard')}>Dashboard</button>
                    <button className={`btn btn-block ${view === 'logs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('logs')}>Logs</button>
                    <button className={`btn btn-block ${view === 'settings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('settings')}>Settings</button>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    <button className="btn btn-secondary btn-block" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {view === 'dashboard' && <Dashboard />}
                {view === 'logs' && <Logs />}
                {view === 'settings' && <Settings />}
            </main>
        </div>
    );
};

export default App;
