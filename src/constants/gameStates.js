// src/constants/gameStates.js

/**
 * Game State Constants
 * Defines all possible game states, transitions, and metadata
 */

/**
 * Game state enumeration
 * @readonly
 * @enum {string}
 */
export const GAME_STATUS = {
  NOT_STARTED: 'not-started',
  INITIALIZED: 'initialized',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

/**
 * Game state metadata
 * Provides display labels, descriptions, and colors for each state
 */
export const GAME_STATUS_META = {
  [GAME_STATUS.NOT_STARTED]: {
    label: 'Not Started',
    description: 'Game has not been initialized',
    color: 'gray',
    icon: '⏹️',
  },
  [GAME_STATUS.INITIALIZED]: {
    label: 'Initialized',
    description: 'Game is ready to start',
    color: 'blue',
    icon: '🎯',
  },
  [GAME_STATUS.ACTIVE]: {
    label: 'Active',
    description: 'Game is currently in progress',
    color: 'green',
    icon: '▶️',
  },
  [GAME_STATUS.PAUSED]: {
    label: 'Paused',
    description: 'Game is temporarily paused',
    color: 'yellow',
    icon: '⏸️',
  },
  [GAME_STATUS.COMPLETED]: {
    label: 'Completed',
    description: 'Game has finished',
    color: 'purple',
    icon: '🏁',
  },
};

/**
 * Valid state transitions
 * Defines which state changes are allowed
 */
export const GAME_STATE_TRANSITIONS = {
  [GAME_STATUS.NOT_STARTED]: [GAME_STATUS.INITIALIZED],
  [GAME_STATUS.INITIALIZED]: [GAME_STATUS.ACTIVE, GAME_STATUS.NOT_STARTED],
  [GAME_STATUS.ACTIVE]: [GAME_STATUS.PAUSED, GAME_STATUS.COMPLETED],
  [GAME_STATUS.PAUSED]: [GAME_STATUS.ACTIVE, GAME_STATUS.COMPLETED],
  [GAME_STATUS.COMPLETED]: [GAME_STATUS.NOT_STARTED],
};

/**
 * Check if a state transition is valid
 * @param {string} fromState - Current state
 * @param {string} toState - Desired state
 * @returns {boolean} True if transition is allowed
 */
export const isValidTransition = (fromState, toState) => {
  if (!GAME_STATE_TRANSITIONS[fromState]) {
    console.warn(`Invalid current state: ${fromState}`);
    return false;
  }
  return GAME_STATE_TRANSITIONS[fromState].includes(toState);
};

/**
 * Get metadata for a game state
 * @param {string} state - Game state
 * @returns {Object} State metadata
 */
export const getGameStateMeta = (state) => {
  return GAME_STATUS_META[state] || GAME_STATUS_META[GAME_STATUS.NOT_STARTED];
};

/**
 * Check if game state is valid
 * @param {string} state - State to validate
 * @returns {boolean} True if state is valid
 */
export const isValidGameState = (state) => {
  return Object.values(GAME_STATUS).includes(state);
};

/**
 * Get all valid next states from current state
 * @param {string} currentState - Current game state
 * @returns {string[]} Array of valid next states
 */
export const getValidNextStates = (currentState) => {
  return GAME_STATE_TRANSITIONS[currentState] || [];
};

/**
 * Default game state
 */
export const DEFAULT_GAME_STATUS = GAME_STATUS.NOT_STARTED;
