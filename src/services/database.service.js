// src/services/database.service.js

import {
  ref,
  set,
  update,
  get,
  remove,
  onValue,
  off,
  serverTimestamp,
  push,
} from 'firebase/database';
import { database } from '@config/firebase';

/**
 * Database Service
 * Handles all Firebase Realtime Database operations
 * Follows the Quiz Competition Database Architecture
 */

// ============================================================================
// DATABASE PATHS (following kebab-case convention from architecture doc)
// ============================================================================

export const DB_PATHS = {
  GAME_STATE: 'game-state',
  TEAMS: 'teams',
  PRIZE_STRUCTURE: 'prize-structure',
  CONFIG: 'config',
};

// ============================================================================
// GAME STATE OPERATIONS
// ============================================================================

/**
 * Get current game state
 * @returns {Promise<Object|null>} Game state object or null
 */
export const getGameState = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.GAME_STATE));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
};

/**
 * Update game state (atomic updates)
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export const updateGameState = async (updates) => {
  try {
    const updatePath = {};
    Object.keys(updates).forEach((key) => {
      updatePath[`${DB_PATHS.GAME_STATE}/${key}`] = updates[key];
    });

    // Add last-updated timestamp
    updatePath[`${DB_PATHS.GAME_STATE}/last-updated`] = serverTimestamp();

    await update(ref(database), updatePath);
    console.log('✅ Game state updated:', updates);
  } catch (error) {
    console.error('❌ Error updating game state:', error);
    throw error;
  }
};

/**
 * Set current question
 * @param {Object} questionData - Question object (without correct answer)
 * @param {number} questionNumber - Question number (1-20)
 * @returns {Promise<void>}
 */
export const setCurrentQuestion = async (questionData, questionNumber) => {
  try {
    await updateGameState({
      'current-question': questionData,
      'current-question-number': questionNumber,
      'question-visible': true,
      'options-visible': true,
      'answer-revealed': false,
      'correct-option': null,
    });
  } catch (error) {
    console.error('Error setting current question:', error);
    throw error;
  }
};

/**
 * Reveal answer
 * @param {string} correctOption - Correct option letter (A/B/C/D)
 * @returns {Promise<void>}
 */
export const revealAnswer = async (correctOption) => {
  try {
    await updateGameState({
      'answer-revealed': true,
      'correct-option': correctOption,
    });
  } catch (error) {
    console.error('Error revealing answer:', error);
    throw error;
  }
};

/**
 * Reset game state (for new game)
 * @returns {Promise<void>}
 */
export const resetGameState = async () => {
  try {
    await set(ref(database, DB_PATHS.GAME_STATE), {
      'current-team-id': null,
      'current-question-number': 0,
      'current-question': null,
      'question-visible': false,
      'options-visible': false,
      'answer-revealed': false,
      'correct-option': null,
      'game-status': 'paused',
      'last-updated': serverTimestamp(),
    });
    console.log('✅ Game state reset');
  } catch (error) {
    console.error('Error resetting game state:', error);
    throw error;
  }
};

/**
 * Listen to game state changes
 * @param {Function} callback - Callback function receiving game state
 * @returns {Function} Unsubscribe function
 */
export const onGameStateChange = (callback) => {
  const gameStateRef = ref(database, DB_PATHS.GAME_STATE);
  onValue(gameStateRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });

  // Return unsubscribe function
  return () => off(gameStateRef);
};

// ============================================================================
// TEAM OPERATIONS
// ============================================================================

/**
 * Get all teams
 * @returns {Promise<Object|null>} Teams object or null
 */
export const getTeams = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.TEAMS));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

/**
 * Get single team by ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Object|null>} Team object or null
 */
