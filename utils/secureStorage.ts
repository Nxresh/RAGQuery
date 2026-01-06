/**
 * Secure Storage Utility
 * Enterprise-grade encrypted localStorage using Web Crypto API
 * 
 * Features:
 * - AES-256-GCM encryption
 * - Per-browser key derivation
 * - Automatic encrypt/decrypt
 */

const SALT = 'ARES_SECURE_STORAGE_v1';
const ALGORITHM = 'AES-GCM';

// Generate a consistent key from browser fingerprint
async function deriveKey(): Promise<CryptoKey> {
    // Create a browser-specific seed (stays same per browser)
    const browserSeed = [
        navigator.userAgent,
        navigator.language,
        screen.width.toString(),
        screen.height.toString(),
        new Date().getTimezoneOffset().toString()
    ].join('|');

    // Convert seed to key material
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(browserSeed),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive AES key using PBKDF2
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt data
async function encrypt(data: string): Promise<string> {
    try {
        const key = await deriveKey();
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

        const encrypted = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            encoder.encode(data)
        );

        // Combine IV + encrypted data and encode as base64
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('[SecureStorage] Encryption failed:', error);
        throw new Error('Encryption failed');
    }
}

// Decrypt data
async function decrypt(encryptedData: string): Promise<string> {
    try {
        const key = await deriveKey();

        // Decode base64 and extract IV + data
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('[SecureStorage] Decryption failed:', error);
        throw new Error('Decryption failed');
    }
}

// Secure storage interface
export const secureStorage = {
    async setItem(key: string, value: unknown): Promise<void> {
        try {
            const jsonValue = JSON.stringify(value);
            const encrypted = await encrypt(jsonValue);
            localStorage.setItem(`secure_${key}`, encrypted);
        } catch (error) {
            console.error('[SecureStorage] Failed to save:', error);
            // Fallback: don't save if encryption fails
        }
    },

    async getItem<T>(key: string): Promise<T | null> {
        try {
            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted) return null;

            const decrypted = await decrypt(encrypted);
            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('[SecureStorage] Failed to read:', error);
            // If decryption fails, clear corrupted data
            localStorage.removeItem(`secure_${key}`);
            return null;
        }
    },

    removeItem(key: string): void {
        localStorage.removeItem(`secure_${key}`);
    },

    // Clear all secure items
    clear(): void {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('secure_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
};

// Input sanitization utilities
export const sanitize = {
    // Remove potentially dangerous characters from text input
    text(input: string): string {
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    },

    // Sanitize URL input
    url(input: string): string {
        try {
            const url = new URL(input);
            // Only allow http/https protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid protocol');
            }
            return url.toString();
        } catch {
            return '';
        }
    },

    // Sanitize email
    email(input: string): string {
        const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
        return emailRegex.test(input) ? input.trim() : '';
    },

    // Escape HTML entities for safe display
    html(input: string): string {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
};

// Mask sensitive data for display
export function maskSensitive(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) {
        return '••••••••';
    }
    const visible = value.slice(-visibleChars);
    return '••••••••' + visible;
}

export default secureStorage;
