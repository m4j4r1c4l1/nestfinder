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
import fr from './locales/fr.js';
import pt from './locales/pt.js';
import val from './locales/val.js';
import it from './locales/it.js';
import de from './locales/de.js';
import nl from './locales/nl.js';
import ru from './locales/ru.js';
import ar from './locales/ar.js';
import zh from './locales/zh.js';

// All available languages
export const languages = {
    en,
    es,
    fr,
    pt,
    val,
    it,
    de,
    nl,
    ru,
    ar,
    zh
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
