import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import languages, { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getAvailableLanguages } from './index.js';

const STORAGE_KEY = 'nestfinder_language';

// Create context
const LanguageContext = createContext(null);

/**
 * Detect user's preferred language from browser/system settings
 * Returns null if cannot determine or language not supported
 */
const detectLanguage = () => {
    try {
        // Check navigator.languages (array of preferred languages)
        const browserLangs = navigator.languages || [navigator.language];

        for (const lang of browserLangs) {
            // Get the primary language code (e.g., 'es-ES' -> 'es')
            const code = lang.split('-')[0].toLowerCase();
            if (SUPPORTED_LANGUAGES.includes(code)) {
                return code;
            }
        }
    } catch (e) {
        console.warn('Could not detect browser language:', e);
    }

    return null;
};

/**
 * Get nested translation value using dot notation
 * e.g., t('nav.map') -> 'Map' or 'Mapa'
 */
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
};

/**
 * Language Provider Component
 */
export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize language on mount
    useEffect(() => {
        // 1. Check localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
            setLanguageState(stored);
            setIsInitialized(true);
            return;
        }

        // 2. Try to detect from browser
        const detected = detectLanguage();
        if (detected) {
            setLanguageState(detected);
            localStorage.setItem(STORAGE_KEY, detected);
            setIsInitialized(true);
            return;
        }

        // 3. Show picker if detection failed
        setShowPicker(true);
        setIsInitialized(true);
    }, []);

    // Set language and persist
    const setLanguage = useCallback((code) => {
        if (SUPPORTED_LANGUAGES.includes(code)) {
            setLanguageState(code);
            localStorage.setItem(STORAGE_KEY, code);
            setShowPicker(false);
        }
    }, []);

    // Translation function
    const t = useCallback((key, params = {}) => {
        const currentLang = language || DEFAULT_LANGUAGE;
        const translations = languages[currentLang];

        let value = getNestedValue(translations, key);

        // Fallback to default language if not found
        if (value === null && currentLang !== DEFAULT_LANGUAGE) {
            value = getNestedValue(languages[DEFAULT_LANGUAGE], key);
        }

        // Return key if translation not found
        if (value === null) {
            console.warn(`Translation missing: ${key}`);
            return key;
        }

        // Replace parameters (e.g., {n} with actual value)
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            Object.entries(params).forEach(([param, val]) => {
                value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), val);
            });
        }

        return value;
    }, [language]);

    const value = {
        language: language || DEFAULT_LANGUAGE,
        setLanguage,
        t,
        showPicker,
        setShowPicker,
        availableLanguages: getAvailableLanguages(),
        isInitialized
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

/**
 * Hook to use language context
 */
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
