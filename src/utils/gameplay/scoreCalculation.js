// src/utils/gameplay/scoreCalculation.js

/**
 * Score Calculation Utilities
 *
 * Purpose: Calculate prize money based on question progress and prize structure
 *
 * Core Logic:
 * - Get prize for specific question number (1-20)
 * - Calculate next prize amount
 * - Determine milestone status
 * - Format prize amounts for display
 * - Calculate guaranteed prize (last milestone reached)
 *
 * Used By:
 * - Answer validation flow (calculate new prize on correct answer)
 * - Team status display
 * - Prize ladder visualization
 *
 * Example Usage:
 * const prize = getPrizeForQuestion(5, prizeStructure);
 * // Returns: 2500 (Rs.2,500 for question 5)
 *
 * const formatted = formatPrize(2500);
 * // Returns: "Rs.2,500"
 */

import {
  getPrizeByQuestionNumber,
  formatPrize as formatPrizeAmount,
} from '@constants/prizeStructure';

/**
 * Get prize amount for a specific question number
 * @param {number} questionNumber - Question number (1-20)
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number} Prize amount in Rs.
 *
 * @example
 * getPrizeForQuestion(5, [500, 1000, 1500, 2000, 2500, ...])
 * // Returns: 2500
 *
 * getPrizeForQuestion(0, prizeStructure)
 * // Returns: 0 (no questions answered yet)
 */
export function getPrizeForQuestion(questionNumber, prizeStructure) {
  // Question number 0 = no questions answered yet
  if (questionNumber === 0) {
    return 0;
  }

  return getPrizeByQuestionNumber(questionNumber, prizeStructure);
}

/**
 * Format prize amount for display
 * Re-exported from prizeStructure for convenience
 *
 * @param {number} amount - Prize amount
 * @returns {string} Formatted prize (e.g., "Rs.2,500")
 *
 * @example
 * formatPrize(2500)
 * // Returns: "Rs.2,500"
 */
export function formatPrize(amount) {
  return formatPrizeAmount(amount);
}
