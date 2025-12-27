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

            navigator.geolocation.getCurrentPosition(
                (position) => {
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
                },
                (err) => {
                    setError(err);
                    setLoading(false);
                    reject(err);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
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

    return { location, error, loading, getCurrentLocation, getAddress };
};
