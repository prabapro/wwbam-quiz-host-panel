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

  // Check totalQuestions field (from metadata) OR questions array length (from full set)
  const questionCount =
    questionSet.totalQuestions ??
    (Array.isArray(questionSet.questions) ? questionSet.questions.length : 0);

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
 * @param {Array} prizeStructure - Prize structure array from Firebase/store
 * @returns {Object} Validation summary
 */
export const validatePrizeStructure = (prizeStructure) => {
  const errors = [];

  // Check if prize structure exists
  if (!prizeStructure) {
    return {
      isValid: false,
      count: 0,
      hasMinimum: false,
      allPositive: false,
      maxPrize: 0,
      minPrize: 0,
      errors: ['Prize structure not configured'],
    };
  }

  // Check if it's an array
  if (!Array.isArray(prizeStructure)) {
    return {
      isValid: false,
      count: 0,
      hasMinimum: false,
      allPositive: false,
      maxPrize: 0,
      minPrize: 0,
      errors: ['Prize structure must be an array'],
    };
  }

  const count = prizeStructure.length;

  // Check minimum levels
  const hasMinimum = count >= MIN_PRIZE_LEVELS;
  if (!hasMinimum) {
    errors.push(`At least ${MIN_PRIZE_LEVELS} prize level required`);
  }

  // Check each prize value
  const invalidPrizes = [];
  prizeStructure.forEach((prize, index) => {
    if (typeof prize !== 'number' || isNaN(prize)) {
      invalidPrizes.push({
        level: index + 1,
        value: prize,
        error: 'Must be a number',
      });
    } else if (!isPositiveNumber(prize) && prize !== 0) {
      invalidPrizes.push({
        level: index + 1,
        value: prize,
        error: 'Cannot be negative',
      });
    }
  });

  const allPositive = invalidPrizes.length === 0;

  if (invalidPrizes.length > 0) {
    errors.push(`${invalidPrizes.length} prize level(s) have invalid values`);
  }

  // Calculate statistics
  const maxPrize = Math.max(
    ...prizeStructure.filter((p) => typeof p === 'number' && !isNaN(p)),
  );
  const minPrize = Math.min(
    ...prizeStructure.filter((p) => typeof p === 'number' && !isNaN(p)),
  );

  return {
    isValid: hasMinimum && allPositive,
    count,
    hasMinimum,
    allPositive,
    invalidPrizes,
    // Note: totalPrizePool requires team count, calculated at validation summary level
    minPrize: isFinite(minPrize) ? minPrize : 0,
    maxPrize: isFinite(maxPrize) ? maxPrize : 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Check if there are sufficient question sets for teams
 * @param {number} teamCount - Number of teams
 * @param {number} questionSetCount - Number of question sets
 * @returns {Object} Sufficiency check result
 */
export const checkSufficientQuestionSets = (teamCount, questionSetCount) => {
  const isSufficient = questionSetCount >= teamCount;

  return {
    isSufficient,
    teamCount,
    questionSetCount,
    deficit: isSufficient ? 0 : teamCount - questionSetCount,
    message: isSufficient
      ? `${questionSetCount} sets available for ${teamCount} team(s)`
      : `Need ${teamCount - questionSetCount} more set(s) (${questionSetCount}/${teamCount})`,
  };
};

/**
 * Perform complete setup validation
 * @param {Object} teamsObject - Teams object from store
 * @param {Array} questionSets - Question sets metadata array
 * @param {Array} prizeStructure - Prize structure array from Firebase/store
 * @returns {Object} Complete validation result
 */
export const validateCompleteSetup = (
  teamsObject,
  questionSets,
  prizeStructure = null,
) => {
  const teamsValidation = validateTeams(teamsObject);
  const questionSetsValidation = validateQuestionSets(questionSets);
  const prizeValidation = validatePrizeStructure(prizeStructure);
  const sufficiencyCheck = checkSufficientQuestionSets(
    teamsValidation.count,
    questionSetsValidation.count,
  );

  const allChecks = [
    {
      id: 'teams-configured',
      label: 'Teams Configured',
      status: teamsValidation.hasMinimum ? 'pass' : 'fail',
      message: teamsValidation.hasMinimum
        ? `${teamsValidation.count} team(s) ready`
        : teamsValidation.errors?.[0] || 'No teams configured',
      details: teamsValidation,
    },
    {
      id: 'teams-valid',
      label: 'Team Data Valid',
      status: teamsValidation.invalidTeams.length === 0 ? 'pass' : 'warning',
      message:
        teamsValidation.invalidTeams.length === 0
          ? 'All teams have valid data'
          : `${teamsValidation.invalidTeams.length} team(s) have issues`,
      details: teamsValidation.invalidTeams,
    },
    {
      id: 'teams-ideal',
      label: 'Ideal Team Count',
      status: teamsValidation.hasIdeal ? 'pass' : 'info',
      message: teamsValidation.hasIdeal
        ? `${teamsValidation.count} teams (ideal: ${IDEAL_MIN_TEAMS}+)`
        : `${teamsValidation.count} teams (recommended: ${IDEAL_MIN_TEAMS}-${MAX_TEAMS})`,
      details: null,
    },
    {
      id: 'question-sets-uploaded',
      label: 'Question Sets Uploaded',
      status: questionSetsValidation.hasMinimum ? 'pass' : 'fail',
      message: questionSetsValidation.hasMinimum
        ? `${questionSetsValidation.count} set(s) uploaded`
        : questionSetsValidation.errors?.[0] || 'No question sets uploaded',
      details: questionSetsValidation,
    },
    {
      id: 'question-sets-valid',
      label: 'Question Sets Valid',
      status:
        questionSetsValidation.invalidSets.length === 0 ? 'pass' : 'warning',
      message:
        questionSetsValidation.invalidSets.length === 0
          ? `All sets have ${QUESTIONS_PER_SET} questions`
          : `${questionSetsValidation.invalidSets.length} set(s) have issues`,
      details: questionSetsValidation.invalidSets,
    },
    {
      id: 'sufficient-sets',
      label: 'Sufficient Question Sets',
      status: sufficiencyCheck.isSufficient ? 'pass' : 'fail',
      message: sufficiencyCheck.message,
      details: sufficiencyCheck,
    },
    {
      id: 'prize-structure-configured',
      label: 'Prize Structure Configured',
      status: prizeValidation.hasMinimum ? 'pass' : 'fail',
      message: prizeValidation.hasMinimum
        ? `${prizeValidation.count} prize level(s) configured`
        : prizeValidation.errors?.[0] || 'Prize structure not configured',
      details: prizeValidation,
    },
    {
      id: 'prize-structure-valid',
      label: 'Prize Values Valid',
      status: prizeValidation.allPositive ? 'pass' : 'warning',
      message: prizeValidation.allPositive
        ? `All prizes are valid (Max prize per team: Rs.${prizeValidation.maxPrize.toLocaleString()})`
        : `${prizeValidation.invalidPrizes?.length || 0} invalid prize value(s)`,
      details: prizeValidation.invalidPrizes,
    },
  ];

  // Overall readiness
  const criticalChecks = allChecks.filter((check) => check.status === 'fail');
  const warningChecks = allChecks.filter((check) => check.status === 'warning');

  const isReady = criticalChecks.length === 0 && warningChecks.length === 0;
  const hasWarnings = warningChecks.length > 0;

  // Calculate total prize pool based on team count and max prize
  const totalPrizePool =
    teamsValidation.count > 0
      ? prizeValidation.maxPrize * teamsValidation.count
      : 0;

  return {
    isReady,
    hasWarnings,
    teamsValidation,
    questionSetsValidation,
    prizeValidation,
    sufficiencyCheck,
    checks: allChecks,
    summary: {
      teams: teamsValidation.count,
      questionSets: questionSetsValidation.count,
      prizeLevels: prizeValidation.count,
      totalPrizePool,
      criticalIssues: criticalChecks.length,
      warnings: warningChecks.length,
    },
  };
};
