// src/utils/validation.js

/**
 * Validation Utilities
 * Handles answer validation and question set schema validation
 */

import { ANSWER_OPTIONS, QUESTIONS_PER_SET } from '@constants/config';

import {
  REQUIRED_QUESTION_FIELDS,
  isValidAnswerOption,
  normalizeAnswerOption,
  isValidSetId,
  isRequired,
  isValidLength,
  MIN_QUESTION_TEXT_LENGTH,
  MIN_OPTION_TEXT_LENGTH,
} from '@constants/validationRules';

// Export for backward compatibility
export { isValidSetId, normalizeAnswerOption as normalizeOption };

/**
 * Validate a team's answer against the correct answer
 * @param {string} selectedAnswer - Team's selected answer (A/B/C/D)
 * @param {string} correctAnswer - Correct answer (A/B/C/D)
 * @returns {Object} Validation result
 */
export const validateAnswer = (selectedAnswer, correctAnswer) => {
  if (!selectedAnswer || !correctAnswer) {
    return {
      isValid: false,
      isCorrect: false,
      error: 'Missing answer data',
    };
  }

  const normalizedSelected = normalizeAnswerOption(selectedAnswer);
  const normalizedCorrect = normalizeAnswerOption(correctAnswer);

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

  return {
    isValid: true,
    isCorrect: normalizedSelected === normalizedCorrect,
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

  if (!question || typeof question !== 'object') {
    return { isValid: false, errors: ['Question is missing or not an object'] };
  }

  // Check required fields
  REQUIRED_QUESTION_FIELDS.forEach((field) => {
    if (!isRequired(question[field])) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate question number
  if (question.number !== undefined && question.number !== expectedNumber) {
    errors.push(
      `Question number mismatch: expected ${expectedNumber}, found ${question.number}`,
    );
  }

  // Validate question text
  if (
    question.text &&
    !isValidLength(question.text, MIN_QUESTION_TEXT_LENGTH)
  ) {
    errors.push(
      `Question text must be at least ${MIN_QUESTION_TEXT_LENGTH} characters`,
    );
  }

  // Validate options
  if (question.options) {
    if (
      typeof question.options !== 'object' ||
      Array.isArray(question.options)
    ) {
      errors.push('Options must be an object with keys a/b/c/d or A/B/C/D');
    } else {
      ANSWER_OPTIONS.forEach((opt) => {
        // Accept both uppercase (A/B/C/D) and lowercase (a/b/c/d) keys
        const lowerKey = opt.toLowerCase();
        const upperKey = opt.toUpperCase();
        const rawValue =
          question.options[lowerKey] ?? question.options[upperKey];

        if (rawValue === undefined) {
          errors.push(`Missing option: ${opt}`);
        } else {
          const optText =
            typeof rawValue === 'object' ? rawValue?.text : rawValue;

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

  if (!questionSet || typeof questionSet !== 'object') {
    return {
      isValid: false,
      errors: ['Question set is missing or not an object'],
      questionErrors: [],
    };
  }

  if (!isRequired(questionSet.setId) || typeof questionSet.setId !== 'string') {
    errors.push('Missing or invalid setId');
  } else if (!isValidSetId(questionSet.setId)) {
    errors.push(
      'Invalid setId format: must be 3-50 alphanumeric characters with hyphens/underscores',
    );
  }

  if (
    !isRequired(questionSet.setName) ||
    typeof questionSet.setName !== 'string'
  ) {
    errors.push('Missing or invalid setName');
  }

  if (!Array.isArray(questionSet.questions)) {
    return {
      isValid: false,
      errors: [...errors, 'Questions must be an array'],
      questionErrors: [],
    };
  }

  if (questionSet.questions.length < QUESTIONS_PER_SET) {
    errors.push(
      `Question set must contain at least ${QUESTIONS_PER_SET} questions, found ${questionSet.questions.length}`,
    );
  }

  // Validate only the first QUESTIONS_PER_SET questions
  const questionsToValidate = questionSet.questions.slice(0, QUESTIONS_PER_SET);

  const invalidQuestions = questionsToValidate
    .map((question, index) => {
      const validation = validateQuestion(question, index + 1);
      if (!validation.isValid) {
        return {
          questionNumber: index + 1,
          questionId: question?.id || 'unknown',
          errors: validation.errors,
        };
      }
      return null;
    })
    .filter(Boolean);

  return {
    isValid: errors.length === 0 && invalidQuestions.length === 0,
    errors: errors.length > 0 ? errors : null,
    questionErrors: invalidQuestions.length > 0 ? invalidQuestions : null,
    totalQuestions: questionSet.questions.length,
    validatedQuestions: QUESTIONS_PER_SET,
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
    const totalMsg =
      validationResult.totalQuestions === validationResult.validatedQuestions
        ? `${validationResult.totalQuestions} questions`
        : `${validationResult.totalQuestions} questions (first ${validationResult.validatedQuestions} validated)`;
    return `✅ Question set is valid (${totalMsg})`;
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
