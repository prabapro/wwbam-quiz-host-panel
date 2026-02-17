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
 * Reflects the actual runtime config including env var overrides
 * @returns {Object} Current app configuration
 */
export const getCurrentAppConfig = () => {
  return {
    ...DEFAULT_CONFIG,
    questionsPerTeam: QUESTIONS_PER_SET, // May be overridden by env var
  };
};

/**
 * Compare two config objects for differences
 * @param {Object} firebaseConfig - Config from Firebase
 * @param {Object} appConfig - Current app config
 * @returns {{ isDifferent: boolean, differences: Object }}
 */
export const compareConfigs = (firebaseConfig, appConfig) => {
  const differences = {};
  let isDifferent = false;

  const primitiveKeys = [
    'maxTeams',
    'questionsPerTeam',
    'timerEnabled',
    'timerDuration',
  ];

  primitiveKeys.forEach((key) => {
    if (firebaseConfig[key] !== appConfig[key]) {
      differences[key] = { firebase: firebaseConfig[key], app: appConfig[key] };
      isDifferent = true;
    }
  });

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

  return { isDifferent, differences };
};

/**
 * Sync Firebase config with current application config
 * Only updates if there are differences. Handles unauthenticated state gracefully.
 * @param {{ silent?: boolean }} options
 * @returns {Promise<Object>} Result with success flag and details
 */
export const syncConfigWithFirebase = async (options = {}) => {
  const { silent = false } = options;

  try {
    if (!isAuthenticated()) {
      if (!silent)
        console.log('⏸️  Config sync skipped: User not authenticated');
      return { success: true, action: 'skipped', reason: 'not-authenticated' };
    }

    if (!silent) console.log('🔄 Checking config sync with Firebase...');

    const currentAppConfig = getCurrentAppConfig();
    const firebaseConfig = await getConfig();

    if (!firebaseConfig) {
      if (!silent)
        console.log(
          '📝 No config in Firebase, initializing with current app config...',
        );
      await updateConfig(currentAppConfig);
      return { success: true, action: 'initialized', config: currentAppConfig };
    }

    const comparison = compareConfigs(firebaseConfig, currentAppConfig);

    if (!comparison.isDifferent) {
      if (!silent) console.log('✅ Firebase config is already in sync');
      return { success: true, action: 'no-change', config: firebaseConfig };
    }

    if (!silent) {
      console.log('⚠️  Config differences detected:', comparison.differences);
      console.log('📝 Updating Firebase config to match app config...');
    }

    await updateConfig(currentAppConfig);

    if (!silent) console.log('✅ Firebase config updated successfully');

    return {
      success: true,
      action: 'updated',
      differences: comparison.differences,
      config: currentAppConfig,
    };
  } catch (error) {
    const isPermissionError =
      error.message?.includes('Permission denied') ||
      error.code === 'PERMISSION_DENIED';

    if (isPermissionError) {
      if (!silent)
        console.log(
          '⏸️  Config sync skipped: Permission denied (user not authenticated)',
        );
      return { success: true, action: 'skipped', reason: 'permission-denied' };
    }

    console.error('❌ Failed to sync config with Firebase:', error);
    return { success: false, action: 'error', error: error.message };
  }
};
