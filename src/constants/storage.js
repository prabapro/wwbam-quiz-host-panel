// src/constants/storage.js

/**
 * Storage Constants
 * Centralized localStorage and session storage keys
 *
 * NOTE: Question sets are now stored in Firebase, not localStorage
 */

import { STORAGE_PREFIX } from './config';

// ============================================================================
// LOCALSTORAGE KEYS
// ============================================================================

/**
 * Settings storage key
 */
export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

/**
 * Auth storage key
 */
export const AUTH_KEY = `${STORAGE_PREFIX}auth`;

/**
 * Teams storage key (for Zustand persist)
 */
export const TEAMS_KEY = `${STORAGE_PREFIX}teams`;

/**
 * Game state storage key (for Zustand persist)
 */
export const GAME_KEY = `${STORAGE_PREFIX}game`;

/**
 * Prizes storage key (for Zustand persist)
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
export const CURRENT_STORAGE_VERSION = 2; // Incremented for Firebase migration

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
 * Estimated localStorage limit in bytes (5MB for most browsers)
 */
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

/**
 * Warning threshold (80% of limit)
 */
export const STORAGE_WARNING_THRESHOLD = STORAGE_LIMIT_BYTES * 0.8;

// ============================================================================
// STORAGE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get storage usage information
 * @returns {Object|null} Storage usage details or null if not supported
 */
export const getStorageUsage = () => {
  try {
    let totalSize = 0;

    // Calculate total localStorage size
    for (let key in localStorage) {
      // eslint-disable-next-line no-prototype-builtins
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // Convert to bytes (each char = 2 bytes in UTF-16)
    const usedBytes = totalSize * 2;
    const percentUsed = (usedBytes / STORAGE_LIMIT_BYTES) * 100;

    return {
      usedBytes,
      totalBytes: STORAGE_LIMIT_BYTES,
      percentUsed: Math.round(percentUsed * 100) / 100,
      isNearLimit: usedBytes > STORAGE_WARNING_THRESHOLD,
      availableBytes: STORAGE_LIMIT_BYTES - usedBytes,
    };
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
    return null;
  }
};

/**
 * Check if localStorage is available
 * @returns {boolean} True if available
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

/**
 * Clear all app-specific localStorage data
 * @returns {boolean} Success status
 */
export const clearAppStorage = () => {
  try {
    const keysToRemove = [];

    // Find all keys with app prefix
    for (let key in localStorage) {
      if (key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove them
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`🗑️ Cleared ${keysToRemove.length} app storage keys`);
    return true;
  } catch (error) {
    console.error('Failed to clear app storage:', error);
    return false;
  }
};
