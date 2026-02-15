// src/constants/config.js

/**
 * Application Configuration Constants
 * Centralized configuration for the quiz competition system
 * Single source of truth for app-wide settings
 */

// ============================================================================
// TEAM CONFIGURATION
// ============================================================================

/**
 * Minimum number of teams required to start competition
 */
export const MIN_TEAMS = 1;

/**
 * Ideal minimum number of teams for a good competition
 */
export const IDEAL_MIN_TEAMS = 7;

/**
 * Maximum number of teams allowed in competition
 */
export const MAX_TEAMS = 10;

// ============================================================================
// QUESTION CONFIGURATION
// ============================================================================

/**
 * Number of questions required per question set
 * Can be overridden by VITE_QUESTIONS_PER_SET environment variable
 * Falls back to 20 if env var is not set or invalid
 */
export const QUESTIONS_PER_SET = (() => {
  const envValue = import.meta.env.VITE_QUESTIONS_PER_SET;

  if (envValue !== undefined && envValue !== '') {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`📋 QUESTIONS_PER_SET set from env: ${parsed}`);
      return parsed;
    }
  }

  console.log(`📋 QUESTIONS_PER_SET using default: 20`);
  return 20;
})();

/**
 * Total number of questions in the game
 * (Same as QUESTIONS_PER_SET - kept for clarity in different contexts)
 */
export const TOTAL_QUESTIONS = QUESTIONS_PER_SET;

/**
 * Valid answer options for each question
 */
export const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Number of answer options
 */
export const ANSWER_OPTIONS_COUNT = ANSWER_OPTIONS.length;

// ============================================================================
// PRIZE CONFIGURATION
// ============================================================================

/**
 * Minimum number of prize levels required
 */
export const MIN_PRIZE_LEVELS = 1;

/**
 * Default number of prize levels (matches TOTAL_QUESTIONS)
 */
export const DEFAULT_PRIZE_LEVELS = TOTAL_QUESTIONS;

/**
 * Milestone question numbers (1-indexed)
 * These are significant checkpoints in the game
 */
export const MILESTONE_QUESTIONS = [5, 10, 15, 20];

// ============================================================================
// LIFELINE CONFIGURATION
// ============================================================================

/**
 * Available lifeline types
 */
export const LIFELINE_TYPES = {
  PHONE_A_FRIEND: 'phone-a-friend',
  FIFTY_FIFTY: 'fifty-fifty',
};

/**
 * Number of options to remove in 50/50 lifeline
 */
export const FIFTY_FIFTY_REMOVE_COUNT = 2;

/**
 * Phone-a-Friend duration in minutes
 */
export const PHONE_A_FRIEND_DURATION_MINUTES = 3;

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

/**
 * Minimum length for team names
 */
export const MIN_TEAM_NAME_LENGTH = 2;

/**
 * Maximum length for team names
 */
export const MAX_TEAM_NAME_LENGTH = 100;

/**
 * Minimum length for participant names
 */
export const MIN_PARTICIPANTS_LENGTH = 2;

/**
 * Minimum digits required in phone number
 */
export const MIN_PHONE_DIGITS = 7;

/**
 * Minimum length for question text
 */
export const MIN_QUESTION_TEXT_LENGTH = 1;

/**
 * Minimum length for option text
 */
export const MIN_OPTION_TEXT_LENGTH = 1;

/**
 * Minimum valid set ID length
 */
export const MIN_SET_ID_LENGTH = 3;

/**
 * Maximum valid set ID length
 */
export const MAX_SET_ID_LENGTH = 50;

// ============================================================================
// CURRENCY CONFIGURATION
// ============================================================================

/**
 * Default currency symbol
 */
export const CURRENCY_SYMBOL = 'Rs.';

/**
 * Default locale for number formatting
 */
export const NUMBER_FORMAT_LOCALE = 'en-US';

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

/**
 * localStorage key prefix for the app
 */
export const STORAGE_PREFIX = 'wwbam-quiz-';

/**
 * localStorage keys
 */
export const STORAGE_KEYS = {
  QUESTION_SETS: `${STORAGE_PREFIX}question-sets`,
  METADATA: `${STORAGE_PREFIX}metadata`,
};

/**
 * Estimated localStorage limit (5MB for most browsers)
 */
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

/**
 * Debounce delay for search/filter inputs (milliseconds)
 */
export const DEBOUNCE_DELAY_MS = 300;

/**
 * Toast notification duration (milliseconds)
 */
export const TOAST_DURATION_MS = 3000;

/**
 * Auto-save delay (milliseconds)
 */
export const AUTO_SAVE_DELAY_MS = 2000;

// ============================================================================
// BATCH UPLOAD CONFIGURATION
// ============================================================================

/**
 * Warning threshold for large batch uploads
 */
export const LARGE_BATCH_WARNING_THRESHOLD = 10;

/**
 * Maximum files allowed in single upload
 */
export const MAX_FILES_PER_UPLOAD = 20;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a question number is a milestone
 * @param {number} questionNumber - Question number (1-indexed)
 * @returns {boolean} True if milestone
 */
export const isMilestoneQuestion = (questionNumber) => {
  return MILESTONE_QUESTIONS.includes(questionNumber);
};

/**
 * Get valid range for team count
 * @returns {Object} Object with min, max, and ideal values
 */
export const getTeamCountRange = () => {
  return {
    min: MIN_TEAMS,
    ideal: IDEAL_MIN_TEAMS,
    max: MAX_TEAMS,
  };
};

/**
 * Get valid range for question count
 * @returns {Object} Object with required count
 */
export const getQuestionCountConfig = () => {
  return {
    required: QUESTIONS_PER_SET,
    total: TOTAL_QUESTIONS,
  };
};

/**
 * Get lifeline configuration
 * @returns {Object} Lifeline settings
 */
export const getLifelineConfig = () => {
  return {
    types: LIFELINE_TYPES,
    fiftyFiftyRemoveCount: FIFTY_FIFTY_REMOVE_COUNT,
    phoneAFriendDuration: PHONE_A_FRIEND_DURATION_MINUTES,
  };
};

/**
 * Get validation configuration
 * @returns {Object} Validation settings
 */
export const getValidationConfig = () => {
  return {
    teamName: {
      min: MIN_TEAM_NAME_LENGTH,
      max: MAX_TEAM_NAME_LENGTH,
    },
    participants: {
      min: MIN_PARTICIPANTS_LENGTH,
    },
    phone: {
      minDigits: MIN_PHONE_DIGITS,
    },
    questionText: {
      min: MIN_QUESTION_TEXT_LENGTH,
    },
    optionText: {
      min: MIN_OPTION_TEXT_LENGTH,
    },
    setId: {
      min: MIN_SET_ID_LENGTH,
      max: MAX_SET_ID_LENGTH,
    },
  };
};
