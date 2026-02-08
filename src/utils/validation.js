// src/utils/validation.js

/**
 * Validation Utilities
 * Handles answer validation and question set schema validation
 */

/**
 * Valid answer options
 */
const VALID_OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Required question fields
 */
const REQUIRED_QUESTION_FIELDS = [
  'id',
  'number',
  'text',
  'options',
  'correctAnswer',
];

/**
 * Validate a team's answer against the correct answer
 * @param {string} selectedAnswer - Team's selected answer (A/B/C/D)
 * @param {string} correctAnswer - Correct answer (A/B/C/D)
 * @returns {Object} Validation result
 */
export const validateAnswer = (selectedAnswer, correctAnswer) => {
  // Input validation
  if (!selectedAnswer || !correctAnswer) {
    return {
      isValid: false,
      isCorrect: false,
      error: 'Missing answer data',
    };
  }

  // Normalize answers (uppercase, trim)
  const normalizedSelected = selectedAnswer.toString().trim().toUpperCase();
  const normalizedCorrect = correctAnswer.toString().trim().toUpperCase();

  // Check if answers are valid options
  if (!VALID_OPTIONS.includes(normalizedSelected)) {
    return {
      isValid: false,
      isCorrect: false,
      error: `Invalid selected answer: ${selectedAnswer}`,
    };
  }

  if (!VALID_OPTIONS.includes(normalizedCorrect)) {
    return {
      isValid: false,
      isCorrect: false,
      error: `Invalid correct answer: ${correctAnswer}`,
    };
  }

  // Compare answers
  const isCorrect = normalizedSelected === normalizedCorrect;

  return {
    isValid: true,
    isCorrect,
    selectedAnswer: normalizedSelected,
    correctAnswer: normalizedCorrect,
    error: null,
  };
};

/**
 * Validate a single question object
 * @param {Object} question - Question object to validate
 * @param {number} expectedNumber - Expected question number (1-20)
 * @returns {Object} Validation result
 */
export const validateQuestion = (question, expectedNumber) => {
  const errors = [];

  // Check if question exists
  if (!question || typeof question !== 'object') {
    return {
      isValid: false,
      errors: ['Question is missing or not an object'],
    };
  }

  // Check required fields
  REQUIRED_QUESTION_FIELDS.forEach((field) => {
    if (!(field in question)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate question number
  if (
    expectedNumber &&
    question.number &&
    question.number !== expectedNumber
  ) {
    errors.push(
      `Question number mismatch: expected ${expectedNumber}, got ${question.number}`,
    );
  }

  // Validate question text
  if (question.text && typeof question.text !== 'string') {
    errors.push('Question text must be a string');
  }

  if (question.text && question.text.trim().length === 0) {
    errors.push('Question text cannot be empty');
  }

  // Validate options
  if (question.options) {
    if (typeof question.options !== 'object') {
      errors.push('Options must be an object or array');
    } else {
      const optionKeys = Object.keys(question.options);
      const hasAllOptions = VALID_OPTIONS.every((opt) =>
        optionKeys.includes(opt),
      );

      if (!hasAllOptions) {
        errors.push('Options must include all choices: A, B, C, D');
      }

      // Check each option has text
      VALID_OPTIONS.forEach((opt) => {
        if (question.options[opt]) {
          const optText =
            typeof question.options[opt] === 'string'
              ? question.options[opt]
              : question.options[opt];

          if (!optText || optText.toString().trim().length === 0) {
            errors.push(`Option ${opt} cannot be empty`);
          }
        }
      });
    }
  }

  // Validate correct answer
  if (question.correctAnswer) {
    const normalized = question.correctAnswer.toString().trim().toUpperCase();
    if (!VALID_OPTIONS.includes(normalized)) {
      errors.push(
        `Correct answer must be one of: ${VALID_OPTIONS.join(', ')}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Validate an entire question set
 * @param {Object} questionSet - Question set object
 * @returns {Object} Validation result with detailed errors
 */
export const validateQuestionSet = (questionSet) => {
  const errors = [];

  // Check if question set exists
  if (!questionSet || typeof questionSet !== 'object') {
    return {
      isValid: false,
      errors: ['Question set is missing or not an object'],
      questionErrors: [],
    };
  }

  // Check for required top-level fields
  if (!questionSet.setId || typeof questionSet.setId !== 'string') {
    errors.push('Missing or invalid setId');
  }

  if (!questionSet.setName || typeof questionSet.setName !== 'string') {
    errors.push('Missing or invalid setName');
  }

  // Check questions array
  if (!Array.isArray(questionSet.questions)) {
    return {
      isValid: false,
      errors: [...errors, 'Questions must be an array'],
      questionErrors: [],
    };
  }

  // Check questions count (must be exactly 20)
  if (questionSet.questions.length !== 20) {
    errors.push(
      `Question set must contain exactly 20 questions, found ${questionSet.questions.length}`,
    );
  }

  // Validate each question
  const questionErrors = questionSet.questions.map((question, index) => {
    const expectedNumber = index + 1;
    const validation = validateQuestion(question, expectedNumber);

    if (!validation.isValid) {
      return {
        questionNumber: expectedNumber,
        questionId: question?.id || 'unknown',
        errors: validation.errors,
      };
    }

    return null;
  });

  // Filter out null entries (valid questions)
  const invalidQuestions = questionErrors.filter((err) => err !== null);

  return {
    isValid: errors.length === 0 && invalidQuestions.length === 0,
    errors: errors.length > 0 ? errors : null,
    questionErrors:
      invalidQuestions.length > 0 ? invalidQuestions : null,
    totalQuestions: questionSet.questions.length,
    invalidCount: invalidQuestions.length,
  };
};

/**
 * Validate question set ID format
 * @param {string} setId - Question set ID
 * @returns {boolean} True if valid
 */
export const isValidSetId = (setId) => {
  if (!setId || typeof setId !== 'string') {
    return false;
  }

  // Must be alphanumeric with hyphens/underscores, 3-50 chars
  const validPattern = /^[a-zA-Z0-9_-]{3,50}$/;
  return validPattern.test(setId);
};

/**
 * Generate validation summary message
 * @param {Object} validationResult - Result from validateQuestionSet
 * @returns {string} Human-readable summary
 */
export const getValidationSummary = (validationResult) => {
  if (validationResult.isValid) {
    return `✅ Question set is valid (${validationResult.totalQuestions} questions)`;
  }

  const messages = [];

  if (validationResult.errors) {
    messages.push('Set-level errors:');
    validationResult.errors.forEach((err) => messages.push(`  - ${err}`));
  }

  if (validationResult.questionErrors) {
    messages.push(
      `\nQuestion errors (${validationResult.invalidCount} invalid):`,
    );
    validationResult.questionErrors.forEach((qErr) => {
      messages.push(`  Question ${qErr.questionNumber} (${qErr.questionId}):`);
      qErr.errors.forEach((err) => messages.push(`    - ${err}`));
    });
  }

  return messages.join('\n');
};

/**
 * Check if answer option is valid
 * @param {string} option - Option to check (A/B/C/D)
 * @returns {boolean} True if valid
 */
export const isValidOption = (option) => {
  if (!option) return false;
  const normalized = option.toString().trim().toUpperCase();
  return VALID_OPTIONS.includes(normalized);
};

/**
 * Normalize answer option
 * @param {string} option - Option to normalize
 * @returns {string|null} Normalized option or null if invalid
 */
export const normalizeOption = (option) => {
  if (!option) return null;
  const normalized = option.toString().trim().toUpperCase();
  return VALID_OPTIONS.includes(normalized) ? normalized : null;
};
