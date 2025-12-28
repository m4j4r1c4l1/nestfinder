import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 * Falls back to a default key for development (NOT secure for production!)
 */
const getEncryptionKey = () => {
    const key = process.env.NEST_INTEGRITY;
    if (!key) {
        console.warn('⚠️ NEST_INTEGRITY not set! Using insecure default. Set this in production!');
        return 'nestfinder-dev-key-change-me-in-prod';
    }
    return key;
};

/**
 * Derive a key from password using PBKDF2
 */
const deriveKey = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt a string value
 * Returns: salt:iv:authTag:encrypted (all base64)
 */
export const encrypt = (plaintext) => {
    if (!plaintext) return null;

    const password = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    // Combine all parts: salt:iv:authTag:encrypted
    return [
        salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted
    ].join(':');
};

/**
 * Decrypt an encrypted string
 * Input format: salt:iv:authTag:encrypted (all base64)
 */
export const decrypt = (encryptedData) => {
    if (!encryptedData) return null;

    // Check if data is encrypted (contains colons)
    if (!encryptedData.includes(':')) {
        // Not encrypted, return as-is (for backward compatibility)
        return encryptedData;
    }

    try {
        const password = getEncryptionKey();
        const [saltB64, ivB64, authTagB64, encrypted] = encryptedData.split(':');

        if (!saltB64 || !ivB64 || !authTagB64 || !encrypted) {
            // Malformed, return as-is
            return encryptedData;
        }

        const salt = Buffer.from(saltB64, 'base64');
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const key = deriveKey(password, salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        // Return null on decryption failure (wrong key, corrupted data)
        return null;
    }
};

/**
 * Check if a value appears to be encrypted
 */
export const isEncrypted = (value) => {
    if (!value || typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 4;
};

export default { encrypt, decrypt, isEncrypted };
