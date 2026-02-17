// src/utils/gameplay/lifelineLogic.js

import { FIFTY_FIFTY_REMOVE_COUNT } from '@constants/config';

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
 * Format timer display (MM:SS)
 * @param {number} seconds - Remaining seconds
 * @returns {string} Formatted time (e.g., "03:00", "00:45")
 *
 * @example
 * formatTimerDisplay(180)  // Returns: "03:00"
 * formatTimerDisplay(45)   // Returns: "00:45"
 */
export function formatTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
