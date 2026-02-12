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

/**
 * Normalize answer option to uppercase
 * @param {string} option - Answer option (A/B/C/D)
 * @returns {string} Normalized option (uppercase, trimmed)
 */
export function normalizeOption(option) {
  // TODO: Implement normalization
  if (!option || typeof option !== 'string') {
    return null;
  }

  const normalized = option.toString().trim().toUpperCase();
  const validOptions = ['A', 'B', 'C', 'D'];

  return validOptions.includes(normalized) ? normalized : null;
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
 * @example
 * validateAnswer('B', 'B')
 * // Returns: { isCorrect: true, selectedAnswer: 'B', correctAnswer: 'B' }
 *
 * validateAnswer('a', 'B')
 * // Returns: { isCorrect: false, selectedAnswer: 'A', correctAnswer: 'B' }
 */
export function validateAnswer(selectedAnswer, correctAnswer) {
  // TODO: Implement validation logic
  console.log(
    '🚧 validateAnswer not implemented:',
    selectedAnswer,
    correctAnswer,
  );

  const normalizedSelected = normalizeOption(selectedAnswer);
  const normalizedCorrect = normalizeOption(correctAnswer);

  if (!normalizedSelected || !normalizedCorrect) {
    throw new Error('Invalid answer options');
  }

  return {
    isCorrect: normalizedSelected === normalizedCorrect,
    selectedAnswer: normalizedSelected,
    correctAnswer: normalizedCorrect,
  };
}

/**
 * Check if answer option is valid
 * @param {string} option - Answer option to check
 * @returns {boolean} True if valid (A/B/C/D)
 */
export function isValidAnswerOption(option) {
  // TODO: Implement validation
  const normalized = normalizeOption(option);
  return normalized !== null;
}
