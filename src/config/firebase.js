// src/config/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import {
  shouldUseEmulator,
  getEmulatorConfig,
  getDatabaseURL,
  logEnvironmentInfo,
} from '@utils/firebaseEnvironment';

/**
 * Firebase Configuration
 * Loads credentials from environment variables for security
 * Automatically connects to emulator in development mode
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: getDatabaseURL(), // Uses environment-specific URL
};

/**
 * Validate Firebase configuration
 * Ensures all required environment variables are present
 */
const validateConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
    'databaseURL',
  ];

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field],
  );

  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    throw new Error(
      `Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`,
    );
  }
};

// Validate configuration before initializing
validateConfig();

/**
 * Initialize Firebase App
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Services
 */
export const auth = getAuth(app);
export const database = getDatabase(app);

/**
 * Connect to Firebase Emulators (Development Only)
 */
if (shouldUseEmulator()) {
  const emulatorConfig = getEmulatorConfig();

  // Connect Auth Emulator
  connectAuthEmulator(
    auth,
    `http://${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`,
    { disableWarnings: true },
  );

  // Connect Database Emulator
  connectDatabaseEmulator(
    database,
    emulatorConfig.database.host,
    emulatorConfig.database.port,
  );

  console.log('🔧 Connected to Firebase Emulators:', {
    auth: `${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`,
    database: `${emulatorConfig.database.host}:${emulatorConfig.database.port}`,
  });
}

/**
 * Initialize Analytics (optional, only in production)
 */
let analytics = null;
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  firebaseConfig.measurementId &&
  !shouldUseEmulator() // Don't init analytics in emulator mode
) {
  analytics = getAnalytics(app);
}

export { analytics };

/**
 * Export Firebase app instance
 */
export default app;

/**
 * Firebase connection status helper
 * Monitors if the app is connected to Firebase
 */
export const isFirebaseConnected = () => {
  try {
    return !!app && !!database;
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
};

/**
 * Environment info (useful for debugging)
 */
export const firebaseEnv = {
  projectId: firebaseConfig.projectId,
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  isProduction: import.meta.env.PROD,
  useEmulator: shouldUseEmulator(),
  databaseURL: firebaseConfig.databaseURL,
};

// Log Firebase initialization status in development
if (import.meta.env.DEV) {
  logEnvironmentInfo();
  console.log('🔥 Firebase initialized:', {
    projectId: firebaseEnv.projectId,
    environment: firebaseEnv.environment,
    useEmulator: firebaseEnv.useEmulator,
    hasAuth: !!auth,
    hasDatabase: !!database,
  });
}
