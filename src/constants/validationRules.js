// src/constants/validationRules.js

/**
 * Validation Rules Constants
 * Centralized validation patterns, rules, and error messages
 */

import {
  ANSWER_OPTIONS,
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MIN_PARTICIPANTS_LENGTH,
  MIN_PHONE_DIGITS,
  MIN_QUESTION_TEXT_LENGTH,
  MIN_OPTION_TEXT_LENGTH,
  MIN_SET_ID_LENGTH,
  MAX_SET_ID_LENGTH,
  QUESTIONS_PER_SET,
} from './config';

// ============================================================================
// RE-EXPORTS (for backward compatibility and convenience)
// ============================================================================

export {
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MIN_PARTICIPANTS_LENGTH,
  MIN_PHONE_DIGITS,
  MIN_QUESTION_TEXT_LENGTH,
  MIN_OPTION_TEXT_LENGTH,
  MIN_SET_ID_LENGTH,
  MAX_SET_ID_LENGTH,
  ANSWER_OPTIONS,
};

// ============================================================================
// FIELD REQUIREMENTS
// ============================================================================

/**
 * Required fields for a team object
 */
export const REQUIRED_TEAM_FIELDS = ['name', 'participants', 'contact'];

/**
 * Required fields for a question object
 */
export const REQUIRED_QUESTION_FIELDS = [
  'id',
  'number',
  'text',
  'options',
  'correctAnswer',
];

/**
 * Required fields for a question set
 */
export const REQUIRED_QUESTION_SET_FIELDS = [
  'setId',
  'setName',
  'totalQuestions',
  'questions',
];

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/**
 * Phone number validation pattern
 * Accepts: +94771234567, 0771234567, +1 (555) 123-4567, etc.
 */
export const PHONE_NUMBER_PATTERN = /^\+?[\d\s\-()]+$/;

/**
 * Set ID validation pattern
 * Alphanumeric with hyphens/underscores, 3-50 chars
 */
export const SET_ID_PATTERN = /^[a-zA-Z0-9_-]{3,50}$/;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  const cleanedPhone = phone.trim();
  const digitCount = (cleanedPhone.match(/\d/g) || []).length;

  return (
    PHONE_NUMBER_PATTERN.test(cleanedPhone) && digitCount >= MIN_PHONE_DIGITS
  );
};

/**
 * Validate answer option
 * @param {string} option - Option to validate (A/B/C/D)
 * @returns {boolean} True if valid
 */
export const isValidAnswerOption = (option) => {
  if (!option) return false;
  const normalized = option.toString().trim().toUpperCase();
  return ANSWER_OPTIONS.includes(normalized);
};

/**
 * Normalize answer option to uppercase
 * @param {string} option - Option to normalize
 * @returns {string|null} Normalized option or null if invalid
 */
export const normalizeAnswerOption = (option) => {
  if (!option) return null;
  const normalized = option.toString().trim().toUpperCase();
  return ANSWER_OPTIONS.includes(normalized) ? normalized : null;
};

/**
 * Validate set ID format
 * @param {string} setId - Set ID to validate
 * @returns {boolean} True if valid
 */
export const isValidSetId = (setId) => {
  if (!setId || typeof setId !== 'string') return false;
  return SET_ID_PATTERN.test(setId);
};

// ============================================================================
// GENERIC HELPERS
// ============================================================================

/**
 * Check if a value is present (not null, undefined, or empty string)
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Check if a string meets minimum (and optional maximum) length requirements
 */
export const isValidLength = (value, min, max) => {
  if (!value || typeof value !== 'string') return false;
  const len = value.trim().length;
  if (len < min) return false;
  if (max !== undefined && len > max) return false;
  return true;
};

/**
 * Check if a value is a positive number
 */
export const isPositiveNumber = (value) => {
  return typeof value === 'number' && value > 0;
};

/**
 * Validate that a question set has the required number of questions
 */
export const isValidQuestionCount = (count) => {
  return count === QUESTIONS_PER_SET;
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Standard validation error messages
 */
export const VALIDATION_ERRORS = {
  // Team validation
  TEAM_NAME_REQUIRED: 'Team name is required',
  TEAM_NAME_TOO_SHORT: `Team name must be at least ${MIN_TEAM_NAME_LENGTH} characters`,
  TEAM_NAME_TOO_LONG: `Team name cannot exceed ${MAX_TEAM_NAME_LENGTH} characters`,
  TEAM_NAME_INVALID_FORMAT: 'Team name contains invalid characters',
  TEAM_NAME_DUPLICATE: 'Team name already exists',

  PARTICIPANTS_REQUIRED: 'Participants are required',
  PARTICIPANTS_TOO_SHORT: `Participants must be at least ${MIN_PARTICIPANTS_LENGTH} characters`,

  CONTACT_REQUIRED: 'Contact number is required',
  CONTACT_INVALID: 'Contact number is invalid',

  // Question validation
  QUESTION_TEXT_REQUIRED: 'Question text is required',
  OPTION_REQUIRED: 'All options (A, B, C, D) are required',
  CORRECT_ANSWER_REQUIRED: 'Correct answer is required',
  CORRECT_ANSWER_INVALID: `Correct answer must be one of: ${ANSWER_OPTIONS.join(', ')}`,

  // Question set validation
  SET_ID_REQUIRED: 'Set ID is required',
  SET_ID_INVALID:
    'Set ID must be 3-50 alphanumeric characters with hyphens/underscores',
  SET_NAME_REQUIRED: 'Set name is required',
  QUESTION_COUNT_INVALID: `Question set must have exactly ${QUESTIONS_PER_SET} questions`,
};
