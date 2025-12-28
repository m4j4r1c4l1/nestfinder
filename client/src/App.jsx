import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePushNotifications } from './hooks/usePushNotifications';
import Home from './pages/Home';
import MapView from './pages/MapView';

const App = () => {
    const { user, loading } = useAuth();
    const pushNotifications = usePushNotifications();
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    // Check if we should show notification prompt
    useEffect(() => {
        if (user && pushNotifications.isSupported && !pushNotifications.isSubscribed) {
            // Check if user has already dismissed the prompt
            const dismissed = localStorage.getItem('notificationPromptDismissed');
            if (!dismissed) {
                // Show prompt after a delay
                const timer = setTimeout(() => {
                    setShowNotificationPrompt(true);
                }, 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, pushNotifications.isSupported, pushNotifications.isSubscribed]);

    const handleEnableNotifications = async () => {
        try {
            const success = await pushNotifications.subscribe(user?.id);
            if (success) {
                setShowNotificationPrompt(false);
            }
        } catch (err) {
            console.log('Push subscription failed:', err.message);
        }
    };

    const handleDismissPrompt = () => {
        setShowNotificationPrompt(false);
        localStorage.setItem('notificationPromptDismissed', 'true');
    };

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

            {/* Notification Permission Prompt - Requires user gesture for iOS */}
            {showNotificationPrompt && (
                <div style={{
                    position: 'fixed',
                    bottom: '120px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    maxWidth: '90%',
                    width: '360px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🔔</div>
                    <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.1rem', fontWeight: 600 }}>
                        Enable Notifications?
                    </h3>
                    <p style={{ margin: '0 0 var(--space-3) 0', fontSize: '0.9rem', opacity: 0.95 }}>
                        Get alerts when new locations are reported
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                            onClick={handleEnableNotifications}
                            style={{
                                flex: 1,
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Enable
                        </button>
                        <button
                            onClick={handleDismissPrompt}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Not Now
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default App;
