import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

const Home = () => {
    const { login, recoverFromKey } = useAuth();
    const { t } = useLanguage();
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [appConfig, setAppConfig] = useState(null);
    const [error, setError] = useState(null);

    // Fetch app config for testing banner settings
    useEffect(() => {
        api.getAppConfig()
            .then(config => setAppConfig(config))
            .catch(err => console.error('Failed to fetch app config:', err));
    }, []);

    // Detect 3-word recovery key pattern (word-word-word)
    const isRecoveryKey = (input) => /^[a-zA-Z]+-[a-zA-Z]+-[a-zA-Z]+$/.test(input.trim());

    const handleStart = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        logger.log('Home', 'Action', `User clicking start with input: ${nickname ? 'Provided' : 'Empty'}`);

        try {
            if (isRecoveryKey(nickname)) {
                // Attempt recovery
                const cleanKey = nickname.trim().toLowerCase();
                await recoverFromKey(cleanKey);
                sessionStorage.setItem('nestfinder_recovery_key_temp', cleanKey);
            } else {
                // Normal registration
                await login(nickname);
            }
        } catch (err) {
            console.error(err);
            logger.log('Home', 'Error', `Start action failed: ${err.message}`);
            if (isRecoveryKey(nickname)) {
                setError(t?.('welcome.invalidRecoveryKey') || 'Invalid recovery key. Please check and try again.');
            } else {
                setError(err.message || 'An error occurred. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="welcome-screen">
            <div className="welcome-logo" style={{ fontSize: '6rem' }}>🪹</div>
            <h1 className="welcome-title">{t('welcome.title')}</h1>
            <p className="welcome-subtitle">{t('welcome.subtitle')}</p>

            <form className="welcome-form" onSubmit={handleStart}>
                <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                        {t('welcome.nicknameLabel')}
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('welcome.nicknamePlaceholder')}
                        value={nickname}
                        onChange={(e) => { setNickname(e.target.value); setError(null); }}
                        style={{ textAlign: 'center', fontSize: '1.1rem', padding: '1rem' }}
                    />
                    {error && (
                        <div style={{
                            marginTop: 'var(--space-2)',
                            padding: 'var(--space-2)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: '#ef4444',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-block btn-lg"
                    disabled={loading}
                >
                    {loading ? t('welcome.buttonLoading') : t('welcome.buttonStart')}
                </button>
            </form>
        </div>
    );
};

export default Home;
