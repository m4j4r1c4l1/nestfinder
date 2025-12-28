import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import MapView from './pages/MapView';

const API_URL = import.meta.env.VITE_API_URL || '';

const App = () => {
    const { user, loading } = useAuth();
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [subscribeError, setSubscribeError] = useState(null);

    // Check if push is supported
    const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    // Check if we should show notification prompt
    useEffect(() => {
        if (user && isPushSupported) {
            // Check if user has already dismissed the prompt
            const dismissed = localStorage.getItem('notificationPromptDismissed');
            if (!dismissed) {
                // Check if already subscribed
                navigator.serviceWorker.getRegistration().then(reg => {
                    if (reg) {
                        reg.pushManager.getSubscription().then(sub => {
                            if (!sub) {
                                // Not subscribed, show prompt after delay
                                setTimeout(() => setShowNotificationPrompt(true), 5000);
                            }
                        });
                    } else {
                        // No service worker, show prompt
                        setTimeout(() => setShowNotificationPrompt(true), 5000);
                    }
                });
            }
        }
    }, [user, isPushSupported]);

    // URL base64 to Uint8Array for VAPID key
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    };

    const handleEnableNotifications = async () => {
        setSubscribing(true);
        setSubscribeError(null);

        try {
            // Step 1: Request permission
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                setSubscribeError(`Permission: ${perm}`);
                setSubscribing(false);
                return;
            }

            // Step 2: Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Step 3: Get VAPID public key
            const keyResponse = await fetch(`${API_URL}/api/push/vapid-public-key`);
            const { publicKey, error } = await keyResponse.json();
            if (error) {
                setSubscribeError(`Server: ${error}`);
                setSubscribing(false);
                return;
            }

            // Step 4: Subscribe to push
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Step 5: Send subscription to server
            await fetch(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub.toJSON(),
                    userId: user?.id || 'anonymous'
                })
            });

            // Success!
            setShowNotificationPrompt(false);
            localStorage.setItem('notificationsEnabled', 'true');
        } catch (err) {
            console.error('Push subscription error:', err);
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

            {/* Notification Permission Prompt */}
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
