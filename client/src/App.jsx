import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePushNotifications } from './hooks/usePushNotifications';
import Home from './pages/Home';
import MapView from './pages/MapView';

const App = () => {
    const { user, loading } = useAuth();
    const pushNotifications = usePushNotifications();
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [subscribeError, setSubscribeError] = useState(null);

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
        setSubscribing(true);
        setSubscribeError(null);

        try {
            // Add timeout to prevent infinite hang
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 15000)
            );

            const subscribePromise = pushNotifications.subscribe(user?.id);

            const success = await Promise.race([subscribePromise, timeoutPromise]);

            if (success) {
                setShowNotificationPrompt(false);
            } else {
                // Show actual error from hook if available
                const hookError = pushNotifications.error;
                if (hookError) {
                    setSubscribeError(hookError);
                } else {
                    setSubscribeError('Permission denied. Click browser lock icon → Allow notifications.');
                }
            }
        } catch (err) {
            console.error('Push subscription failed:', err);
            setSubscribeError(err.message || 'Failed to enable');
        } finally {
            setSubscribing(false);
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

                    {subscribeError && (
                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-3)',
                            fontSize: '0.85rem'
                        }}>
                            ⚠️ {subscribeError}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                            onClick={handleEnableNotifications}
                            disabled={subscribing}
                            style={{
                                flex: 1,
                                background: subscribing ? 'rgba(255,255,255,0.7)' : 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: subscribing ? 'wait' : 'pointer'
                            }}
                        >
                            {subscribing ? '⏳ Enabling...' : 'Enable'}
                        </button>
                        <button
                            onClick={handleDismissPrompt}
                            disabled={subscribing}
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
