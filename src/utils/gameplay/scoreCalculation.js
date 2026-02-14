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
  getNextPrize,
  getPreviousPrize,
  formatPrize as formatPrizeAmount,
  isMilestoneQuestion,
} from '@constants/prizeStructure';
import { MILESTONE_QUESTIONS } from '@constants/config';

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
 * Calculate next prize amount from current question
 * @param {number} currentQuestionNumber - Current question (0-20)
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number|null} Next prize amount or null if at max
 *
 * @example
 * getNextPrizeAmount(5, prizeStructure)
 * // Returns: 3000 (prize for question 6)
 *
 * getNextPrizeAmount(20, prizeStructure)
 * // Returns: null (already at max)
 */
export function getNextPrizeAmount(currentQuestionNumber, prizeStructure) {
  // If already at max questions, no next prize
  if (currentQuestionNumber >= prizeStructure.length) {
    return null;
  }

  // Next question number (1-indexed)
  const nextQuestionNumber = currentQuestionNumber + 1;

  return getNextPrize(currentQuestionNumber, prizeStructure);
}

/**
 * Calculate guaranteed prize (last milestone reached)
 * Teams keep prize from last milestone even if eliminated
 *
 * @param {number} questionsAnswered - Number of questions answered correctly
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number} Guaranteed prize amount
 *
 * @example
 * getGuaranteedPrize(3, prizeStructure)
 * // Returns: 0 (no milestone reached yet)
 *
 * getGuaranteedPrize(7, prizeStructure)
 * // Returns: 2500 (milestone at Q5, so prize for Q5)
 *
 * getGuaranteedPrize(12, prizeStructure)
 * // Returns: 5000 (milestone at Q10, so prize for Q10)
 */
export function getGuaranteedPrize(questionsAnswered, prizeStructure) {
  // No questions answered = no prize guaranteed
  if (questionsAnswered === 0) {
    return 0;
  }

  // Find last milestone reached
  let lastMilestone = 0;

  for (const milestone of MILESTONE_QUESTIONS) {
    if (questionsAnswered >= milestone) {
      lastMilestone = milestone;
    } else {
      // Stop checking once we find a milestone not reached
      break;
    }
  }

  // Return prize for last milestone (or 0 if no milestone reached)
  return lastMilestone > 0
    ? getPrizeByQuestionNumber(lastMilestone, prizeStructure)
    : 0;
}

/**
 * Check if question is a milestone
 * Milestones are significant checkpoints (Q5, Q10, Q15, Q20)
 *
 * @param {number} questionNumber - Question number (1-20)
 * @returns {boolean} True if milestone
 *
 * @example
 * isMilestone(5)   // Returns: true
 * isMilestone(7)   // Returns: false
 * isMilestone(10)  // Returns: true
 */
export function isMilestone(questionNumber) {
  return isMilestoneQuestion(questionNumber);
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

/**
 * Calculate prize difference between two question numbers
 * Useful for showing prize increase on correct answer
 *
 * @param {number} fromQuestion - Starting question (1-20)
 * @param {number} toQuestion - Ending question (1-20)
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {number} Prize difference (positive = increase, negative = decrease)
 *
 * @example
 * getPrizeDifference(4, 5, prizeStructure)
 * // Returns: 500 (if Q4=2000 and Q5=2500)
 */
export function getPrizeDifference(fromQuestion, toQuestion, prizeStructure) {
  const fromPrize = getPrizeByQuestionNumber(fromQuestion, prizeStructure);
  const toPrize = getPrizeByQuestionNumber(toQuestion, prizeStructure);

  return toPrize - fromPrize;
}

/**
 * Get all milestone question numbers
 * @returns {number[]} Array of milestone question numbers [5, 10, 15, 20]
 */
export function getMilestones() {
  return [...MILESTONE_QUESTIONS];
}

/**
 * Get next milestone from current question
 * @param {number} currentQuestion - Current question number (0-20)
 * @returns {number|null} Next milestone question number or null if no more milestones
 *
 * @example
 * getNextMilestone(3)   // Returns: 5
 * getNextMilestone(7)   // Returns: 10
 * getNextMilestone(20)  // Returns: null
 */
export function getNextMilestone(currentQuestion) {
  for (const milestone of MILESTONE_QUESTIONS) {
    if (currentQuestion < milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Calculate prize summary for current state
 * @param {number} questionsAnswered - Questions answered correctly
 * @param {Array<number>} prizeStructure - Prize structure array
 * @returns {Object} Prize summary
 * @returns {number} returns.currentPrize - Current accumulated prize
 * @returns {number} returns.guaranteedPrize - Guaranteed prize (last milestone)
 * @returns {number} returns.nextPrize - Next prize amount (or null)
 * @returns {number|null} returns.nextMilestone - Next milestone question (or null)
 * @returns {boolean} returns.isAtMilestone - Whether currently at a milestone
 */
export function getPrizeSummary(questionsAnswered, prizeStructure) {
  const currentPrize = getPrizeForQuestion(questionsAnswered, prizeStructure);
  const guaranteedPrize = getGuaranteedPrize(questionsAnswered, prizeStructure);
  const nextPrize = getNextPrizeAmount(questionsAnswered, prizeStructure);
  const nextMilestone = getNextMilestone(questionsAnswered);
  const isAtMilestone = isMilestone(questionsAnswered);

  return {
    currentPrize,
    guaranteedPrize,
    nextPrize,
    nextMilestone,
    isAtMilestone,
  };
}
