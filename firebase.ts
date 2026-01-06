import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Firebase Configuration - SECURITY NOTES:
 * 
 * Firebase client-side API keys are inherently public and are NOT secrets.
 * Security is enforced through Firebase Security Rules, not by hiding the key.
 * 
 * However, we use environment variables to:
 * 1. Allow different configs for dev/staging/prod
 * 2. Avoid committing project-specific values to source control
 * 3. Enable key rotation without code changes
 * 
 * @see https://firebase.google.com/docs/projects/api-keys
 */

// Validate required Firebase environment variables
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
];

const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);
if (missingVars.length > 0) {
    console.error('════════════════════════════════════════════════════════════');
    console.error('❌ Missing required Firebase environment variables:');
    missingVars.forEach(v => console.error(`   • ${v}`));
    console.error('');
    console.error('Please add these to your .env or .env.local file.');
    console.error('════════════════════════════════════════════════════════════');
    throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
