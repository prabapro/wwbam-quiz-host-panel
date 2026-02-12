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
  getNextPrize,
  getPreviousPrize,
  formatPrize,
  isMilestoneQuestion,
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
 */
export function getPrizeForQuestion(questionNumber, prizeStructure) {
  // TODO: Implement using prizeStructure constants
  return getPrizeByQuestionNumber(questionNumber, prizeStructure);
}

/**
 * Calculate next prize amount from current question
 * @param {number} currentQuestionNumber - Current question (1-20)
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number|null} Next prize amount or null if at max
 *
 * @example
 * getNextPrizeAmount(5, prizeStructure)
 * // Returns: 3000 (prize for question 6)
 */
export function getNextPrizeAmount(currentQuestionNumber, prizeStructure) {
  // TODO: Implement using prizeStructure constants
  return getNextPrize(currentQuestionNumber, prizeStructure);
}

/**
 * Calculate guaranteed prize (last milestone reached)
 * @param {number} questionsAnswered - Number of questions answered correctly
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number} Guaranteed prize amount
 *
 * @example
 * getGuaranteedPrize(7, prizeStructure)
 * // Returns: 2500 (milestone at Q5)
 */
export function getGuaranteedPrize(questionsAnswered, prizeStructure) {
  // TODO: Implement milestone-based guaranteed prize
  console.log(
    '🚧 getGuaranteedPrize not implemented:',
    questionsAnswered,
    prizeStructure,
  );

  // Find last milestone reached
  const milestones = [5, 10, 15, 20]; // From config
  let lastMilestone = 0;

  for (const milestone of milestones) {
    if (questionsAnswered >= milestone) {
      lastMilestone = milestone;
    }
  }

  return lastMilestone > 0
    ? getPrizeByQuestionNumber(lastMilestone, prizeStructure)
    : 0;
}

/**
 * Check if question is a milestone
 * @param {number} questionNumber - Question number (1-20)
 * @returns {boolean} True if milestone
 *
 * @example
 * isMilestone(5)  // Returns: true
 * isMilestone(7)  // Returns: false
 */
export function isMilestone(questionNumber) {
  // TODO: Use constant from config
  return isMilestoneQuestion(questionNumber);
}

/**
 * Format prize amount for display
 * Re-exported from prizeStructure for convenience
 */
export { formatPrize };

/**
 * Calculate prize difference between two question numbers
 * @param {number} fromQuestion - Starting question
 * @param {number} toQuestion - Ending question
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number} Prize difference
 */
export function getPrizeDifference(fromQuestion, toQuestion, prizeStructure) {
  // TODO: Implement prize difference calculation
  const fromPrize = getPrizeByQuestionNumber(fromQuestion, prizeStructure);
  const toPrize = getPrizeByQuestionNumber(toQuestion, prizeStructure);
  return toPrize - fromPrize;
}
