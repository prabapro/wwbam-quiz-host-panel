// src/constants/defaultDatabase.js

/**
 * Default Database Structure
 * Based on initial-db-structure.json
 * Used for factory reset operations
 *
 * Imports from existing constant files to maintain single source of truth
 */

import { DEFAULT_PRIZE_STRUCTURE } from '@constants/prizeStructure';
import {
  MAX_TEAMS,
  QUESTIONS_PER_SET,
  DEFAULT_TIMER_ENABLED,
  DEFAULT_TIMER_DURATION_SECONDS,
  getDefaultDisplaySettings,
} from '@constants/config';
import { DEFAULT_GAME_STATUS as GAME_STATUS_DEFAULT } from '@constants/gameStates';
import { DEFAULT_LIFELINES_ENABLED } from '@constants/teamStates';

/**
 * Default game state structure
 * Uses GAME_STATUS_DEFAULT ('not-started') from gameStates.js
 */
export const DEFAULT_GAME_STATE = {
  currentTeamId: null,
  currentQuestionNumber: 0,
  currentQuestion: null,
  questionVisible: false,
  optionsVisible: false,
  answerRevealed: false,
  correctOption: null,
  gameStatus: GAME_STATUS_DEFAULT, // 'not-started'
  playQueue: [],
  questionSetAssignments: {},
  initializedAt: null,
  startedAt: null,
  lastUpdated: 0,
  selectedOption: null,
  optionWasCorrect: null,
  activeLifeline: null,
};

/**
 * Default prize structure
 * Re-exported from prizeStructure.js for convenience
 */
export { DEFAULT_PRIZE_STRUCTURE };

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  // Team configuration
  maxTeams: MAX_TEAMS,

  // Question configuration
  questionsPerTeam: QUESTIONS_PER_SET,

  // Lifeline configuration (from teamStates.js)
  lifelinesEnabled: DEFAULT_LIFELINES_ENABLED,

  // Display settings (from config.js)
  displaySettings: getDefaultDisplaySettings(),

  // Timer configuration (from config.js)
  timerEnabled: DEFAULT_TIMER_ENABLED,
  timerDuration: DEFAULT_TIMER_DURATION_SECONDS,
};

/**
 * Default allowed hosts structure
 * Initially empty - host UIDs must be added manually via Firebase Console
 */
export const DEFAULT_ALLOWED_HOSTS = {};

/**
 * Default question sets structure
 * Question sets will be stored here after upload
 */
export const DEFAULT_QUESTION_SETS = {};

/**
 * Get complete default database structure
 * Returns the full structure matching initial-db-structure.json
 */
export const getDefaultDatabaseStructure = () => {
  return {
    allowedHosts: DEFAULT_ALLOWED_HOSTS,
    questionSets: DEFAULT_QUESTION_SETS,
    gameState: DEFAULT_GAME_STATE,
    teams: {},
    prizeStructure: DEFAULT_PRIZE_STRUCTURE,
    config: DEFAULT_CONFIG,
  };
};
