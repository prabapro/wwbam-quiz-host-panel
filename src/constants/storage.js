// src/constants/storage.js

/**
 * Storage Constants
 * Centralized localStorage and session storage keys
 */

import { STORAGE_PREFIX } from './config';

// ============================================================================
// LOCALSTORAGE KEYS
// ============================================================================

/**
 * Question sets storage key
 */
export const QUESTION_SETS_KEY = `${STORAGE_PREFIX}question-sets`;

/**
 * Metadata storage key
 */
export const METADATA_KEY = `${STORAGE_PREFIX}metadata`;

/**
 * Settings storage key
 */
export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

/**
 * Auth storage key
 */
export const AUTH_KEY = `${STORAGE_PREFIX}auth`;

/**
 * Teams storage key
 */
export const TEAMS_KEY = `${STORAGE_PREFIX}teams`;

/**
 * Game state storage key
 */
export const GAME_KEY = `${STORAGE_PREFIX}game`;

/**
 * Prizes storage key
 */
export const PRIZES_KEY = `${STORAGE_PREFIX}prizes`;

// ============================================================================
// STORAGE VERSION KEYS
// ============================================================================

/**
 * Storage version for migration tracking
 */
export const STORAGE_VERSION_KEY = `${STORAGE_PREFIX}version`;

/**
 * Current storage schema version
 */
export const CURRENT_STORAGE_VERSION = 1;

// ============================================================================
// CACHE KEYS
// ============================================================================

/**
 * Cache key for theme preference
 */
export const THEME_CACHE_KEY = `${STORAGE_PREFIX}theme`;

/**
 * Cache key for last active route
 */
export const LAST_ROUTE_KEY = `${STORAGE_PREFIX}last-route`;

// ============================================================================
// STORAGE LIMITS
// ============================================================================

/**
 * Estimated localStorage limit (5MB for most browsers)
 */
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

/**
 * Warning threshold (80% of limit)
 */
export const STORAGE_WARNING_THRESHOLD = STORAGE_LIMIT_BYTES * 0.8;

/**
 * Critical threshold (90% of limit)
 */
export const STORAGE_CRITICAL_THRESHOLD = STORAGE_LIMIT_BYTES * 0.9;

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Get all storage keys used by the app
 * @returns {string[]} Array of storage keys
 */
export const getAllStorageKeys = () => {
  return [
    QUESTION_SETS_KEY,
    METADATA_KEY,
    SETTINGS_KEY,
    AUTH_KEY,
    TEAMS_KEY,
    GAME_KEY,
    PRIZES_KEY,
    STORAGE_VERSION_KEY,
    THEME_CACHE_KEY,
    LAST_ROUTE_KEY,
  ];
};

/**
 * Check if a key belongs to this app
 * @param {string} key - Storage key to check
 * @returns {boolean} True if app key
 */
export const isAppStorageKey = (key) => {
  return key.startsWith(STORAGE_PREFIX);
};

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
export const getStorageUsage = () => {
  try {
    let totalUsed = 0;
    let appUsed = 0;

    // Calculate total and app-specific usage
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const itemSize = localStorage[key].length + key.length;
        totalUsed += itemSize;

        if (isAppStorageKey(key)) {
          appUsed += itemSize;
        }
      }
    }

    const percentUsed = ((totalUsed / STORAGE_LIMIT_BYTES) * 100).toFixed(2);
    const percentAppUsed = ((appUsed / STORAGE_LIMIT_BYTES) * 100).toFixed(2);
    const available = STORAGE_LIMIT_BYTES - totalUsed;

    return {
      totalUsed,
      appUsed,
      estimatedLimit: STORAGE_LIMIT_BYTES,
      available,
      percentUsed: parseFloat(percentUsed),
      percentAppUsed: parseFloat(percentAppUsed),
      isNearLimit: totalUsed >= STORAGE_WARNING_THRESHOLD,
      isCritical: totalUsed >= STORAGE_CRITICAL_THRESHOLD,
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
};

/**
 * Clear all app storage keys
 * @returns {Object} Result with success status
 */
export const clearAppStorage = () => {
  try {
    const keys = getAllStorageKeys();

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log('✅ All app storage cleared');

    return {
      success: true,
      clearedKeys: keys.length,
    };
  } catch (error) {
    console.error('Failed to clear app storage:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Export app storage data
 * @returns {Object} Exported data
 */
export const exportAppStorage = () => {
  try {
    const data = {};
    const keys = getAllStorageKeys();

    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });

    return {
      success: true,
      data,
      exportedAt: Date.now(),
      version: CURRENT_STORAGE_VERSION,
    };
  } catch (error) {
    console.error('Failed to export storage:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Import app storage data
 * @param {Object} importData - Data to import
 * @returns {Object} Result with success status
 */
export const importAppStorage = (importData) => {
  try {
    if (!importData || !importData.data) {
      throw new Error('Invalid import data');
    }

    Object.keys(importData.data).forEach((key) => {
      if (isAppStorageKey(key)) {
        const value =
          typeof importData.data[key] === 'string'
            ? importData.data[key]
            : JSON.stringify(importData.data[key]);

        localStorage.setItem(key, value);
      }
    });

    console.log('✅ Storage data imported');

    return {
      success: true,
      importedKeys: Object.keys(importData.data).length,
    };
  } catch (error) {
    console.error('Failed to import storage:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
