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
                await recoverFromKey(nickname.trim().toLowerCase());
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
            {/* Testing Mode Notice - Positioned at top */}
            {/* Testing Mode Notice or Debug Badge */}
            {(localStorage.getItem('nestfinder_debug_mode') === 'true') ? (
                <div style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center',
                    color: '#3b82f6',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                }}>
                    🐛 DEBUG MODE
                </div>
            ) : (appConfig?.testing_banner_enabled && (
                <div style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: '420px',
                    width: 'calc(100% - 2rem)',
                    padding: '0.75rem 1.25rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-lg)',
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        background: 'rgba(255, 193, 7, 0.2)',
                        border: '1px solid rgba(255, 193, 7, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        color: '#ffc107',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase'
                    }}>
                        {appConfig.testing_banner_text}
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: 1.5
                    }}>
                        This app is in testing phase. Your feedback helps us improve.
                    </p>
                </div>
            ))}

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
