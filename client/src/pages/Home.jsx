import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
    const { login } = useAuth();
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStart = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(nickname);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="welcome-screen">
            <div className="welcome-logo">🐦</div>
            <h1 className="welcome-title">NestFinder</h1>
            <p className="welcome-subtitle">Finding nests for those without one.</p>

            <form className="welcome-form" onSubmit={handleStart}>
                <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                        Enter a nickname to contribute (optional)
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Anonymous Helper"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        style={{ textAlign: 'center', fontSize: '1.1rem', padding: '1rem' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-block btn-lg"
                    disabled={loading}
                >
                    {loading ? 'Starting...' : 'Start Helping'}
                </button>
            </form>
        </div>
    );
};

export default Home;
