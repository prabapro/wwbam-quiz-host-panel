// src/constants/prizeStructure.js

/**
 * Prize Structure Constants
 * Defines prize values for each question level and helper functions
 */

/**
 * Default prize structure (20 levels)
 * Index 0 = Question 1, Index 19 = Question 20
 * Values in Sri Lankan Rupees (Rs.)
 */
export const DEFAULT_PRIZE_STRUCTURE = [
  500, // Question 1
  1000, // Question 2
  1500, // Question 3
  2000, // Question 4
  2500, // Question 5 - First Milestone
  3000, // Question 6
  3500, // Question 7
  4000, // Question 8
  4500, // Question 9
  5000, // Question 10 - Second Milestone
  5500, // Question 11
  6000, // Question 12
  6500, // Question 13
  7000, // Question 14
  7500, // Question 15 - Third Milestone
  8000, // Question 16
  8500, // Question 17
  9000, // Question 18
  9500, // Question 19
  10000, // Question 20 - Maximum Prize
];

/**
 * Milestone question numbers (1-indexed)
 * These are significant checkpoints in the game
 */
export const MILESTONE_QUESTIONS = [5, 10, 15, 20];

/**
 * Get prize amount for a specific question number
 * @param {number} questionNumber - Question number (1-20)
 * @param {number[]} [prizeStructure=DEFAULT_PRIZE_STRUCTURE] - Custom prize structure (optional)
 * @returns {number} Prize amount in Rs.
 */
export const getPrizeByQuestionNumber = (
  questionNumber,
  prizeStructure = DEFAULT_PRIZE_STRUCTURE,
) => {
  if (questionNumber < 1 || questionNumber > prizeStructure.length) {
    console.warn(`Invalid question number: ${questionNumber}`);
    return 0;
  }
  // Convert 1-indexed question number to 0-indexed array
  return prizeStructure[questionNumber - 1];
};

/**
 * Get prize amount by array index
 * @param {number} index - Zero-based index (0-19)
 * @param {number[]} [prizeStructure=DEFAULT_PRIZE_STRUCTURE] - Custom prize structure (optional)
 * @returns {number} Prize amount in Rs.
 */
export const getPrizeByIndex = (
  index,
  prizeStructure = DEFAULT_PRIZE_STRUCTURE,
) => {
  if (index < 0 || index >= prizeStructure.length) {
    console.warn(`Invalid prize index: ${index}`);
    return 0;
  }
  return prizeStructure[index];
};

/**
 * Check if a question number is a milestone
 * @param {number} questionNumber - Question number (1-20)
 * @returns {boolean} True if question is a milestone
 */
export const isMilestoneQuestion = (questionNumber) => {
  return MILESTONE_QUESTIONS.includes(questionNumber);
};

/**
 * Format prize amount for display
 * @param {number} amount - Prize amount
 * @param {string} [currency='Rs.'] - Currency symbol
 * @returns {string} Formatted prize string (e.g., "Rs.1,000,000")
 */
export const formatPrize = (amount, currency = 'Rs.') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency}0`;
  }
  return `${currency}${amount.toLocaleString('en-US')}`;
};

/**
 * Get total prize distribution (sum of all prizes)
 * @param {number[]} [prizeStructure=DEFAULT_PRIZE_STRUCTURE] - Prize structure
 * @returns {number} Total prize pool
 */
export const getTotalPrizePool = (prizeStructure = DEFAULT_PRIZE_STRUCTURE) => {
  return prizeStructure.reduce((sum, prize) => sum + prize, 0);
};

/**
 * Validate prize structure
 * Ensures prize structure is valid (array of positive numbers)
 * @param {number[]} prizeStructure - Prize structure to validate
 * @returns {boolean} True if valid
 */
export const isValidPrizeStructure = (prizeStructure) => {
  if (!Array.isArray(prizeStructure)) {
    return false;
  }

  if (prizeStructure.length === 0) {
    return false;
  }

  return prizeStructure.every(
    (prize) => typeof prize === 'number' && prize > 0,
  );
};

/**
 * Get prize range (min and max)
 * @param {number[]} [prizeStructure=DEFAULT_PRIZE_STRUCTURE] - Prize structure
 * @returns {Object} Object with min and max prize values
 */
export const getPrizeRange = (prizeStructure = DEFAULT_PRIZE_STRUCTURE) => {
  return {
    min: Math.min(...prizeStructure),
    max: Math.max(...prizeStructure),
  };
};

/**
 * Get next prize amount from current question
 * @param {number} currentQuestionNumber - Current question number (1-20)
 * @param {number[]} [prizeStructure=DEFAULT_PRIZE_STRUCTURE] - Prize structure
 * @returns {number|null} Next prize amount or null if at max
 */
export const getNextPrize = (
  currentQuestionNumber,
  prizeStructure = DEFAULT_PRIZE_STRUCTURE,
) => {
  if (currentQuestionNumber >= prizeStructure.length) {
    return null; // Already at max
  }
  return prizeStructure[currentQuestionNumber]; // Next question's prize (0-indexed)
};

/**
 * Get previous prize amount from current question
 * @param {number} currentQuestionNumber - Current question number (1-20)
 * @param {number[]} [prizeStructure=DEFAULT_PRIZE_STRUCTURE] - Prize structure
 * @returns {number|null} Previous prize amount or null if at start
 */
export const getPreviousPrize = (
  currentQuestionNumber,
  prizeStructure = DEFAULT_PRIZE_STRUCTURE,
) => {
  if (currentQuestionNumber <= 1) {
    return null; // At start, no previous prize
  }
  return prizeStructure[currentQuestionNumber - 2]; // Previous question's prize (0-indexed)
};

/**
 * Number of questions in default structure
 */
export const TOTAL_QUESTIONS = DEFAULT_PRIZE_STRUCTURE.length;

/**
 * Maximum possible prize
 */
export const MAX_PRIZE = Math.max(...DEFAULT_PRIZE_STRUCTURE);

/**
 * Minimum possible prize
 */
export const MIN_PRIZE = Math.min(...DEFAULT_PRIZE_STRUCTURE);
