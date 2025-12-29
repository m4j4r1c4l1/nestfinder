import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const WELCOME_KEY = 'nestfinder_welcome_shown';

const WelcomeMessage = ({ onClose }) => {
    const { t } = useLanguage();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const wasShown = localStorage.getItem(WELCOME_KEY);
        if (!wasShown) {
            setVisible(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(WELCOME_KEY, 'true');
        setVisible(false);
        if (onClose) onClose();
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(8px)',
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                maxWidth: '380px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative floating icons */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '15px',
                    fontSize: '1.5rem',
                    opacity: 0.6
                }}>❤️</div>
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    fontSize: '1.2rem',
                    opacity: 0.5
                }}>🌟</div>
                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '10px',
                    fontSize: '1.3rem',
                    opacity: 0.5
                }}>🤲</div>
                <div style={{
                    position: 'absolute',
                    bottom: '100px',
                    right: '15px',
                    fontSize: '1.2rem',
                    opacity: 0.4
                }}>💫</div>

                {/* Main Icon */}
                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
                    🪹
                </div>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    💕🤝💕
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1.6rem',
                    fontWeight: 700
                }}>
                    {t('welcome.title')}
                </h2>

                {/* Messages with icons */}
                <div style={{
                    marginBottom: '1.5rem',
                    lineHeight: 1.7,
                    fontSize: '0.95rem'
                }}>
                    <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span>✨</span>
                        <span>{t('welcome.message1')}</span>
                        <span>✨</span>
                    </p>
                    <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span>🤝</span>
                        <span>{t('welcome.message2')}</span>
                    </p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span>💪</span>
                        <span>{t('welcome.message3')}</span>
                        <span>🌍</span>
                    </p>
                </div>

                {/* Hearts divider */}
                <div style={{
                    margin: '1.5rem 0',
                    fontSize: '1rem',
                    opacity: 0.7
                }}>
                    ❤️ 🧡 💛 💚 💙 💜
                </div>

                {/* Call to action */}
                <p style={{
                    margin: '0 0 1.5rem 0',
                    fontSize: '0.9rem',
                    opacity: 0.95
                }}>
                    🏠 {t('welcome.callToAction')} 🏠
                </p>

                {/* Button */}
                <button
                    onClick={handleClose}
                    style={{
                        background: 'white',
                        color: '#667eea',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s',
                        width: '100%'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🚀 {t('welcome.button')} 🚀
                </button>
            </div>
        </div>
    );
};

export default WelcomeMessage;
