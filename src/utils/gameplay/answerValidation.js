// src/utils/gameplay/answerValidation.js

/**
 * Answer Validation Utilities
 *
 * Purpose: Pure functions for validating team answers against correct answers
 *
 * Core Validation Logic:
 * - Compare selected answer with correct answer from localStorage
 * - Normalize answer options (handle case-insensitive, trim whitespace)
 * - Return validation result with metadata
 *
 * Used By:
 * - useAnswerSelection hook
 * - Answer locking flow in gameplay
 *
 * Example Usage:
 * const result = validateAnswer('B', 'B');
 * // Returns: { isCorrect: true, selectedAnswer: 'B', correctAnswer: 'B' }
 *
 * const result2 = validateAnswer('A', 'B');
 * // Returns: { isCorrect: false, selectedAnswer: 'A', correctAnswer: 'B' }
 */

const VALID_OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Normalize answer option to uppercase
 * @param {string} option - Answer option (A/B/C/D)
 * @returns {string|null} Normalized option (uppercase, trimmed) or null if invalid
 *
 * @example
 * normalizeOption('b')     // Returns: 'B'
 * normalizeOption('  A  ') // Returns: 'A'
 * normalizeOption('X')     // Returns: null
 */
export function normalizeOption(option) {
  if (!option || typeof option !== 'string') {
    return null;
  }

  const normalized = option.toString().trim().toUpperCase();

  return VALID_OPTIONS.includes(normalized) ? normalized : null;
}

/**
 * Validate selected answer against correct answer
 * @param {string} selectedAnswer - Team's selected answer (A/B/C/D)
 * @param {string} correctAnswer - Correct answer from question data
 * @returns {Object} Validation result
 * @returns {boolean} returns.isCorrect - Whether answer is correct
 * @returns {string} returns.selectedAnswer - Normalized selected answer
 * @returns {string} returns.correctAnswer - Normalized correct answer
 *
 * @throws {Error} If either answer option is invalid
 *
 * @example
 * validateAnswer('B', 'B')
 * // Returns: { isCorrect: true, selectedAnswer: 'B', correctAnswer: 'B' }
 *
 * validateAnswer('a', 'B')
 * // Returns: { isCorrect: false, selectedAnswer: 'A', correctAnswer: 'B' }
 */
export function validateAnswer(selectedAnswer, correctAnswer) {
  const normalizedSelected = normalizeOption(selectedAnswer);
  const normalizedCorrect = normalizeOption(correctAnswer);

  if (!normalizedSelected) {
    throw new Error(
      `Invalid selected answer: "${selectedAnswer}". Must be A, B, C, or D.`,
    );
  }

  if (!normalizedCorrect) {
    throw new Error(
      `Invalid correct answer: "${correctAnswer}". Must be A, B, C, or D.`,
    );
  }

  const isCorrect = normalizedSelected === normalizedCorrect;

  console.log(
    `${isCorrect ? '✅' : '❌'} Answer validation: ${normalizedSelected} vs ${normalizedCorrect} (${isCorrect ? 'CORRECT' : 'INCORRECT'})`,
  );

  return {
    isCorrect,
    selectedAnswer: normalizedSelected,
    correctAnswer: normalizedCorrect,
  };
}

/**
 * Check if answer option is valid
 * @param {string} option - Answer option to check
 * @returns {boolean} True if valid (A/B/C/D)
 *
 * @example
 * isValidAnswerOption('A')   // Returns: true
 * isValidAnswerOption('b')   // Returns: true (normalized)
 * isValidAnswerOption('X')   // Returns: false
 * isValidAnswerOption(null)  // Returns: false
 */
export function isValidAnswerOption(option) {
  return normalizeOption(option) !== null;
}

/**
 * Get list of valid answer options
 * @returns {string[]} Array of valid options ['A', 'B', 'C', 'D']
 */
export function getValidOptions() {
  return [...VALID_OPTIONS];
}
