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

/**
 * Email validation pattern (basic)
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Team name validation pattern
 * Allows letters, numbers, spaces, basic punctuation
 */
export const TEAM_NAME_PATTERN = /^[a-zA-Z0-9\s\-_.,()]+$/;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

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
  if (!setId || typeof setId !== 'string') {
    return false;
  }
  return SET_ID_PATTERN.test(setId);
};

/**
 * Validate team name format
 * @param {string} name - Team name to validate
 * @returns {boolean} True if valid
 */
export const isValidTeamName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  return (
    trimmed.length >= MIN_TEAM_NAME_LENGTH &&
    trimmed.length <= MAX_TEAM_NAME_LENGTH &&
    TEAM_NAME_PATTERN.test(trimmed)
  );
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_PATTERN.test(email.trim());
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
  CONTACT_INVALID: 'Please enter a valid phone number',

  // Question validation
  QUESTION_TEXT_REQUIRED: 'Question text is required',
  QUESTION_TEXT_EMPTY: 'Question text cannot be empty',

  OPTION_REQUIRED: 'All options (A, B, C, D) are required',
  OPTION_EMPTY: 'Option text cannot be empty',

  CORRECT_ANSWER_REQUIRED: 'Correct answer is required',
  CORRECT_ANSWER_INVALID: `Correct answer must be one of: ${ANSWER_OPTIONS.join(', ')}`,

  // Question set validation
  SET_ID_REQUIRED: 'Set ID is required',
  SET_ID_INVALID: `Set ID must be ${MIN_SET_ID_LENGTH}-${MAX_SET_ID_LENGTH} alphanumeric characters`,
  SET_ID_DUPLICATE: 'Set ID already exists',

  SET_NAME_REQUIRED: 'Set name is required',

  QUESTIONS_ARRAY_REQUIRED: 'Questions must be an array',
  QUESTIONS_COUNT_INVALID: 'Question set must contain exactly 20 questions',

  // General validation
  FIELD_REQUIRED: 'This field is required',
  INVALID_NUMBER: 'Must be a valid number',
  INVALID_FORMAT: 'Invalid format',
  MISSING_DATA: 'Missing required data',
};

/**
 * Get validation error message
 * @param {string} errorKey - Error key from VALIDATION_ERRORS
 * @param {Object} params - Optional parameters for dynamic messages
 * @returns {string} Error message
 */
export const getValidationError = (errorKey, params = {}) => {
  let message = VALIDATION_ERRORS[errorKey] || VALIDATION_ERRORS.INVALID_FORMAT;

  // Replace parameters if provided
  Object.keys(params).forEach((key) => {
    message = message.replace(`{${key}}`, params[key]);
  });

  return message;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length (optional)
 * @returns {boolean} True if valid
 */
export const isValidLength = (str, min, max = Infinity) => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  const length = str.trim().length;
  return length >= min && length <= max;
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty/null/undefined
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

/**
 * Validate number in range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if in range
 */
export const isInRange = (value, min, max) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  return value >= min && value <= max;
};

/**
 * Validate positive number
 * @param {number} value - Number to validate
 * @returns {boolean} True if positive
 */
export const isPositiveNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && value > 0;
};

/**
 * Validate non-negative number
 * @param {number} value - Number to validate
 * @returns {boolean} True if non-negative
 */
export const isNonNegativeNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
};
