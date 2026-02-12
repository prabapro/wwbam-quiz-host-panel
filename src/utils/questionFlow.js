// src/utils/questionFlow.js

/**
 * Question Flow Utilities
 * Helper functions for managing question lifecycle during gameplay
 */

/**
 * Question flow states
 */
export const QUESTION_STATE = {
  NOT_LOADED: 'not-loaded',
  LOADED_HOST_ONLY: 'loaded-host-only',
  SHOWN_TO_PUBLIC: 'shown-to-public',
  ANSWER_SELECTED: 'answer-selected',
  ANSWER_LOCKED: 'answer-locked',
  ANSWER_VALIDATED: 'answer-validated',
};

/**
 * Get next question index for current team
 * @param {number} currentQuestionNumber - Current question number (1-20)
 * @returns {number} Next question index (0-19)
 */
export const getNextQuestionIndex = (currentQuestionNumber) => {
  // currentQuestionNumber is 1-indexed (1-20)
  // We need 0-indexed for array access (0-19)
  return currentQuestionNumber; // Next question index
};

/**
 * Check if question is final question
 * @param {number} questionNumber - Question number (1-20)
 * @param {number} totalQuestions - Total questions (default 20)
 * @returns {boolean} True if final question
 */
export const isFinalQuestion = (questionNumber, totalQuestions = 20) => {
  return questionNumber >= totalQuestions;
};

/**
 * Check if team has any lifelines remaining
 * @param {Object} lifelines - Team's lifelines object
 * @returns {boolean} True if at least one lifeline available
 */
export const hasLifelinesRemaining = (lifelines) => {
  if (!lifelines || typeof lifelines !== 'object') {
    return false;
  }

  return Object.values(lifelines).some((available) => available === true);
};

/**
 * Get available lifeline types
 * @param {Object} lifelines - Team's lifelines object
 * @returns {string[]} Array of available lifeline type keys
 */
export const getAvailableLifelines = (lifelines) => {
  if (!lifelines || typeof lifelines !== 'object') {
    return [];
  }

  return Object.keys(lifelines).filter((type) => lifelines[type] === true);
};

/**
 * Calculate new prize after correct answer
 * @param {number} questionNumber - Question number just answered (1-20)
 * @param {Array} prizeStructure - Prize structure array
 * @returns {number} New prize amount
 */
export const calculateNewPrize = (questionNumber, prizeStructure) => {
  if (!Array.isArray(prizeStructure) || prizeStructure.length === 0) {
    console.warn('Invalid prize structure');
    return 0;
  }

  // questionNumber is 1-indexed, array is 0-indexed
  const prizeIndex = questionNumber - 1;

  if (prizeIndex < 0 || prizeIndex >= prizeStructure.length) {
    console.warn(`Invalid question number: ${questionNumber}`);
    return 0;
  }

  return prizeStructure[prizeIndex];
};

/**
 * Determine if answer validation should trigger automatic flow
 * @param {boolean} isCorrect - Whether answer is correct
 * @param {Object} lifelines - Team's lifelines
 * @returns {Object} Flow decision
 */
export const determineAnswerFlow = (isCorrect, lifelines) => {
  if (isCorrect) {
    return {
      flow: 'correct',
      action: 'proceed-to-next',
      message: 'Correct! Proceeding to next question.',
    };
  }

  // Incorrect answer
  const hasLifelines = hasLifelinesRemaining(lifelines);

  if (hasLifelines) {
    return {
      flow: 'incorrect-with-lifelines',
      action: 'offer-choice',
      message: 'Incorrect answer. Lifelines available.',
      availableLifelines: getAvailableLifelines(lifelines),
    };
  }

  return {
    flow: 'incorrect-no-lifelines',
    action: 'eliminate',
    message: 'Incorrect answer. No lifelines remaining.',
  };
};

/**
 * Validate question data structure
 * @param {Object} question - Question object
 * @returns {boolean} True if valid
 */
export const isValidQuestionData = (question) => {
  if (!question || typeof question !== 'object') {
    return false;
  }

  const requiredFields = ['id', 'number', 'text', 'options', 'correctAnswer'];

  const hasAllFields = requiredFields.every((field) => field in question);

  if (!hasAllFields) {
    return false;
  }

  // Validate options
  if (
    !question.options ||
    typeof question.options !== 'object' ||
    !['A', 'B', 'C', 'D'].every((opt) => opt in question.options)
  ) {
    return false;
  }

  // Validate correct answer
  if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    return false;
  }

  return true;
};

/**
 * Format question for public display (remove correct answer)
 * @param {Object} question - Full question object
 * @returns {Object} Question without correct answer
 */
export const formatQuestionForPublic = (question) => {
  if (!question) {
    return null;
  }

  const { correctAnswer, ...publicQuestion } = question;

  return publicQuestion;
};

/**
 * Get question display text summary
 * @param {Object} question - Question object
 * @param {number} maxLength - Maximum text length
 * @returns {string} Truncated question text
 */
export const getQuestionSummary = (question, maxLength = 50) => {
  if (!question || !question.text) {
    return 'No question loaded';
  }

  if (question.text.length <= maxLength) {
    return question.text;
  }

  return question.text.substring(0, maxLength) + '...';
};

/**
 * Check if team can proceed to next question
 * @param {string} teamStatus - Team status
 * @param {number} questionNumber - Current question number
 * @param {number} totalQuestions - Total questions
 * @returns {boolean} True if can proceed
 */
export const canProceedToNextQuestion = (
  teamStatus,
  questionNumber,
  totalQuestions = 20,
) => {
  // Team must be active
  if (teamStatus !== 'active') {
    return false;
  }

  // Must not be at final question
  if (questionNumber >= totalQuestions) {
    return false;
  }

  return true;
};

/**
 * Get question state label for UI
 * @param {string} state - Question state
 * @returns {string} Human-readable label
 */
export const getQuestionStateLabel = (state) => {
  const labels = {
    [QUESTION_STATE.NOT_LOADED]: 'Ready to Load',
    [QUESTION_STATE.LOADED_HOST_ONLY]: 'Loaded (Host Only)',
    [QUESTION_STATE.SHOWN_TO_PUBLIC]: 'Visible to Public',
    [QUESTION_STATE.ANSWER_SELECTED]: 'Answer Selected',
    [QUESTION_STATE.ANSWER_LOCKED]: 'Answer Locked',
    [QUESTION_STATE.ANSWER_VALIDATED]: 'Answer Validated',
  };

  return labels[state] || 'Unknown State';
};

/**
 * Calculate question completion percentage
 * @param {number} questionsAnswered - Number of questions answered
 * @param {number} totalQuestions - Total questions
 * @returns {number} Percentage (0-100)
 */
export const calculateQuestionProgress = (
  questionsAnswered,
  totalQuestions = 20,
) => {
  if (totalQuestions === 0) {
    return 0;
  }

  return Math.round((questionsAnswered / totalQuestions) * 100);
};
