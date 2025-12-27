import React from 'react';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import MapView from './pages/MapView';

const App = () => {
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

    return <MapView />;
};

export default App;
