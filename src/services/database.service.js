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
  ALLOWED_HOSTS: 'allowed-hosts',
  QUESTION_SETS: 'question-sets',
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
 * Convert kebab-case to camelCase
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 */
const kebabToCamel = (str) => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Recursively convert object keys from camelCase to kebab-case
 * @param {Object|Array|*} obj - Object to convert
 * @returns {Object|Array|*} Object with kebab-case keys
 */
const convertKeysToKebab = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToKebab);

  const converted = {};
  Object.keys(obj).forEach((key) => {
    const kebabKey = camelToKebab(key);
    converted[kebabKey] = convertKeysToKebab(obj[key]);
  });
  return converted;
};

/**
 * Recursively convert object keys from kebab-case to camelCase
 * @param {Object|Array|*} obj - Object to convert
 * @returns {Object|Array|*} Object with camelCase keys
 */
const convertKeysToCamel = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel);

  const converted = {};
  Object.keys(obj).forEach((key) => {
    const camelKey = kebabToCamel(key);
    converted[camelKey] = convertKeysToCamel(obj[key]);
  });
  return converted;
};

// ============================================================================
// QUESTION SETS OPERATIONS
// ============================================================================

/**
 * Get all question sets
 * @returns {Promise<Object|null>} Question sets object or null
 */
export const getAllQuestionSets = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.QUESTION_SETS));
    if (!snapshot.exists()) return null;

    const questionSets = snapshot.val();
    const convertedSets = {};

    // Convert each set's keys from kebab-case to camelCase
    Object.keys(questionSets).forEach((setId) => {
      convertedSets[setId] = convertKeysToCamel(questionSets[setId]);
    });

    return convertedSets;
  } catch (error) {
    console.error('Error fetching question sets:', error);
    throw error;
  }
};

/**
 * Get single question set by ID
 * @param {string} setId - Question set ID
 * @returns {Promise<Object|null>} Question set object or null
 */
export const getQuestionSet = async (setId) => {
  try {
    const snapshot = await get(
      ref(database, `${DB_PATHS.QUESTION_SETS}/${setId}`),
    );
    return snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
  } catch (error) {
    console.error('Error fetching question set:', error);
    throw error;
  }
};

/**
 * Save question set to Firebase
 * @param {Object} questionSet - Question set data
 * @returns {Promise<{ success: boolean, setId?: string, error?: string }>}
 */
