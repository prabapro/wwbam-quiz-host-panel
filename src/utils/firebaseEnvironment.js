// src/utils/firebaseEnvironment.js

/**
 * Firebase Environment Utilities
 * Handles environment detection and emulator connection logic
 * Works with Infisical for environment-specific configuration
 */

/**
 * Environment types
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

/**
 * Get current environment
 * @returns {string} Current environment (development|staging|production)
 */
export const getCurrentEnvironment = () => {
  return import.meta.env.VITE_ENVIRONMENT || ENVIRONMENTS.DEVELOPMENT;
};

/**
 * Check if running in development mode
 * @returns {boolean} True if development
 */
export const isDevelopment = () => {
  return getCurrentEnvironment() === ENVIRONMENTS.DEVELOPMENT;
};

/**
 * Check if running in staging mode
 * @returns {boolean} True if staging
 */
export const isStaging = () => {
  return getCurrentEnvironment() === ENVIRONMENTS.STAGING;
};

/**
 * Check if running in production mode
 * @returns {boolean} True if production
 */
export const isProduction = () => {
  return getCurrentEnvironment() === ENVIRONMENTS.PRODUCTION;
};

/**
 * Check if should use Firebase emulator
 * Only use emulator in development environment
 * @returns {boolean} True if should connect to emulator
 */
export const shouldUseEmulator = () => {
  return isDevelopment();
};

/**
 * Get emulator configuration
 * @returns {Object} Emulator host and ports
 */
export const getEmulatorConfig = () => {
  return {
    auth: {
      host: import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_HOST || 'localhost',
      port: parseInt(
        import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_PORT || '9099',
      ),
    },
    database: {
      host: import.meta.env.VITE_FIREBASE_EMULATOR_DATABASE_HOST || 'localhost',
      port: parseInt(
        import.meta.env.VITE_FIREBASE_EMULATOR_DATABASE_PORT || '9000',
      ),
    },
  };
};

/**
 * Get database URL for current environment
 * Infisical handles loading the correct URL based on environment
 * @returns {string} Database URL
 */
export const getDatabaseURL = () => {
  return import.meta.env.VITE_FIREBASE_DATABASE_URL;
};

/**
 * Get environment display info
 * @returns {Object} Environment information
 */
export const getEnvironmentInfo = () => {
  const env = getCurrentEnvironment();
  const useEmulator = shouldUseEmulator();

  return {
    environment: env,
    useEmulator,
    databaseURL: useEmulator ? 'Firebase Emulator' : getDatabaseURL(),
    isDev: isDevelopment(),
    isStaging: isStaging(),
    isProd: isProduction(),
  };
};

/**
 * Log environment information (for debugging)
 */
export const logEnvironmentInfo = () => {
  if (import.meta.env.DEV) {
    const info = getEnvironmentInfo();
    console.log('🌍 Firebase Environment:', {
      environment: info.environment,
      useEmulator: info.useEmulator,
      databaseURL: info.databaseURL,
    });
  }
};
