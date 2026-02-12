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
import {
  DEFAULT_GAME_STATE,
  DEFAULT_PRIZE_STRUCTURE,
  DEFAULT_CONFIG,
} from '@constants/defaultDatabase';

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
// KEY CONVERSION UTILITIES
// ============================================================================

/**
 * Convert camelCase to kebab-case
 * Handles consecutive capitals correctly (e.g., phoneAFriend → phone-a-friend)
 * @param {string} str - camelCase string
 * @returns {string} kebab-case string
 */
const camelToKebab = (str) => {
  return (
    str
      // Insert hyphen before uppercase letter following lowercase/digit
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      // Insert hyphen before uppercase letter followed by lowercase (handles consecutive capitals)
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase()
  );
};

/**
 * Convert kebab-case to camelCase (both single and consecutive capitals. e.g., fifty-fifty → fiftyFifty, phone-a-friend → phoneAFriend)
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 */
const kebabToCamel = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

/**
 * Convert object keys from camelCase to kebab-case
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} Object with kebab-case keys
 */
const convertKeysToKebab = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result = {};
  Object.keys(obj).forEach((key) => {
    const kebabKey = camelToKebab(key);
    const value = obj[key];

    // Recursively convert nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[kebabKey] = convertKeysToKebab(value);
    } else {
      result[kebabKey] = value;
    }
  });

  return result;
};

/**
 * Convert object keys from kebab-case to camelCase
 * @param {Object} obj - Object with kebab-case keys
 * @returns {Object} Object with camelCase keys
 */
const convertKeysToCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result = {};
  Object.keys(obj).forEach((key) => {
    const camelKey = kebabToCamel(key);
    const value = obj[key];

    // Recursively convert nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = convertKeysToCamel(value);
    } else {
      result[camelKey] = value;
    }
  });

  return result;
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
    return snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
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
    const kebabUpdates = convertKeysToKebab(updates);
    const updatePath = {};

    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.GAME_STATE}/${key}`] = kebabUpdates[key];
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
      currentQuestion: questionData,
      currentQuestionNumber: questionNumber,
      questionVisible: true,
      optionsVisible: true,
      answerRevealed: false,
      correctOption: null,
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
      answerRevealed: true,
      correctOption: correctOption,
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
    const resetData = convertKeysToKebab({
      currentTeamId: null,
      currentQuestionNumber: 0,
      currentQuestion: null,
      questionVisible: false,
      optionsVisible: false,
      answerRevealed: false,
      correctOption: null,
      gameStatus: 'paused',
      lastUpdated: serverTimestamp(),
    });

    await set(ref(database, DB_PATHS.GAME_STATE), resetData);
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
    const data = snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
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
    if (!snapshot.exists()) return null;

    const teams = snapshot.val();
    const convertedTeams = {};

    // Convert each team's keys from kebab-case to camelCase
    Object.keys(teams).forEach((teamId) => {
      convertedTeams[teamId] = {
        id: teamId,
        ...convertKeysToCamel(teams[teamId]),
      };
    });

    return convertedTeams;
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
    return snapshot.exists()
      ? { id: teamId, ...convertKeysToCamel(snapshot.val()) }
      : null;
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
      participants: teamData.participants || '',
      contact: teamData.contact || '',
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
 * @param {Object} updates - Fields to update (camelCase)
 * @returns {Promise<void>}
 */
export const updateTeam = async (teamId, updates) => {
  try {
    // Convert camelCase updates to kebab-case
    const kebabUpdates = convertKeysToKebab(updates);

    const updatePath = {};
    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.TEAMS}/${teamId}/${key}`] = kebabUpdates[key];
    });

    // Add last-updated timestamp
    updatePath[`${DB_PATHS.TEAMS}/${teamId}/last-updated`] = serverTimestamp();

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
 * Delete all teams (for factory reset)
 * @returns {Promise<void>}
 */
export const deleteAllTeams = async () => {
  try {
    await set(ref(database, DB_PATHS.TEAMS), {});
    console.log('✅ All teams deleted from Firebase');
  } catch (error) {
    console.error('Error deleting all teams:', error);
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
      eliminatedAt: serverTimestamp(),
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
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const teams = snapshot.val();
    const convertedTeams = {};

    // Convert each team's keys from kebab-case to camelCase
    Object.keys(teams).forEach((teamId) => {
      convertedTeams[teamId] = {
        id: teamId,
        ...convertKeysToCamel(teams[teamId]),
      };
    });

    callback(convertedTeams);
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
    return snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
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
    const kebabUpdates = convertKeysToKebab(updates);
    await update(ref(database, DB_PATHS.CONFIG), kebabUpdates);
    console.log('✅ Config updated');
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
};

// ============================================================================
// FACTORY RESET OPERATIONS
// ============================================================================

/**
 * Reset entire database to factory defaults
 * Performs atomic update to set all nodes to default state
 * @returns {Promise<void>}
 */
export const resetDatabaseToDefaults = async () => {
  try {
    console.log('🔄 Starting factory reset of Firebase database...');

    // Build atomic multi-path update object
    const updates = {};

    // 1. Reset game-state to defaults (convert to kebab-case)
    const gameStateDefaults = convertKeysToKebab(DEFAULT_GAME_STATE);
    Object.keys(gameStateDefaults).forEach((key) => {
      updates[`${DB_PATHS.GAME_STATE}/${key}`] = gameStateDefaults[key];
    });

    // 2. Clear teams (set to empty object)
    updates[DB_PATHS.TEAMS] = {};

    // 3. Reset prize structure to defaults
    updates[DB_PATHS.PRIZE_STRUCTURE] = DEFAULT_PRIZE_STRUCTURE;

    // 4. Reset config to defaults (convert to kebab-case)
    const configDefaults = convertKeysToKebab(DEFAULT_CONFIG);
    Object.keys(configDefaults).forEach((key) => {
      updates[`${DB_PATHS.CONFIG}/${key}`] = configDefaults[key];
    });

    // Perform atomic update
    await update(ref(database), updates);

    console.log('✅ Firebase database reset to factory defaults');
  } catch (error) {
    console.error('❌ Error resetting database to defaults:', error);
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
  deleteAllTeams,
  useLifeline,
  eliminateTeam,
  onTeamsChange,

  // Prize Structure
  getPrizeStructure,
  setPrizeStructure,

  // Config
  getConfig,
  updateConfig,

  // Factory Reset
  resetDatabaseToDefaults,

  // Atomic Operations
  atomicUpdate,
};

export default databaseService;
