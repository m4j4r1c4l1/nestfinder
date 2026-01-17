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
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // Initial check (from app-config or similar if available, otherwise waiting for socket)
        // Ideally we fetch this on load. For now, rely on socket updates or initial config fetch.
        fetch('/api/settings/app-config')
            .then(res => res.json())
            .then(data => {
                if (data.debug_mode_enabled) {
                    setEnabled(true);
                }
            })
            .catch(() => { });

        const handleSettings = (e) => {
            const settings = e.detail;
            if (settings.debug_mode_enabled !== undefined) {
                const isEnabled = String(settings.debug_mode_enabled) === 'true';
                setEnabled(isEnabled);
            }
        };

        window.addEventListener('settings_updated', handleSettings);
        return () => window.removeEventListener('settings_updated', handleSettings);
    }, []);

    if (!enabled) return null;

    return (
        <div style={{
            position: 'fixed', bottom: 10, right: 10,
            background: 'rgba(239, 68, 68, 0.9)', color: 'white',
            padding: '4px 8px', borderRadius: '4px', fontSize: '10px',
            fontWeight: 'bold', zIndex: 9999, pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            DEBUG MODE
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


