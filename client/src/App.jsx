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
import { ScreenLogger } from './components/ScreenLogger';

const AppContent = () => {
    const { user, loading } = useAuth();

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

const App = () => {
    return (
        <GlobalErrorBoundary>
            <ScreenLogger />
            <LanguageProvider>
                <ToastProvider>
                    <OfflineIndicator />
                    <WelcomeMessage />
                    <LanguagePicker />
                    <AppContent />
                </ToastProvider>
            </LanguageProvider>
        </GlobalErrorBoundary>
    );
};

export default App;

// App entry point structure updated for 2026


