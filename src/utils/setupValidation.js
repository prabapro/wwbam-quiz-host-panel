// src/utils/setupValidation.js

/**
 * Setup Validation Utilities
 * Helper functions for validating pre-event setup requirements
 */

import {
  MIN_TEAMS,
  IDEAL_MIN_TEAMS,
  MAX_TEAMS,
  QUESTIONS_PER_SET,
  MIN_PRIZE_LEVELS,
} from '@constants/config';

import {
  REQUIRED_TEAM_FIELDS,
  isValidPhoneNumber,
  isValidLength,
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MIN_PARTICIPANTS_LENGTH,
  isRequired,
  isPositiveNumber,
} from '@constants/validationRules';

// Export constants for backward compatibility
export { MIN_TEAMS, IDEAL_MIN_TEAMS, MAX_TEAMS };

/**
 * Required questions per set
 */
export const REQUIRED_QUESTIONS_PER_SET = QUESTIONS_PER_SET;

/**
 * Validate team object
 * @param {Object} team - Team object to validate
 * @returns {Object} Validation result
 */
export const validateTeam = (team) => {
  const errors = [];

  if (!team) {
    return { isValid: false, errors: ['Team object is missing'] };
  }

  // Check required fields
  REQUIRED_TEAM_FIELDS.forEach((field) => {
    if (!isRequired(team[field])) {
      errors.push(
        `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
      );
    }
  });

  // Validate name length
  if (
    team.name &&
    !isValidLength(team.name, MIN_TEAM_NAME_LENGTH, MAX_TEAM_NAME_LENGTH)
  ) {
    if (team.name.trim().length < MIN_TEAM_NAME_LENGTH) {
      errors.push(
        `Team name must be at least ${MIN_TEAM_NAME_LENGTH} characters`,
      );
    } else {
      errors.push(`Team name cannot exceed ${MAX_TEAM_NAME_LENGTH} characters`);
    }
  }

  // Validate participants length
  if (
    team.participants &&
    !isValidLength(team.participants, MIN_PARTICIPANTS_LENGTH)
  ) {
    errors.push(
      `Participants must be at least ${MIN_PARTICIPANTS_LENGTH} characters`,
    );
  }

  // Validate contact (phone number)
  if (team.contact && !isValidPhoneNumber(team.contact)) {
    errors.push('Contact number is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Validate all teams
 * @param {Object} teamsObject - Teams object from store
 * @returns {Object} Validation summary
 */
export const validateTeams = (teamsObject) => {
  if (!teamsObject || typeof teamsObject !== 'object') {
    return {
      isValid: false,
      count: 0,
      hasMinimum: false,
      hasIdeal: false,
      withinLimit: true,
      invalidTeams: [],
      errors: ['No teams configured'],
    };
  }

  const teams = Object.values(teamsObject);
  const count = teams.length;

  // Check each team
  const invalidTeams = teams
    .map((team) => {
      const validation = validateTeam(team);
      if (!validation.isValid) {
        return {
          teamId: team.id,
          teamName: team.name || 'Unknown',
          errors: validation.errors,
        };
      }
      return null;
    })
    .filter(Boolean);

  const hasMinimum = count >= MIN_TEAMS;
  const hasIdeal = count >= IDEAL_MIN_TEAMS;
  const withinLimit = count <= MAX_TEAMS;
  const allValid = invalidTeams.length === 0;

  return {
    isValid: hasMinimum && withinLimit && allValid,
    count,
    hasMinimum,
    hasIdeal,
    withinLimit,
    invalidTeams,
    errors:
      !hasMinimum || !withinLimit || !allValid
        ? [
            !hasMinimum && `At least ${MIN_TEAMS} team required`,
            !withinLimit && `Maximum ${MAX_TEAMS} teams allowed`,
            !allValid && `${invalidTeams.length} team(s) have invalid data`,
          ].filter(Boolean)
        : null,
  };
};

/**
 * Validate question set metadata
 * @param {Object} questionSet - Question set metadata object
 * @returns {Object} Validation result
 */
export const validateQuestionSetMeta = (questionSet) => {
  const errors = [];

  if (!questionSet) {
    return { isValid: false, errors: ['Question set is missing'] };
  }

  if (!isRequired(questionSet.setId)) {
    errors.push('Set ID is required');
  }

  if (!isRequired(questionSet.setName)) {
    errors.push('Set name is required');
  }

  // Use questions array length instead of totalQuestions field
  const questionCount = Array.isArray(questionSet.questions)
    ? questionSet.questions.length
    : 0;

  if (questionCount !== QUESTIONS_PER_SET) {
    errors.push(
      `Must have exactly ${QUESTIONS_PER_SET} questions (found ${questionCount})`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Validate all question sets
 * @param {Array} questionSets - Array of question set metadata
 * @returns {Object} Validation summary
 */
export const validateQuestionSets = (questionSets) => {
  if (!Array.isArray(questionSets)) {
    return {
      isValid: false,
      count: 0,
      hasMinimum: false,
      invalidSets: [],
      errors: ['No question sets uploaded'],
    };
  }

  const count = questionSets.length;

  // Check each set
  const invalidSets = questionSets
    .map((set) => {
      const validation = validateQuestionSetMeta(set);
      if (!validation.isValid) {
        return {
          setId: set.setId,
          setName: set.setName || 'Unknown',
          errors: validation.errors,
        };
      }
      return null;
    })
    .filter(Boolean);

  const hasMinimum = count >= 1;
  const allValid = invalidSets.length === 0;

  return {
    isValid: hasMinimum && allValid,
    count,
    hasMinimum,
    invalidSets,
    errors:
      !hasMinimum || !allValid
        ? [
            !hasMinimum && 'At least 1 question set required',
            !allValid &&
              `${invalidSets.length} question set(s) have invalid data`,
          ].filter(Boolean)
        : null,
  };
};

/**
 * Validate prize structure
 * @param {Array} prizes - Array of prize objects
 * @returns {Object} Validation result
 */
export const validatePrizeStructure = (prizes) => {
  const errors = [];

  if (!Array.isArray(prizes)) {
    return {
      isValid: false,
      errors: ['Prize structure must be an array'],
    };
  }

  if (prizes.length < MIN_PRIZE_LEVELS) {
    errors.push(`At least ${MIN_PRIZE_LEVELS} prize level required`);
  }

  // Check each prize
  prizes.forEach((prize, index) => {
    if (!isPositiveNumber(prize.amount)) {
      errors.push(`Prize level ${index + 1}: Invalid amount`);
    }

    if (!isRequired(prize.label)) {
      errors.push(`Prize level ${index + 1}: Label is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Validate complete setup (teams, questions, prizes)
 * @param {Object} setup - Setup object with teams, questionSets, prizes
 * @returns {Object} Comprehensive validation result
 */
export const validateCompleteSetup = (setup) => {
  const { teams, questionSets, prizes } = setup || {};

  const teamsValidation = validateTeams(teams);
  const questionsValidation = validateQuestionSets(questionSets);
  const prizesValidation = validatePrizeStructure(prizes);

  const isValid =
    teamsValidation.isValid &&
    questionsValidation.isValid &&
    prizesValidation.isValid;

  return {
    isValid,
    teams: teamsValidation,
    questions: questionsValidation,
    prizes: prizesValidation,
    readyToStart:
      isValid && teamsValidation.hasIdeal && questionsValidation.count >= 1,
  };
};
