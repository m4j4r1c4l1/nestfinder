/**
 * Language Index - Add new languages here
 * 
 * To add a new language:
 * 1. Create a new file in /locales (e.g., fr.js for French)
 * 2. Copy the structure from en.js and translate all strings
 * 3. Import and add to the exports below
 */

import en from './locales/en.js';
import es from './locales/es.js';

// All available languages
export const languages = {
    en,
    es,
    // Add new languages here:
    // fr: require('./locales/fr.js').default,
    // de: require('./locales/de.js').default,
    // pt: require('./locales/pt.js').default,
};

// Get language metadata for UI display
export const getAvailableLanguages = () => {
    return Object.entries(languages).map(([code, lang]) => ({
        code,
        name: lang._meta.name,
        nativeName: lang._meta.nativeName,
        flag: lang._meta.flag
    }));
};

// Default/fallback language
export const DEFAULT_LANGUAGE = 'en';

// Supported language codes
export const SUPPORTED_LANGUAGES = Object.keys(languages);

export default languages;
