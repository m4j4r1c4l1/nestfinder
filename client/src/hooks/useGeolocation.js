import { useState, useEffect } from 'react';

export const useGeolocation = (apiKey) => { // apiKey not used for browser native, but kept signature generic
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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
            const timeoutId = setTimeout(() => {
                setError(new Error('Location request timed out completely'));
                setLoading(false);
                reject(new Error('Location request timed out completely'));
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
                resolve(coords);
            };

            const failure = (err) => {
                clearTimeout(timeoutId); // Stopped waiting
                // If high accuracy fails (timeout or unavailable), try low accuracy
                if (err.code === 3 || err.code === 2) {
                    console.log('High accuracy failed, trying low accuracy...');
                    navigator.geolocation.getCurrentPosition(
                        success,
                        (finalErr) => {
                            setError(finalErr);
                            setLoading(false);
                            reject(finalErr);
                        },
                        {
                            enableHighAccuracy: false,
                            timeout: 15000,
                            maximumAge: 30000
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

return { location, setLocation, error, loading, getCurrentLocation, getAddress };
};
