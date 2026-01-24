import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguagePicker from './components/LanguagePicker';
import WelcomeMessage from './components/WelcomeMessage';
import OfflineIndicator from './components/OfflineIndicator';
import { ToastProvider } from './components/ToastProvider';
import Home from './pages/Home';
import MapView from './pages/MapView';

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { logger } from './utils/logger';


const AppContent = () => {
    const { user, loading } = useAuth();

    // Initialize logger hook
    useEffect(() => {
        // Here we could fetch initial debug state if we had an endpoint, 
        // or wait for socket event. Ideally, pass initial config from server.
        // For now, let's just listen for the event in the main App component or here.
    }, []);

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
            </div>
        );
    }

    if (!user) {
        return <Home />;
    }

    return (
        <>
            <MapView />
        </>
    );
};

// Debug Indicator Component
const DebugIndicator = () => {
    const [status, setStatus] = useState({ enabled: false, level: 'default' });
    const [appConfig, setAppConfig] = useState(null);

    useEffect(() => {
        // Fetch app config for testing banner
        fetch('/api/settings/app-config')
            .then(res => res.json())
            .then(data => setAppConfig(data))
            .catch(() => { });

        // Initial check for debug status (standalone logger handles its own fetch, we listen)
        const initialStatus = logger.getStatus();
        setStatus(initialStatus);

        const handleStatusUpdate = (e) => {
            setStatus({
                enabled: e.detail.enabled,
                level: e.detail.level || 'default'
            });
        };

        window.addEventListener('debug_status_updated', handleStatusUpdate);
        return () => window.removeEventListener('debug_status_updated', handleStatusUpdate);
    }, []);

    // If debug is OFF, but testing banner is ON, show testing banner
    if (!status.enabled) {
        if (appConfig?.testing_banner_enabled) {
            return (
                <div style={{
                    position: 'fixed', top: '0.4rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, padding: '0.2rem 0.6rem', background: 'rgba(255, 193, 7, 0.2)',
                    border: '1px solid rgba(255, 193, 7, 0.4)', borderRadius: '4px',
                    backdropFilter: 'blur(10px)', fontSize: '0.7rem', fontWeight: 600,
                    letterSpacing: '0.05em', color: '#ffc107', textTransform: 'uppercase',
                    pointerEvents: 'none'
                }}>
                    {appConfig.testing_banner_text || 'TESTING MODE'}
                </div>
            );
        }
        return null;
    }

    // Debug is ON -> Show Debug Badge (Top Center, replacing banner)
    const levelColors = {
        default: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: '#3b82f6' },
        aggressive: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: '#a855f7' },
        paranoic: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' }
    };

    const colors = levelColors[status.level] || levelColors.default;

    return (
        <div style={{
            position: 'fixed', top: '0.4rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, padding: '0.2rem 0.6rem', background: colors.bg,
            border: `1px solid ${colors.border}`, borderRadius: '4px',
            backdropFilter: 'blur(10px)', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.05em', color: colors.text, textTransform: 'uppercase',
            boxShadow: `0 2px 8px ${colors.bg}`, pointerEvents: 'none'
        }}>
            🐛 DEBUG MODE
        </div>
    );
};

const App = () => {
    return (
        <>

            <GlobalErrorBoundary>
                <LanguageProvider>
                    <ToastProvider>
                        <OfflineIndicator />
                        <WelcomeMessage />
                        <LanguagePicker />

                        {/* Debug Mode Indicator */}
                        <DebugIndicator />

                        <AppContent />
                    </ToastProvider>
                </LanguageProvider>
            </GlobalErrorBoundary>
        </>
    );
};

export default App;

// App entry point structure updated for 2026


