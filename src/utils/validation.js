// src/utils/validation.js

/**
 * Validation Utilities
 * Handles answer validation and question set schema validation
 */

import { ANSWER_OPTIONS, QUESTIONS_PER_SET } from '@constants/config';

import {
  REQUIRED_QUESTION_FIELDS,
  REQUIRED_QUESTION_SET_FIELDS,
  isValidAnswerOption,
  normalizeAnswerOption,
  isValidSetId,
  isRequired,
  isValidLength,
  MIN_QUESTION_TEXT_LENGTH,
  MIN_OPTION_TEXT_LENGTH,
  VALIDATION_ERRORS,
} from '@constants/validationRules';

// Export for backward compatibility
export { isValidSetId, normalizeAnswerOption as normalizeOption };

/**
 * Valid answer options (exported for backward compatibility)
 */
const VALID_OPTIONS = ANSWER_OPTIONS;

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
  const normalizedSelected = normalizeAnswerOption(selectedAnswer);
  const normalizedCorrect = normalizeAnswerOption(correctAnswer);

  // Check if answers are valid options
  if (!normalizedSelected) {
    return {
      isValid: false,
      isCorrect: false,
      error: `Invalid selected answer: ${selectedAnswer}`,
    };
  }

  if (!normalizedCorrect) {
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
  if (expectedNumber && question.number && question.number !== expectedNumber) {
    errors.push(
      `Question number mismatch: expected ${expectedNumber}, got ${question.number}`,
    );
  }

  // Validate question text
  if (question.text) {
    if (typeof question.text !== 'string') {
      errors.push('Question text must be a string');
    } else if (!isValidLength(question.text, MIN_QUESTION_TEXT_LENGTH)) {
      errors.push('Question text cannot be empty');
    }
  }

  // Validate options
  if (question.options) {
    if (typeof question.options !== 'object') {
      errors.push('Options must be an object or array');
    } else {
      const optionKeys = Object.keys(question.options);
      const hasAllOptions = ANSWER_OPTIONS.every((opt) =>
        optionKeys.includes(opt),
      );

      if (!hasAllOptions) {
        errors.push(
          `Options must include all choices: ${ANSWER_OPTIONS.join(', ')}`,
        );
      }

      // Check each option has text
      ANSWER_OPTIONS.forEach((opt) => {
        if (question.options[opt]) {
          const optText =
            typeof question.options[opt] === 'string'
              ? question.options[opt]
              : question.options[opt];

          if (
            !isValidLength(optText?.toString() || '', MIN_OPTION_TEXT_LENGTH)
          ) {
            errors.push(`Option ${opt} cannot be empty`);
          }
        }
      });
    }
  }

  // Validate correct answer
  if (question.correctAnswer && !isValidAnswerOption(question.correctAnswer)) {
    errors.push(`Correct answer must be one of: ${ANSWER_OPTIONS.join(', ')}`);
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
  if (!isRequired(questionSet.setId) || typeof questionSet.setId !== 'string') {
    errors.push('Missing or invalid setId');
  } else if (!isValidSetId(questionSet.setId)) {
    errors.push(
      `Invalid setId format: must be 3-50 alphanumeric characters with hyphens/underscores`,
    );
  }

  if (
    !isRequired(questionSet.setName) ||
    typeof questionSet.setName !== 'string'
  ) {
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

  // Check questions count
  if (questionSet.questions.length !== QUESTIONS_PER_SET) {
    errors.push(
      `Question set must contain exactly ${QUESTIONS_PER_SET} questions, found ${questionSet.questions.length}`,
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
    questionErrors: invalidQuestions.length > 0 ? invalidQuestions : null,
    totalQuestions: questionSet.questions.length,
    invalidCount: invalidQuestions.length,
  };
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
  return isValidAnswerOption(option);
};
