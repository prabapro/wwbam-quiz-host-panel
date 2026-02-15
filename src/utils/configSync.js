// src/utils/configSync.js

/**
 * Configuration Synchronization Utility
 * Ensures Firebase config node stays in sync with application configuration
 * Handles environment variable overrides and keeps single source of truth
 */

import { DEFAULT_CONFIG } from '@constants/defaultDatabase';
import { QUESTIONS_PER_SET } from '@constants/config';
import { getConfig, updateConfig } from '@services/database.service';
import { auth } from '@config/firebase';

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Get current application configuration
 * This reflects the actual runtime config including env var overrides
 * @returns {Object} Current app configuration
 */
export const getCurrentAppConfig = () => {
  return {
    ...DEFAULT_CONFIG,
    questionsPerTeam: QUESTIONS_PER_SET, // Override with current value (may be from env)
  };
};

/**
 * Compare two config objects for differences
 * @param {Object} firebaseConfig - Config from Firebase
 * @param {Object} appConfig - Current app config
 * @returns {Object} Object with differences { isDifferent, differences }
 */
export const compareConfigs = (firebaseConfig, appConfig) => {
  const differences = {};
  let isDifferent = false;

  // Compare top-level primitive values
  if (firebaseConfig.maxTeams !== appConfig.maxTeams) {
    differences.maxTeams = {
      firebase: firebaseConfig.maxTeams,
      app: appConfig.maxTeams,
    };
    isDifferent = true;
  }

  if (firebaseConfig.questionsPerTeam !== appConfig.questionsPerTeam) {
    differences.questionsPerTeam = {
      firebase: firebaseConfig.questionsPerTeam,
      app: appConfig.questionsPerTeam,
    };
    isDifferent = true;
  }

  if (firebaseConfig.timerEnabled !== appConfig.timerEnabled) {
    differences.timerEnabled = {
      firebase: firebaseConfig.timerEnabled,
      app: appConfig.timerEnabled,
    };
    isDifferent = true;
  }

  if (firebaseConfig.timerDuration !== appConfig.timerDuration) {
    differences.timerDuration = {
      firebase: firebaseConfig.timerDuration,
      app: appConfig.timerDuration,
    };
    isDifferent = true;
  }

  // Compare nested objects (deep comparison for lifelinesEnabled and displaySettings)
  const lifelinesMatch =
    JSON.stringify(firebaseConfig.lifelinesEnabled) ===
    JSON.stringify(appConfig.lifelinesEnabled);
  if (!lifelinesMatch) {
    differences.lifelinesEnabled = {
      firebase: firebaseConfig.lifelinesEnabled,
      app: appConfig.lifelinesEnabled,
    };
    isDifferent = true;
  }

  const displayMatch =
    JSON.stringify(firebaseConfig.displaySettings) ===
    JSON.stringify(appConfig.displaySettings);
  if (!displayMatch) {
    differences.displaySettings = {
      firebase: firebaseConfig.displaySettings,
      app: appConfig.displaySettings,
    };
    isDifferent = true;
  }

  return {
    isDifferent,
    differences,
  };
};

/**
 * Sync Firebase config with current application config
 * Only updates if there are differences
 * Handles unauthenticated state gracefully
 * @param {Object} options - Sync options
 * @param {boolean} options.silent - If true, suppress console logs (default: false)
 * @returns {Promise<Object>} Result with success flag and details
 */
export const syncConfigWithFirebase = async (options = {}) => {
  const { silent = false } = options;

  try {
    // Check authentication first
    if (!isAuthenticated()) {
      if (!silent) {
        console.log('⏸️  Config sync skipped: User not authenticated');
      }
      return {
        success: true,
        action: 'skipped',
        reason: 'not-authenticated',
      };
    }

    if (!silent) {
      console.log('🔄 Checking config sync with Firebase...');
    }

    // Get current app config (includes env var overrides)
    const currentAppConfig = getCurrentAppConfig();

    // Get Firebase config
    const firebaseConfig = await getConfig();

    // If no config in Firebase, initialize it
    if (!firebaseConfig) {
      if (!silent) {
        console.log(
          '📝 No config in Firebase, initializing with current app config...',
        );
      }
      await updateConfig(currentAppConfig);

      return {
        success: true,
        action: 'initialized',
        config: currentAppConfig,
      };
    }

    // Compare configs
    const comparison = compareConfigs(firebaseConfig, currentAppConfig);

    if (!comparison.isDifferent) {
      if (!silent) {
        console.log('✅ Firebase config is already in sync');
      }
      return {
        success: true,
        action: 'no-change',
        config: firebaseConfig,
      };
    }

    // Configs differ - update Firebase
    if (!silent) {
      console.log('⚠️  Config differences detected:', comparison.differences);
      console.log('📝 Updating Firebase config to match app config...');
    }

    await updateConfig(currentAppConfig);

    if (!silent) {
      console.log('✅ Firebase config updated successfully');
    }

    return {
      success: true,
      action: 'updated',
      differences: comparison.differences,
      config: currentAppConfig,
    };
  } catch (error) {
    // Check if it's a permission error
    const isPermissionError =
      error.message?.includes('Permission denied') ||
      error.code === 'PERMISSION_DENIED';

    if (isPermissionError) {
      if (!silent) {
        console.log(
          '⏸️  Config sync skipped: Permission denied (user not authenticated)',
        );
      }
      return {
        success: true,
        action: 'skipped',
        reason: 'permission-denied',
      };
    }

    // Other errors
    console.error('❌ Failed to sync config with Firebase:', error);
    return {
      success: false,
      action: 'error',
      error: error.message,
    };
  }
};

/**
 * Validate config structure
 * Ensures all required fields are present
 * @param {Object} config - Config object to validate
 * @returns {Object} Validation result
 */
export const validateConfigStructure = (config) => {
  const requiredFields = [
    'maxTeams',
    'questionsPerTeam',
    'lifelinesEnabled',
    'displaySettings',
    'timerEnabled',
    'timerDuration',
  ];

  const missingFields = requiredFields.filter((field) => !(field in config));

  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      error: `Missing required config fields: ${missingFields.join(', ')}`,
    };
  }

  // Validate nested structures
  if (!config.lifelinesEnabled || typeof config.lifelinesEnabled !== 'object') {
    return {
      isValid: false,
      error: 'lifelinesEnabled must be an object',
    };
  }

  if (!config.displaySettings || typeof config.displaySettings !== 'object') {
    return {
      isValid: false,
      error: 'displaySettings must be an object',
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Log current config status
 * Useful for debugging
 * Requires authentication
 */
export const logConfigStatus = async () => {
  try {
    if (!isAuthenticated()) {
      console.log('⏸️  Cannot log config status: User not authenticated');
      return;
    }

    const appConfig = getCurrentAppConfig();
    const firebaseConfig = await getConfig();

    console.group('📋 Config Status');
    console.log('App Config:', appConfig);
    console.log('Firebase Config:', firebaseConfig);

    if (firebaseConfig) {
      const comparison = compareConfigs(firebaseConfig, appConfig);
      console.log('In Sync:', !comparison.isDifferent);
      if (comparison.isDifferent) {
        console.log('Differences:', comparison.differences);
      }
    } else {
      console.log('Firebase Config: Not initialized');
    }

    console.groupEnd();
  } catch (error) {
    console.error('Failed to log config status:', error);
  }
};
