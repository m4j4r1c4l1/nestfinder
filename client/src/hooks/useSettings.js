import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const useSettings = () => {
    const [settings, setSettings] = useState({
        confirmations_required: 1,
        deactivations_required: 3,
        weekly_reminder_enabled: true,
        app_name: 'NestFinder'
    });

    useEffect(() => {
        api.getSettings().then(data => {
            if (data.settings) {
                setSettings(data.settings);
            }
        });
    }, []);

    return settings;
};
