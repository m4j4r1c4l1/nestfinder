import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import config from '../config';

const Home = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
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
            <div className="welcome-logo" style={{ fontSize: '6rem' }}>🪹</div>
            <h1 className="welcome-title">{t('welcome.title')}</h1>
            <p className="welcome-subtitle">{t('welcome.subtitle')}</p>

            {/* Testing Mode Notice - Configurable via config.js */}
            {config.SHOW_TESTING_NOTICE && (
                <div style={{
                    maxWidth: '420px',
                    margin: '1.5rem auto 1rem',
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
                        background: `${config.testingMode.badgeColor}33`,
                        border: `1px solid ${config.testingMode.badgeColor}66`,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        color: config.testingMode.badgeColor,
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase'
                    }}>
                        {config.testingMode.badgeText}
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: 1.5
                    }}>
                        {config.testingMode.message}
                    </p>
                </div>
            )}

            <form className="welcome-form" onSubmit={handleStart}>
                <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                        {t('welcome.nicknameLabel')}
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('welcome.nicknamePlaceholder')}
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
                    {loading ? t('welcome.buttonLoading') : t('welcome.buttonStart')}
                </button>
            </form>
        </div>
    );
};

export default Home;
