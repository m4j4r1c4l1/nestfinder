import { useState, useEffect } from 'react';

export const useGeolocation = (apiKey) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'

    // Check permission state on mount
    useEffect(() => {
        const checkPermission = async () => {
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    setPermissionState(result.state);

                    // Listen for permission changes
                    result.addEventListener('change', () => {
                        setPermissionState(result.state);
                    });
                }
            } catch (err) {
                // Some browsers don't support permissions query for geolocation
                console.log('Permission API not supported:', err);
            }
        };
        checkPermission();
    }, []);

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = new Error('Geolocation is not supported by your browser');
                setError(err);
                reject(err);
                return;
            }

            setLoading(true);
            setError(null); // Clear previous errors

            // ENFORCE TIMEOUT: If browser hangs, we kill it manually after 10s
            // This is critical for iOS/Android which can freeze pending permission
            const timeoutId = setTimeout(() => {
                const timeoutErr = new Error('Location request timed out. Please check device settings.');
                setError(timeoutErr);
                setLoading(false);
                reject(timeoutErr);
            }, 10000);

            const success = (position) => {
                clearTimeout(timeoutId); // Good, we got it
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                };
                setLocation(coords);
                setLoading(false);
                setPermissionState('granted'); // Update state
                resolve(coords);
            };

            const failure = (err) => {
                clearTimeout(timeoutId); // Stopped waiting

                // Update permission state based on error
                if (err.code === 1) { // PERMISSION_DENIED
                    setPermissionState('denied');
                }

                // If high accuracy fails (timeout or unavailable), try low accuracy
                if (err.code === 3 || err.code === 2) {
                    console.log('High accuracy failed, trying low accuracy...');
                    navigator.geolocation.getCurrentPosition(
                        success,
                        (finalErr) => {
                            if (finalErr.code === 1) {
                                setPermissionState('denied');
                            }
                            setError(finalErr);
                            setLoading(false);
                            reject(finalErr);
                        },
                        {
                            enableHighAccuracy: false,
                            timeout: 10000,
                            maximumAge: 60000
                        }
                    );
                } else {
                    setError(err);
                    setLoading(false);
                    reject(err);
                }
            };

            try {
                navigator.geolocation.getCurrentPosition(
                    success,
                    failure,
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } catch (e) {
                clearTimeout(timeoutId);
                reject(e);
            }
        });
    };

    // Function to get address from coordinates (Reverse Geocoding using OpenStreetMap Nominatim)
    const getAddress = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'NestFinder/1.0' } }
            );
            const data = await response.json();
            return data.display_name || 'Unknown location';
        } catch (e) {
            console.error('Reverse geocoding error:', e);
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    };

    return {
        location,
        setLocation,
        error,
        loading,
        permissionState,
        getCurrentLocation,
        getAddress
    };
};