export const getTeam = async (teamId) => {
  try {
    const snapshot = await get(ref(database, `${DB_PATHS.TEAMS}/${teamId}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
};

/**
 * Create new team
 * @param {Object} teamData - Team data
 * @returns {Promise<string>} New team ID
 */
export const createTeam = async (teamData) => {
  try {
    const newTeamRef = push(ref(database, DB_PATHS.TEAMS));
    const teamId = newTeamRef.key;

    const team = {
      name: teamData.name,
      status: 'waiting',
      'current-prize': 0,
      'question-set-id': teamData.questionSetId || `set-${teamId}`,
      'current-question-index': 0,
      lifelines: {
        'phone-a-friend': true,
        'fifty-fifty': true,
      },
      'questions-answered': 0,
      'created-at': serverTimestamp(),
    };

    await set(newTeamRef, team);
    console.log('✅ Team created:', teamId);
    return teamId;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

/**
 * Update team data
 * @param {string} teamId - Team ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateTeam = async (teamId, updates) => {
  try {
    const updatePath = {};
    Object.keys(updates).forEach((key) => {
      updatePath[`${DB_PATHS.TEAMS}/${teamId}/${key}`] = updates[key];
    });

    await update(ref(database), updatePath);
    console.log('✅ Team updated:', teamId);
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

/**
 * Delete team
 * @param {string} teamId - Team ID
 * @returns {Promise<void>}
 */
export const deleteTeam = async (teamId) => {
  try {
    await remove(ref(database, `${DB_PATHS.TEAMS}/${teamId}`));
    console.log('✅ Team deleted:', teamId);
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

/**
 * Use lifeline
 * @param {string} teamId - Team ID
 * @param {string} lifelineType - 'phone-a-friend' or 'fifty-fifty'
 * @returns {Promise<void>}
 */
export const useLifeline = async (teamId, lifelineType) => {
  try {
    await update(ref(database, `${DB_PATHS.TEAMS}/${teamId}/lifelines`), {
      [lifelineType]: false,
    });
    console.log('✅ Lifeline used:', lifelineType);
  } catch (error) {
    console.error('Error using lifeline:', error);
    throw error;
  }
};

/**
 * Eliminate team
 * @param {string} teamId - Team ID
 * @returns {Promise<void>}
 */
export const eliminateTeam = async (teamId) => {
  try {
    await updateTeam(teamId, {
      status: 'eliminated',
      'eliminated-at': serverTimestamp(),
    });
  } catch (error) {
    console.error('Error eliminating team:', error);
    throw error;
  }
};

/**
 * Listen to teams changes
 * @param {Function} callback - Callback function receiving teams data
 * @returns {Function} Unsubscribe function
 */
export const onTeamsChange = (callback) => {
  const teamsRef = ref(database, DB_PATHS.TEAMS);
  onValue(teamsRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });

  return () => off(teamsRef);
};

// ============================================================================
// PRIZE STRUCTURE OPERATIONS
// ============================================================================

/**
 * Get prize structure
 * @returns {Promise<Array|null>} Prize array or null
 */
export const getPrizeStructure = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.PRIZE_STRUCTURE));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching prize structure:', error);
    throw error;
  }
};

/**
 * Set prize structure
 * @param {Array<number>} prizes - Array of prize values
 * @returns {Promise<void>}
 */
export const setPrizeStructure = async (prizes) => {
  try {
    await set(ref(database, DB_PATHS.PRIZE_STRUCTURE), prizes);
    console.log('✅ Prize structure set');
  } catch (error) {
    console.error('Error setting prize structure:', error);
    throw error;
  }
};

// ============================================================================
// CONFIG OPERATIONS
// ============================================================================

/**
 * Get game configuration
 * @returns {Promise<Object|null>} Config object or null
 */
export const getConfig = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.CONFIG));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
};

/**
 * Update configuration
 * @param {Object} updates - Config fields to update
 * @returns {Promise<void>}
 */
export const updateConfig = async (updates) => {
  try {
    await update(ref(database, DB_PATHS.CONFIG), updates);
    console.log('✅ Config updated');
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
};

// ============================================================================
// MULTI-PATH ATOMIC UPDATES
// ============================================================================

/**
 * Perform atomic multi-path update
 * Example: Update game state and team data simultaneously
 * @param {Object} updates - Object with paths as keys
 * @returns {Promise<void>}
 */
export const atomicUpdate = async (updates) => {
  try {
    await update(ref(database), updates);
    console.log('✅ Atomic update completed');
  } catch (error) {
    console.error('Error in atomic update:', error);
    throw error;
  }
};

// ============================================================================
// EXPORT ALL DATABASE OPERATIONS
// ============================================================================

export const databaseService = {
  // Game State
  getGameState,
  updateGameState,
  setCurrentQuestion,
  revealAnswer,
  resetGameState,
  onGameStateChange,

  // Teams
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  useLifeline,
  eliminateTeam,
  onTeamsChange,

  // Prize Structure
  getPrizeStructure,
  setPrizeStructure,

  // Config
  getConfig,
  updateConfig,

  // Atomic Operations
  atomicUpdate,
};

export default databaseService;
