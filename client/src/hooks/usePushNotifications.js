import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || '';

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [permission, setPermission] = useState('default');
    const [error, setError] = useState(null);

    // Check if push notifications are supported
    useEffect(() => {
        const supported =
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;

        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    // Convert VAPID key from base64 to Uint8Array
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // Subscribe to push notifications
    const subscribe = useCallback(async (userId = null) => {
        if (!isSupported) {
            setError('Push notifications not supported');
            return false;
        }

        try {
            // Request permission
            console.log('[Push] Requesting permission...');
            const perm = await Notification.requestPermission();
            console.log('[Push] Permission result:', perm);
            setPermission(perm);

            if (perm !== 'granted') {
                console.log('[Push] Permission denied:', perm);
                setError(`Permission: ${perm}`);
                return false;
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Get VAPID public key from server
            const keyResponse = await fetch(`${API_URL}/api/push/vapid-public-key`);
            const { publicKey } = await keyResponse.json();

            // Subscribe to push
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send subscription to server
            await fetch(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub.toJSON(),
                    userId: userId || localStorage.getItem('userId') || 'anonymous'
                })
            });

            setSubscription(sub);
            console.log('Push notification subscription successful');
            return true;
        } catch (err) {
            console.error('Push subscription error:', err);
            setError(err.message);
            return false;
        }
    }, [isSupported]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        try {
            if (subscription) {
                await fetch(`${API_URL}/api/push/unsubscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
                await subscription.unsubscribe();
                setSubscription(null);
            }
        } catch (err) {
            console.error('Unsubscribe error:', err);
            setError(err.message);
        }
    }, [subscription]);

    // Check existing subscription on mount
    useEffect(() => {
        const checkSubscription = async () => {
            if (!isSupported) return;

            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    const existingSub = await registration.pushManager.getSubscription();
                    setSubscription(existingSub);
                }
            } catch (err) {
                console.log('Could not check subscription:', err);
            }
        };

        checkSubscription();
    }, [isSupported]);

    return {
        isSupported,
        subscription,
        permission,
        error,
        subscribe,
        unsubscribe,
        isSubscribed: !!subscription
    };
};

export default usePushNotifications;
