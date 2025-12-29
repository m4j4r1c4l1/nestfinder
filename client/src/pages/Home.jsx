import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

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
