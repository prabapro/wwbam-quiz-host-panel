// src/utils/teamValidation.js

/**
 * Team Validation Utilities
 * Handles team structure validation, uniqueness checks, and batch validation
 */

import {
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MIN_PARTICIPANTS_LENGTH,
} from '@constants/config';

import {
  REQUIRED_TEAM_FIELDS,
  isValidPhoneNumber,
  isValidLength,
  isRequired,
  VALIDATION_ERRORS,
} from '@constants/validationRules';

/**
 * Validate a single team object structure
 * @param {Object} team - Team object to validate
 * @param {number} index - Team index in array (for error reporting)
 * @returns {Object} Validation result
 */
export const validateTeamStructure = (team, index = 0) => {
  const errors = [];
  const teamLabel = `Team ${index + 1}`;

  // Check if team exists and is an object
  if (!team || typeof team !== 'object' || Array.isArray(team)) {
    return {
      isValid: false,
      errors: [`${teamLabel}: Invalid team object`],
    };
  }

  // Check required fields
  REQUIRED_TEAM_FIELDS.forEach((field) => {
    if (!isRequired(team[field])) {
      errors.push(`${teamLabel}: Missing required field '${field}'`);
    }
  });

  // Validate team name
  if (team.name) {
    const name = team.name.trim();

    if (name.length < MIN_TEAM_NAME_LENGTH) {
      errors.push(
        `${teamLabel}: Team name must be at least ${MIN_TEAM_NAME_LENGTH} characters`,
      );
    } else if (name.length > MAX_TEAM_NAME_LENGTH) {
      errors.push(
        `${teamLabel}: Team name cannot exceed ${MAX_TEAM_NAME_LENGTH} characters`,
      );
    }
  }

  // Validate participants
  if (team.participants) {
    const participants = team.participants.trim();
    if (participants.length < MIN_PARTICIPANTS_LENGTH) {
      errors.push(
        `${teamLabel}: Participants must be at least ${MIN_PARTICIPANTS_LENGTH} characters long`,
      );
    }
  }

  // Validate contact (phone number)
  if (team.contact && !isValidPhoneNumber(team.contact)) {
    errors.push(
      `${teamLabel}: Invalid phone number format for contact '${team.contact}'`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
    team: {
      name: team.name?.trim() || '',
      participants: team.participants?.trim() || '',
      contact: team.contact?.trim() || '',
    },
  };
};

/**
 * Check for duplicate team names within an array
 * @param {Array} teams - Array of team objects
 * @returns {Object} Duplication check result
 */
export const checkDuplicatesInArray = (teams) => {
  const nameMap = new Map();
  const duplicates = [];

  teams.forEach((team, index) => {
    if (!team.name) return;

    const normalizedName = team.name.trim().toLowerCase();

    if (nameMap.has(normalizedName)) {
      duplicates.push({
        name: team.name,
        indices: [nameMap.get(normalizedName), index],
      });
    } else {
      nameMap.set(normalizedName, index);
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
};

/**
 * Check if team name exists in existing teams
 * @param {string} teamName - Name to check
 * @param {Object} existingTeams - Teams object from store
 * @returns {boolean} True if name exists
 */
export const teamNameExists = (teamName, existingTeams) => {
  if (!teamName || !existingTeams) return false;

  const normalizedName = teamName.trim().toLowerCase();
  const existingNames = Object.values(existingTeams).map((team) =>
    team.name.trim().toLowerCase(),
  );

  return existingNames.includes(normalizedName);
};

/**
 * Check for name conflicts with existing teams
 * @param {Array} teams - New teams to check
 * @param {Object} existingTeams - Existing teams from store
 * @returns {Object} Conflict check result
 */
export const checkExistingConflicts = (teams, existingTeams) => {
  const conflicts = [];

  teams.forEach((team, index) => {
    if (!team.name) return;

    if (teamNameExists(team.name, existingTeams)) {
      conflicts.push({
        index,
        name: team.name,
      });
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

/**
 * Validate entire teams JSON file
 * @param {Object} jsonData - Parsed JSON data
 * @param {Object} existingTeams - Existing teams from store
 * @returns {Object} Complete validation result
 */
export const validateTeamsJSON = (jsonData, existingTeams = {}) => {
  const errors = [];
  const warnings = [];

  // Check if data exists
  if (!jsonData) {
    return {
      isValid: false,
      errors: ['JSON data is empty or invalid'],
      warnings: [],
      teams: [],
    };
  }

  // Check if teams array exists
  if (!Array.isArray(jsonData.teams)) {
    return {
      isValid: false,
      errors: ['JSON must contain a "teams" array'],
      warnings: [],
      teams: [],
    };
  }

  const teams = jsonData.teams;

  // Check if array is empty
  if (teams.length === 0) {
    return {
      isValid: false,
      errors: ['Teams array cannot be empty'],
      warnings: [],
      teams: [],
    };
  }

  // Validate each team structure
  const structureValidations = teams.map((team, index) =>
    validateTeamStructure(team, index),
  );

  const invalidTeams = structureValidations.filter((v) => !v.isValid);

  if (invalidTeams.length > 0) {
    invalidTeams.forEach((validation) => {
      errors.push(...(validation.errors || []));
    });
  }

  // Extract validated team data
  const validatedTeams = structureValidations
    .filter((v) => v.isValid)
    .map((v) => v.team);

  // Check for duplicates within the file
  const duplicateCheck = checkDuplicatesInArray(validatedTeams);

  if (duplicateCheck.hasDuplicates) {
    duplicateCheck.duplicates.forEach((dup) => {
      errors.push(
        `Duplicate team name '${dup.name}' found at positions ${dup.indices.map((i) => i + 1).join(' and ')}`,
      );
    });
  }

  // Check for conflicts with existing teams
  const conflictCheck = checkExistingConflicts(validatedTeams, existingTeams);

  if (conflictCheck.hasConflicts) {
    conflictCheck.conflicts.forEach((conflict) => {
      errors.push(
        `Team name '${conflict.name}' already exists in the system (position ${conflict.index + 1})`,
      );
    });
  }

  // Warnings for large batches
  if (teams.length > 10) {
    warnings.push(
      `Large batch: ${teams.length} teams. Consider uploading in smaller batches.`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
    warnings: warnings.length > 0 ? warnings : null,
    teams: validatedTeams,
    teamCount: teams.length,
    validCount: validatedTeams.length,
    invalidCount: invalidTeams.length,
  };
};

/**
 * Generate validation summary message
 * @param {Object} validationResult - Result from validateTeamsJSON
 * @returns {string} Human-readable summary
 */
export const getValidationSummary = (validationResult) => {
  if (validationResult.isValid) {
    return `✅ All ${validationResult.teamCount} team(s) are valid and ready to upload`;
  }

  const messages = [];

  messages.push(`❌ Validation failed for teams file:`);
  messages.push('');

  if (validationResult.errors) {
    messages.push('Errors:');
    validationResult.errors.forEach((err) => messages.push(`  • ${err}`));
  }

  if (validationResult.warnings) {
    messages.push('');
    messages.push('Warnings:');
    validationResult.warnings.forEach((warn) => messages.push(`  ⚠️ ${warn}`));
  }

  messages.push('');
  messages.push(
    `Summary: ${validationResult.validCount} valid, ${validationResult.invalidCount} invalid`,
  );

  return messages.join('\n');
};

/**
 * Validate team data before manual form submission
 * @param {Object} teamData - Team data from form
 * @param {Object} existingTeams - Existing teams from store
 * @param {string} editingTeamId - ID of team being edited (null if adding new)
 * @returns {Object} Validation result
 */
export const validateTeamFormData = (
  teamData,
  existingTeams = {},
  editingTeamId = null,
) => {
  const errors = {};

  // Validate name
  if (!isRequired(teamData.name)) {
    errors.name = VALIDATION_ERRORS.TEAM_NAME_REQUIRED;
  } else {
    const name = teamData.name.trim();

    if (name.length < MIN_TEAM_NAME_LENGTH) {
      errors.name = VALIDATION_ERRORS.TEAM_NAME_TOO_SHORT;
    } else if (name.length > MAX_TEAM_NAME_LENGTH) {
      errors.name = VALIDATION_ERRORS.TEAM_NAME_TOO_LONG;
    } else {
      // Check uniqueness (excluding current team if editing)
      const isDuplicate = Object.entries(existingTeams).some(
        ([teamId, team]) => {
          // Skip current team if editing
          if (editingTeamId && teamId === editingTeamId) {
            return false;
          }
          return team.name.trim().toLowerCase() === name.toLowerCase();
        },
      );

      if (isDuplicate) {
        errors.name = VALIDATION_ERRORS.TEAM_NAME_DUPLICATE;
      }
    }
  }

  // Validate participants
  if (!isRequired(teamData.participants)) {
    errors.participants = VALIDATION_ERRORS.PARTICIPANTS_REQUIRED;
  } else if (!isValidLength(teamData.participants, MIN_PARTICIPANTS_LENGTH)) {
    errors.participants = VALIDATION_ERRORS.PARTICIPANTS_TOO_SHORT;
  }

  // Validate contact
  if (!isRequired(teamData.contact)) {
    errors.contact = VALIDATION_ERRORS.CONTACT_REQUIRED;
  } else if (!isValidPhoneNumber(teamData.contact)) {
    errors.contact = VALIDATION_ERRORS.CONTACT_INVALID;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
};
