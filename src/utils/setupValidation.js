// src/utils/setupValidation.js

/**
 * Setup Validation Utilities
 * Helper functions for validating pre-event setup requirements
 */

/**
 * Minimum and maximum team counts
 */
export const MIN_TEAMS = 1;
export const IDEAL_MIN_TEAMS = 7;
export const MAX_TEAMS = 10;

/**
 * Required questions per set
 */
export const REQUIRED_QUESTIONS_PER_SET = 20;

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
  if (!team.name || team.name.trim().length === 0) {
    errors.push('Team name is required');
  }

  if (!team.participants || team.participants.trim().length === 0) {
    errors.push('Participants are required');
  }

  if (!team.contact || team.contact.trim().length === 0) {
    errors.push('Contact number is required');
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

  if (!questionSet.setId || questionSet.setId.trim().length === 0) {
    errors.push('Set ID is required');
  }

  if (!questionSet.setName || questionSet.setName.trim().length === 0) {
    errors.push('Set name is required');
  }

  const questionCount = questionSet.totalQuestions || 0;
  if (questionCount !== REQUIRED_QUESTIONS_PER_SET) {
    errors.push(
      `Must have exactly ${REQUIRED_QUESTIONS_PER_SET} questions (found ${questionCount})`,
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
            !allValid && `${invalidSets.length} set(s) have invalid data`,
          ].filter(Boolean)
        : null,
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
 * @returns {Object} Complete validation result
 */
export const validateCompleteSetup = (teamsObject, questionSets) => {
  const teamsValidation = validateTeams(teamsObject);
  const questionSetsValidation = validateQuestionSets(questionSets);
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
      status:
        teamsValidation.invalidTeams.length === 0 ? 'pass' : 'warning',
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
          ? 'All sets have 20 questions'
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
  ];

  // Overall readiness
  const criticalChecks = allChecks.filter(
    (check) => check.status === 'fail',
  );
  const warningChecks = allChecks.filter(
    (check) => check.status === 'warning',
  );

  const isReady = criticalChecks.length === 0 && warningChecks.length === 0;
  const hasWarnings = warningChecks.length > 0;

  return {
    isReady,
    hasWarnings,
    teamsValidation,
    questionSetsValidation,
    sufficiencyCheck,
    checks: allChecks,
    summary: {
      teams: teamsValidation.count,
      questionSets: questionSetsValidation.count,
      criticalIssues: criticalChecks.length,
      warnings: warningChecks.length,
    },
  };
};
