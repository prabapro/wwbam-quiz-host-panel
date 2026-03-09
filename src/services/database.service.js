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
 */
const camelToKebab = (str) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
};

/**
 * Convert kebab-case to camelCase
 */
const kebabToCamel = (str) => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Recursively convert object keys from camelCase to kebab-case
 * Special handling for playQueue and questionSetAssignments to preserve team IDs
 */
export const convertKeysToKebab = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToKebab(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const PRESERVE_KEYS = ['questionSetAssignments', 'lifelinesAvailable'];

    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const kebabKey = camelToKebab(key);

        if (
          PRESERVE_KEYS.includes(key) &&
          typeof value === 'object' &&
          value !== null
        ) {
          const convertedInner = {};
          Object.entries(value).forEach(([innerKey, innerValue]) => {
            convertedInner[innerKey] = convertKeysToKebab(innerValue);
          });
          return [kebabKey, convertedInner];
        }

        return [kebabKey, convertKeysToKebab(value)];
      }),
    );
  }

  return obj;
};

/**
 * Recursively convert object keys from kebab-case to camelCase
 */
export const convertKeysToCamel = (obj) => {
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel);

  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        kebabToCamel(key),
        convertKeysToCamel(value),
      ]),
    );
  }

  return obj;
};

// ============================================================================
// QUESTION SET OPERATIONS
// ============================================================================

export const getAllQuestionSets = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.QUESTION_SETS));
    if (!snapshot.exists()) return null;

    const sets = snapshot.val();
    const convertedSets = {};
    Object.keys(sets).forEach((setId) => {
      convertedSets[setId] = convertKeysToCamel(sets[setId]);
    });
    return convertedSets;
  } catch (error) {
    console.error('Error fetching question sets:', error);
    throw error;
  }
};

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

export const saveQuestionSet = async (questionSet) => {
  try {
    const { setId } = questionSet;

    if (!setId) {
      return { success: false, error: 'Question set ID is required' };
    }

    const kebabData = convertKeysToKebab({
      ...questionSet,
      uploadedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });

    await set(ref(database, `${DB_PATHS.QUESTION_SETS}/${setId}`), kebabData);
    console.log(`✅ Question set saved: ${setId}`);
    return { success: true, setId };
  } catch (error) {
    console.error('Error saving question set:', error);
    return { success: false, error: error.message };
  }
};

