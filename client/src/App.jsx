import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguagePicker from './components/LanguagePicker';
import WelcomeMessage from './components/WelcomeMessage';
import Home from './pages/Home';
import MapView from './pages/MapView';

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
        <LanguageProvider>
            <WelcomeMessage />
            <LanguagePicker />
            <AppContent />
        </LanguageProvider>
    );
};

export default App;

// App entry point structure updated for 2026


