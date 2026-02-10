// src/utils/gameInitialization.js

/**
 * Game Initialization Utilities
 * Handles team shuffling, question set assignment, and validation
 */

/**
 * Fisher-Yates shuffle algorithm
 * Randomly shuffles an array in-place with uniform distribution
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (same reference, modified in-place)
 */
export const shuffleArray = (array) => {
  const shuffled = [...array]; // Create copy to avoid mutating original

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

/**
 * Validate if game can be initialized
 * @param {Array} teams - Array of team objects
 * @param {Array} questionSets - Array of question set metadata objects
 * @returns {Object} Validation result with success flag and errors
 */
export const validateCanInitialize = (teams, questionSets) => {
  const errors = [];

  // Check teams
  if (!teams || teams.length === 0) {
    errors.push('At least 1 team is required to initialize the game');
  }

  // Check question sets
  if (!questionSets || questionSets.length === 0) {
    errors.push('At least 1 question set is required to initialize the game');
  }

  // Check sufficient question sets for teams
  if (teams && questionSets && questionSets.length < teams.length) {
    errors.push(
      `Insufficient question sets: Need ${teams.length} sets for ${teams.length} teams (only ${questionSets.length} available)`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Assign question sets to teams randomly
 * Each team gets a unique question set (1:1 mapping)
 * @param {Array} teams - Array of team objects with id property
 * @param {Array} questionSets - Array of question set metadata with setId property
 * @returns {Object} Question set assignments { teamId: setId }
 */
export const assignQuestionSetsToTeams = (teams, questionSets) => {
  if (!teams || !questionSets || teams.length === 0) {
    return {};
  }

  // Shuffle question sets for random assignment
  const shuffledSets = shuffleArray(questionSets);

  // Create assignments object
  const assignments = {};

  teams.forEach((team, index) => {
    // Assign question set by index (already shuffled)
    const assignedSet = shuffledSets[index];
    assignments[team.id] = assignedSet.setId;
  });

  return assignments;
};

/**
 * Generate complete play queue with team order and question set assignments
 * @param {Array} teams - Array of team objects
 * @param {Array} questionSets - Array of question set metadata
 * @returns {Object} Complete initialization data
 */
export const generatePlayQueue = (teams, questionSets) => {
  // Validate first
  const validation = validateCanInitialize(teams, questionSets);

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      playQueue: [],
      questionSetAssignments: {},
    };
  }

  // Shuffle teams to create random play order
  const shuffledTeams = shuffleArray(teams);

  // Create play queue (array of team IDs in play order)
  const playQueue = shuffledTeams.map((team) => team.id);

  // Assign question sets randomly
  const questionSetAssignments = assignQuestionSetsToTeams(
    shuffledTeams,
    questionSets,
  );

  console.log('🎲 Play queue generated:', {
    teams: playQueue.length,
    assignments: Object.keys(questionSetAssignments).length,
  });

  return {
    success: true,
    playQueue,
    questionSetAssignments,
    errors: null,
  };
};

/**
 * Get play queue preview data for display
 * Combines team data with assigned question set names and participants
 * @param {Array} playQueue - Array of team IDs in play order
 * @param {Object} questionSetAssignments - { teamId: setId }
 * @param {Object} teamsObject - Teams object { teamId: teamData }
 * @param {Array} questionSetsMetadata - Array of question set metadata
 * @returns {Array} Array of preview items with team and question set info
 */
export const getPlayQueuePreview = (
  playQueue,
  questionSetAssignments,
  teamsObject,
  questionSetsMetadata,
) => {
  if (!playQueue || playQueue.length === 0) {
    return [];
  }

  return playQueue.map((teamId, index) => {
    const team = teamsObject[teamId];
    const assignedSetId = questionSetAssignments[teamId];
    const questionSet = questionSetsMetadata.find(
      (set) => set.setId === assignedSetId,
    );

    return {
      position: index + 1, // 1-indexed for display
      teamId,
      teamName: team?.name || 'Unknown Team',
      teamParticipants: team?.participants || '',
      questionSetId: assignedSetId || null,
      questionSetName: questionSet?.setName || 'Unknown Set',
    };
  });
};

/**
 * Validate play queue data structure
 * @param {Array} playQueue - Array of team IDs
 * @param {Object} questionSetAssignments - { teamId: setId }
 * @returns {Object} Validation result
 */
export const validatePlayQueueData = (playQueue, questionSetAssignments) => {
  const errors = [];

  // Check play queue
  if (!Array.isArray(playQueue)) {
    errors.push('Play queue must be an array');
  } else if (playQueue.length === 0) {
    errors.push('Play queue cannot be empty');
  }

  // Check question set assignments
  if (!questionSetAssignments || typeof questionSetAssignments !== 'object') {
    errors.push('Question set assignments must be an object');
  } else if (Object.keys(questionSetAssignments).length === 0) {
    errors.push('Question set assignments cannot be empty');
  }

  // Check consistency
  if (playQueue && questionSetAssignments) {
    const missingAssignments = playQueue.filter(
      (teamId) => !questionSetAssignments[teamId],
    );

    if (missingAssignments.length > 0) {
      errors.push(
        `${missingAssignments.length} team(s) missing question set assignments`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};