export const updateQuestionSet = async (setId, updates) => {
  try {
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

export const getQuestionSetsMetadata = async () => {
  try {
    const allSets = await getAllQuestionSets();

    if (!allSets) return { totalSets: 0, setIds: [], sets: [] };

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
    return { totalSets: 0, setIds: [], sets: [] };
  }
};

export const onQuestionSetsChange = (callback) => {
  const questionSetsRef = ref(database, DB_PATHS.QUESTION_SETS);
  onValue(questionSetsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const questionSets = snapshot.val();
    const convertedSets = {};
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

export const getGameState = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.GAME_STATE));
    return snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
};

export const updateGameState = async (updates) => {
  try {
    const kebabUpdates = convertKeysToKebab(updates);

    const updatePath = {};
    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.GAME_STATE}/${key}`] = kebabUpdates[key];
    });

    updatePath[`${DB_PATHS.GAME_STATE}/last-updated`] = serverTimestamp();

    await update(ref(database), updatePath);
    console.log('✅ Game state updated');
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

export const setCurrentQuestion = async (question, questionNumber) => {
  try {
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
 * Lock selected answer for public display (deliberation state).
 *
 * Writes ONLY `selected-option` to Firebase so the display app shows the
 * option in amber ("thinking" state). Does NOT reveal the correct answer —
 * that only happens when the host explicitly confirms via confirmAnswer().
 *
 * @param {string} selectedOption - The option the team has chosen (A/B/C/D)
 * @returns {Promise<void>}
 */
export const lockAnswerSelection = async (selectedOption) => {
  try {
    await updateGameState({ selectedOption });
    console.log(
      `🔒 Answer locked for display: ${selectedOption} (pending host confirmation)`,
    );
  } catch (error) {
    console.error('Error locking answer selection:', error);
    throw error;
  }
};

/**
 * Clear a previously locked answer (host changed their mind during deliberation).
 *
 * Resets `selected-option` to null so the display returns to the default state.
 * Called when host clicks "Change Answer" during the locked phase.
 *
 * @returns {Promise<void>}
 */
export const clearLockedAnswer = async () => {
  try {
    await updateGameState({ selectedOption: null });
    console.log('↩️ Locked answer cleared — returning to selection phase');
  } catch (error) {
    console.error('Error clearing locked answer:', error);
    throw error;
  }
};

/**
 * Reveal correct answer — final step after host confirmation.
 *
 * @param {string} correctOption - Correct answer (A/B/C/D)
 * @param {string} selectedOption - Team's chosen answer (A/B/C/D)
 * @param {boolean} isCorrect - Whether the selection was correct
 * @returns {Promise<void>}
 */
export const revealAnswer = async (
  correctOption,
  selectedOption,
  isCorrect,
) => {
  try {
    await updateGameState({
      answerRevealed: true,
      correctOption,
      selectedOption,
      optionWasCorrect: isCorrect,
    });

    console.log(
      `✅ Answer revealed: ${correctOption} (Selected: ${selectedOption}, Correct: ${isCorrect})`,
    );
  } catch (error) {
    console.error('Error revealing answer:', error);
    throw error;
  }
};

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

export const onGameStateChange = (callback) => {
  const gameStateRef = ref(database, DB_PATHS.GAME_STATE);
  onValue(gameStateRef, (snapshot) => {
    const data = snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
    callback(data);
  });

  return () => off(gameStateRef);
};

// ============================================================================
// TEAM OPERATIONS
// ============================================================================

export const getTeams = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.TEAMS));
    if (!snapshot.exists()) return null;

    const teams = snapshot.val();
    const convertedTeams = {};
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
      'question-set-id': teamData.questionSetId || null,
      'current-question-index': 0,
      'lifelines-available': {
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

export const updateTeam = async (teamId, updates) => {
  try {
    const kebabUpdates = convertKeysToKebab(updates);
    const updatePath = {};
    Object.keys(kebabUpdates).forEach((key) => {
      updatePath[`${DB_PATHS.TEAMS}/${teamId}/${key}`] = kebabUpdates[key];
    });
    updatePath[`${DB_PATHS.TEAMS}/${teamId}/last-updated`] = serverTimestamp();

    await update(ref(database), updatePath);
    console.log('✅ Team updated:', teamId);
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId) => {
  try {
    await remove(ref(database, `${DB_PATHS.TEAMS}/${teamId}`));
    console.log('✅ Team deleted:', teamId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }
};

export const deleteAllTeams = async () => {
  try {
    await set(ref(database, DB_PATHS.TEAMS), {});
    console.log('✅ All teams deleted');
    return { success: true };
  } catch (error) {
    console.error('Error deleting all teams:', error);
    return { success: false, error: error.message };
  }
};

export const eliminateTeam = async (teamId) => {
  try {
    await updateTeam(teamId, { status: 'eliminated' });
    console.log('✅ Team eliminated:', teamId);
    return { success: true };
  } catch (error) {
    console.error('Error eliminating team:', error);
    return { success: false, error: error.message };
  }
};

export const onTeamsChange = (callback) => {
  const teamsRef = ref(database, DB_PATHS.TEAMS);
  onValue(teamsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback({});
      return;
    }

    const teams = snapshot.val();
    const convertedTeams = {};
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

export const getPrizeStructure = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.PRIZE_STRUCTURE));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching prize structure:', error);
    throw error;
  }
};

export const setPrizeStructure = async (prizes) => {
  try {
    await set(ref(database, DB_PATHS.PRIZE_STRUCTURE), prizes);
    console.log('✅ Prize structure saved');
    return { success: true };
  } catch (error) {
    console.error('Error saving prize structure:', error);
    return { success: false, error: error.message };
  }
};

export const onPrizeStructureChange = (callback) => {
  const prizeRef = ref(database, DB_PATHS.PRIZE_STRUCTURE);
  onValue(prizeRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(prizeRef);
};

// ============================================================================
// LIFELINE OPERATIONS
// ============================================================================

export const startLifelineTimer = async () => {
  try {
    await updateGameState({ lifelineTimerStartedAt: Date.now() });
    console.log('✅ Lifeline timer started');
  } catch (error) {
    console.error('Error starting lifeline timer:', error);
    throw error;
  }
};

export const clearLifelineTimer = async () => {
  try {
    await updateGameState({ lifelineTimerStartedAt: null });
    console.log('✅ Lifeline timer cleared');
  } catch (error) {
    console.error('Error clearing lifeline timer:', error);
    throw error;
  }
};

export const activateFiftyFiftyLifeline = async (
  teamId,
  filteredOptionsObj,
) => {
  try {
    const updates = {};

    // Write the trimmed options object so the display only shows the 2 remaining options
    updates['game-state/current-question/options'] = filteredOptionsObj;
    updates['game-state/active-lifeline'] = 'fifty-fifty';
    updates['game-state/last-updated'] = serverTimestamp();
    updates[`${DB_PATHS.TEAMS}/${teamId}/lifelines-available/fifty-fifty`] =
      false;
    updates[`${DB_PATHS.TEAMS}/${teamId}/last-updated`] = serverTimestamp();

    await update(ref(database), updates);
    console.log('✅ 50/50 lifeline activated:', {
      teamId,
      filteredOptions: filteredOptionsObj,
    });
  } catch (error) {
    console.error('Error activating 50/50 lifeline:', error);
    throw error;
  }
};

export const activatePhoneAFriendLifeline = async (teamId) => {
  try {
    const updates = {};
    updates['game-state/active-lifeline'] = 'phone-a-friend';
    updates['game-state/last-updated'] = serverTimestamp();
    updates[`${DB_PATHS.TEAMS}/${teamId}/lifelines-available/phone-a-friend`] =
      false;
    updates[`${DB_PATHS.TEAMS}/${teamId}/last-updated`] = serverTimestamp();

    await update(ref(database), updates);
    console.log('✅ Phone-a-Friend lifeline activated:', teamId);
  } catch (error) {
    console.error('Error activating Phone-a-Friend lifeline:', error);
    throw error;
  }
};

export const clearActiveLifeline = async () => {
  try {
    await updateGameState({ activeLifeline: null });
    console.log('✅ Active lifeline cleared');
  } catch (error) {
    console.error('Error clearing active lifeline:', error);
    throw error;
  }
};

// ============================================================================
// CONFIG OPERATIONS
// ============================================================================

export const getConfig = async () => {
  try {
    const snapshot = await get(ref(database, DB_PATHS.CONFIG));
    return snapshot.exists() ? convertKeysToCamel(snapshot.val()) : null;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
};

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

export const resetDatabaseToDefaults = async () => {
  try {
    const updates = {};

    const gameStateDefaults = convertKeysToKebab(DEFAULT_GAME_STATE);
    Object.keys(gameStateDefaults).forEach((key) => {
      updates[`${DB_PATHS.GAME_STATE}/${key}`] = gameStateDefaults[key];
    });

    updates[DB_PATHS.TEAMS] = {};
    updates[DB_PATHS.PRIZE_STRUCTURE] = DEFAULT_PRIZE_STRUCTURE;

    const configDefaults = convertKeysToKebab(DEFAULT_CONFIG);
    Object.keys(configDefaults).forEach((key) => {
      updates[`${DB_PATHS.CONFIG}/${key}`] = configDefaults[key];
    });

    updates[DB_PATHS.QUESTION_SETS] = {};

    await update(ref(database), updates);
    console.log('✅ Firebase database reset to factory defaults');
  } catch (error) {
    console.error('❌ Error resetting database to defaults:', error);
    throw error;
  }
};

// ============================================================================
// ATOMIC OPERATIONS
// ============================================================================

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
  lockAnswerSelection, // NEW — preview selected option on display (amber, deliberation)
  clearLockedAnswer, // NEW — undo lock if host changes mind
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
  eliminateTeam,
  onTeamsChange,

  // Prize Structure
  getPrizeStructure,
  setPrizeStructure,
  onPrizeStructureChange,

  // Config
  getConfig,
  updateConfig,

  // Lifeline Operations
  startLifelineTimer,
  clearLifelineTimer,
  activateFiftyFiftyLifeline,
  activatePhoneAFriendLifeline,
  clearActiveLifeline,

  // Factory Reset
  resetDatabaseToDefaults,

  // Atomic Operations
  atomicUpdate,
};

export default databaseService;
