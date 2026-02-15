// src/constants/teamStates.js

/**
 * Team Status Constants
 * Defines all possible team statuses, UI mappings, and transition rules
 */

/**
 * Team status enumeration
 * @readonly
 * @enum {string}
 */
export const TEAM_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  ELIMINATED: 'eliminated',
  COMPLETED: 'completed',
};

/**
 * Team status metadata
 * Provides display labels, colors, and icons for UI rendering
 */
export const TEAM_STATUS_META = {
  [TEAM_STATUS.WAITING]: {
    label: 'Waiting',
    description: 'Team is in queue',
    color: 'gray',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-500/20',
    darkBgColor: 'dark:bg-gray-500/20',
    darkTextColor: 'dark:text-gray-400',
    icon: '⏳',
  },
  [TEAM_STATUS.ACTIVE]: {
    label: 'Playing',
    description: 'Team is currently on hot seat',
    color: 'blue',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500/20',
    darkBgColor: 'dark:bg-blue-500/20',
    darkTextColor: 'dark:text-blue-400',
    icon: '🎮',
  },
  [TEAM_STATUS.ELIMINATED]: {
    label: 'Eliminated',
    description: 'Team answered incorrectly',
    color: 'red',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600',
    borderColor: 'border-red-500/20',
    darkBgColor: 'dark:bg-red-500/20',
    darkTextColor: 'dark:text-red-400',
    icon: '❌',
  },
  [TEAM_STATUS.COMPLETED]: {
    label: 'Winner',
    description: 'Team completed all questions',
    color: 'green',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    borderColor: 'border-green-500/20',
    darkBgColor: 'dark:bg-green-500/20',
    darkTextColor: 'dark:text-green-400',
    icon: '🏆',
  },
};

/**
 * Valid team status transitions
 * Defines which status changes are allowed
 *
 * NOTE: Terminal states (completed/eliminated) can transition back to waiting
 * for game reset/uninitialize scenarios
 */
export const TEAM_STATUS_TRANSITIONS = {
  [TEAM_STATUS.WAITING]: [
    TEAM_STATUS.ACTIVE,
    TEAM_STATUS.COMPLETED, // ← Allow completion from waiting (Firebase sync edge case)
  ],
  [TEAM_STATUS.ACTIVE]: [
    TEAM_STATUS.ELIMINATED,
    TEAM_STATUS.COMPLETED,
    TEAM_STATUS.WAITING,
  ],
  [TEAM_STATUS.ELIMINATED]: [
    TEAM_STATUS.WAITING, // ← Allow reset to waiting (for game uninitialize)
  ],
  [TEAM_STATUS.COMPLETED]: [
    TEAM_STATUS.WAITING, // ← Allow reset to waiting (for game uninitialize)
  ],
};

/**
 * Check if a team status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Desired status
 * @returns {boolean} True if transition is allowed
 */
export const isValidTeamTransition = (fromStatus, toStatus) => {
  if (!TEAM_STATUS_TRANSITIONS[fromStatus]) {
    console.warn(`Invalid current team status: ${fromStatus}`);
    return false;
  }
  return TEAM_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
};

/**
 * Get metadata for a team status
 * @param {string} status - Team status
 * @returns {Object} Status metadata
 */
export const getTeamStatusMeta = (status) => {
  return TEAM_STATUS_META[status] || TEAM_STATUS_META[TEAM_STATUS.WAITING];
};

/**
 * Check if team status is valid
 * @param {string} status - Status to validate
 * @returns {boolean} True if status exists in TEAM_STATUS enum
 */
export const isValidTeamStatus = (status) => {
  return Object.values(TEAM_STATUS).includes(status);
};

/**
 * Default team status for new teams
 */
export const DEFAULT_TEAM_STATUS = TEAM_STATUS.WAITING;

/**
 * Lifeline types
 */
export const LIFELINE_TYPE = {
  PHONE_A_FRIEND: 'phoneAFriend',
  FIFTY_FIFTY: 'fiftyFifty',
};

/**
 * Default lifeline state (all available)
 */
export const DEFAULT_LIFELINES = {
  [LIFELINE_TYPE.PHONE_A_FRIEND]: true,
  [LIFELINE_TYPE.FIFTY_FIFTY]: true,
};
