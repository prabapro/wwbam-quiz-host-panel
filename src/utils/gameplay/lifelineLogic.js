// src/utils/gameplay/lifelineLogic.js

/**
 * Lifeline Logic Utilities
 *
 * Purpose: Pure functions for lifeline application logic
 *
 * Lifeline Types:
 * 1. Phone-a-Friend: Timer-based lifeline (3 minutes)
 * 2. 50/50: Filter out 2 incorrect answers
 *
 * Core Logic:
 * - 50/50: Randomly select 2 incorrect options to remove
 * - Phone-a-Friend: Timer management utilities
 * - Lifeline availability checking
 *
 * Used By:
 * - LifelinePanel component
 * - Question display filtering (after 50/50)
 * - Game state management
 *
 * Example Usage:
 * const result = applyFiftyFifty(['A', 'B', 'C', 'D'], 'B');
 * // Returns: { removedOptions: ['A', 'D'], remainingOptions: ['B', 'C'] }
 */

import {
  FIFTY_FIFTY_REMOVE_COUNT,
  PHONE_A_FRIEND_DURATION_MINUTES,
} from '@constants/config';

/**
 * Apply 50/50 lifeline logic
 * Remove 2 incorrect answers randomly
 *
 * @param {Array<string>} allOptions - All answer options ['A', 'B', 'C', 'D']
 * @param {string} correctAnswer - The correct answer
 * @returns {Object} Result with removed and remaining options
 * @returns {Array<string>} returns.removedOptions - Options that were removed
 * @returns {Array<string>} returns.remainingOptions - Options still visible
 *
 * @example
 * applyFiftyFifty(['A', 'B', 'C', 'D'], 'B')
 * // Possible return: {
 * //   removedOptions: ['A', 'D'],
 * //   remainingOptions: ['B', 'C']
 * // }
 */
export function applyFiftyFifty(allOptions, correctAnswer) {
  // TODO: Implement 50/50 filtering logic
  console.log('🚧 applyFiftyFifty not implemented:', allOptions, correctAnswer);

  // Get incorrect options
  const incorrectOptions = allOptions.filter(
    (option) => option !== correctAnswer,
  );

  if (incorrectOptions.length < FIFTY_FIFTY_REMOVE_COUNT) {
    throw new Error('Not enough incorrect options to remove');
  }

  // Randomly select 2 incorrect options to remove
  const shuffled = [...incorrectOptions].sort(() => Math.random() - 0.5);
  const toRemove = shuffled.slice(0, FIFTY_FIFTY_REMOVE_COUNT);

  // Keep correct answer + 1 random incorrect
  const remainingOptions = allOptions.filter(
    (option) => !toRemove.includes(option),
  );

  return {
    removedOptions: toRemove,
    remainingOptions: remainingOptions,
  };
}

/**
 * Get Phone-a-Friend duration in seconds
 * @returns {number} Duration in seconds
 */
export function getPhoneAFriendDuration() {
  return PHONE_A_FRIEND_DURATION_MINUTES * 60;
}

/**
 * Format timer display (MM:SS)
 * @param {number} seconds - Remaining seconds
 * @returns {string} Formatted time (e.g., "03:00", "00:45")
 *
 * @example
 * formatTimerDisplay(180)  // Returns: "03:00"
 * formatTimerDisplay(45)   // Returns: "00:45"
 */
export function formatTimerDisplay(seconds) {
  // TODO: Implement timer formatting
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if lifeline is available for team
 * @param {Object} team - Team object with lifelines property
 * @param {string} lifelineType - Lifeline type ('phone-a-friend' or 'fifty-fifty')
 * @returns {boolean} True if lifeline is available
 *
 * @example
 * isLifelineAvailable(team, 'phone-a-friend')
 * // Returns: true (if team hasn't used it yet)
 */
export function isLifelineAvailable(team, lifelineType) {
  // TODO: Implement lifeline availability check
  if (!team || !team.lifelines) {
    return false;
  }

  // Convert kebab-case to camelCase for JavaScript
  const camelCaseType = lifelineType.replace(/-([a-z])/g, (g) =>
    g[1].toUpperCase(),
  );

  return team.lifelines[camelCaseType] === true;
}

/**
 * Get all available lifelines for a team
 * @param {Object} team - Team object with lifelines property
 * @returns {Array<string>} Array of available lifeline types
 *
 * @example
 * getAvailableLifelines(team)
 * // Returns: ['phone-a-friend', 'fifty-fifty']
 */
export function getAvailableLifelines(team) {
  // TODO: Implement available lifelines getter
  if (!team || !team.lifelines) {
    return [];
  }

  return Object.entries(team.lifelines)
    .filter(([, available]) => available === true)
    .map(([type]) => type);
}

/**
 * Calculate remaining lifeline count for team
 * @param {Object} team - Team object with lifelines property
 * @returns {number} Number of remaining lifelines
 */
export function getRemainingLifelineCount(team) {
  return getAvailableLifelines(team).length;
}