export const saveQuestionSet = async (questionSet) => {
  try {
    const { setId } = questionSet;

    if (!setId) {
      return { success: false, error: 'Question set ID is required' };
    }

    // Convert camelCase to kebab-case for Firebase
    const kebabQuestionSet = convertKeysToKebab({
      ...questionSet,
      uploadedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });

    await set(
      ref(database, `${DB_PATHS.QUESTION_SETS}/${setId}`),
      kebabQuestionSet,
    );

    console.log(`✅ Question set saved to Firebase: ${setId}`);
    return { success: true, setId };
  } catch (error) {
    console.error('Error saving question set:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update question set
 * @param {string} setId - Question set ID
 * @param {Object} updates - Fields to update (camelCase)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const updateQuestionSet = async (setId, updates) => {
  try {
    // Convert camelCase updates to kebab-case
    const kebabUpdates = convertKeysToKebab({
      ...updates,
      lastModified: serverTimestamp(),
    });

    const updatePath = {};
    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.QUESTION_SETS}/${setId}/${key}`] =
        kebabUpdates[key];
    });

    await update(ref(database), updatePath);
    console.log('✅ Question set updated:', setId);
    return { success: true };
  } catch (error) {
    console.error('Error updating question set:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete question set
 * @param {string} setId - Question set ID
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const deleteQuestionSet = async (setId) => {
  try {
    await remove(ref(database, `${DB_PATHS.QUESTION_SETS}/${setId}`));
    console.log('✅ Question set deleted:', setId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting question set:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if question set exists
 * @param {string} setId - Question set ID
 * @returns {Promise<boolean>}
 */
export const questionSetExists = async (setId) => {
  try {
    const snapshot = await get(
      ref(database, `${DB_PATHS.QUESTION_SETS}/${setId}`),
    );
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking question set existence:', error);
    return false;
  }
};

/**
 * Get question sets metadata (without full question data)
 * @returns {Promise<Object>}
 */
export const getQuestionSetsMetadata = async () => {
  try {
    const allSets = await getAllQuestionSets();

    if (!allSets) {
      return {
        totalSets: 0,
        setIds: [],
        sets: [],
      };
    }

    const setIds = Object.keys(allSets);

    return {
      totalSets: setIds.length,
      setIds,
      sets: setIds.map((id) => ({
        setId: id,
        setName: allSets[id].setName,
        totalQuestions: Array.isArray(allSets[id].questions)
          ? allSets[id].questions.length
          : 0,
        uploadedAt: allSets[id].uploadedAt,
        lastModified: allSets[id].lastModified,
      })),
    };
  } catch (error) {
    console.error('Failed to get question sets metadata:', error);
    return {
      totalSets: 0,
      setIds: [],
      sets: [],
    };
  }
};

/**
 * Listen to question sets changes
 * @param {Function} callback - Callback function receiving question sets data
 * @returns {Function} Unsubscribe function
 */
export const onQuestionSetsChange = (callback) => {
  const questionSetsRef = ref(database, DB_PATHS.QUESTION_SETS);
  onValue(questionSetsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const questionSets = snapshot.val();
    const convertedSets = {};

    // Convert each set's keys from kebab-case to camelCase
    Object.keys(questionSets).forEach((setId) => {
      convertedSets[setId] = convertKeysToCamel(questionSets[setId]);
    });

    callback(convertedSets);
  });

  return () => off(questionSetsRef);
};

// ============================================================================
// GAME STATE OPERATIONS
// ============================================================================

/**
 * Get game state
 * @returns {Promise<Object|null>} Game state or null
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
 * Update game state
 * @param {Object} updates - Fields to update (camelCase)
 * @returns {Promise<void>}
 */
export const updateGameState = async (updates) => {
  try {
    // Convert camelCase updates to kebab-case
    const kebabUpdates = convertKeysToKebab(updates);

    const updatePath = {};
    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.GAME_STATE}/${key}`] = kebabUpdates[key];
    });

    // Add last-updated timestamp
    updatePath[`${DB_PATHS.GAME_STATE}/last-updated`] = serverTimestamp();

    await update(ref(database), updatePath);
    console.log('✅ Game state updated');
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

/**
 * Set current question (without correct answer for public display)
 * @param {Object} question - Question data
 * @param {number} questionNumber - Question number (1-20)
 * @returns {Promise<void>}
 */
export const setCurrentQuestion = async (question, questionNumber) => {
  try {
    // Remove correct answer before saving to Firebase
    // eslint-disable-next-line no-unused-vars
    const { correctAnswer, ...publicQuestion } = question;

    await updateGameState({
      currentQuestion: publicQuestion,
      currentQuestionNumber: questionNumber,
      questionVisible: true,
      optionsVisible: true,
      answerRevealed: false,
      correctOption: null,
    });

    console.log(`✅ Question ${questionNumber} pushed to display (no answer)`);
  } catch (error) {
    console.error('Error setting current question:', error);
    throw error;
  }
};

/**
 * Reveal correct answer
 * @param {string} correctOption - Correct answer (A/B/C/D)
 * @returns {Promise<void>}
 */
export const revealAnswer = async (correctOption) => {
  try {
    await updateGameState({
      answerRevealed: true,
      correctOption,
    });

    console.log(`✅ Answer revealed: ${correctOption}`);
  } catch (error) {
    console.error('Error revealing answer:', error);
    throw error;
  }
};

/**
 * Reset game state to defaults
 * @returns {Promise<void>}
 */
export const resetGameState = async () => {
  try {
    const kebabDefaults = convertKeysToKebab(DEFAULT_GAME_STATE);
    await set(ref(database, DB_PATHS.GAME_STATE), kebabDefaults);
    console.log('✅ Game state reset to defaults');
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
 * @param {Object} updates - Config updates (camelCase)
 * @returns {Promise<void>}
 */
export const updateConfig = async (updates) => {
  try {
    const kebabUpdates = convertKeysToKebab(updates);

    const updatePath = {};
    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.CONFIG}/${key}`] = kebabUpdates[key];
    });

    await update(ref(database), updatePath);
    console.log('✅ Config updated');
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
};

// ============================================================================
// FACTORY RESET
// ============================================================================

/**
 * Reset entire database to defaults (use with caution!)
 * @returns {Promise<void>}
 */
export const resetDatabaseToDefaults = async () => {
  try {
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

    // NOTE: We do NOT clear question-sets or allowed-hosts during factory reset
    // These should be preserved across resets

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
  // Question Sets
  getAllQuestionSets,
  getQuestionSet,
  saveQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  questionSetExists,
  getQuestionSetsMetadata,
  onQuestionSetsChange,

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
