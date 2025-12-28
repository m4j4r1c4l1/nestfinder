import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePushNotifications } from './hooks/usePushNotifications';
import Home from './pages/Home';
import MapView from './pages/MapView';

const App = () => {
    const { user, loading } = useAuth();
    const { isSupported, isSubscribed, subscribe } = usePushNotifications();

    // Auto-subscribe to push notifications when user is authenticated
    useEffect(() => {
        if (user && isSupported && !isSubscribed) {
            // Small delay to let app settle before requesting permission
            const timer = setTimeout(() => {
                subscribe(user.id).catch(err => {
                    console.log('Push subscription skipped:', err.message);
                });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [user, isSupported, isSubscribed, subscribe]);

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
