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
 */
export const TEAM_STATUS_TRANSITIONS = {
  [TEAM_STATUS.WAITING]: [TEAM_STATUS.ACTIVE],
  [TEAM_STATUS.ACTIVE]: [
    TEAM_STATUS.ELIMINATED,
    TEAM_STATUS.COMPLETED,
    TEAM_STATUS.WAITING,
  ],
  [TEAM_STATUS.ELIMINATED]: [], // Terminal state
  [TEAM_STATUS.COMPLETED]: [], // Terminal state
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
 * @returns {boolean} True if status is valid
 */
export const isValidTeamStatus = (status) => {
  return Object.values(TEAM_STATUS).includes(status);
};

/**
 * Check if team status is terminal (cannot transition)
 * @param {string} status - Team status
 * @returns {boolean} True if status is terminal
 */
export const isTerminalStatus = (status) => {
  return (
    status === TEAM_STATUS.ELIMINATED || status === TEAM_STATUS.COMPLETED
  );
};

/**
 * Get all valid next statuses from current status
 * @param {string} currentStatus - Current team status
 * @returns {string[]} Array of valid next statuses
 */
export const getValidNextStatuses = (currentStatus) => {
  return TEAM_STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Default team status
 */
export const DEFAULT_TEAM_STATUS = TEAM_STATUS.WAITING;

/**
 * Lifeline types
 * @readonly
 * @enum {string}
 */
export const LIFELINE_TYPE = {
  PHONE_A_FRIEND: 'phone-a-friend',
  FIFTY_FIFTY: 'fifty-fifty',
};

/**
 * Lifeline metadata
 */
export const LIFELINE_META = {
  [LIFELINE_TYPE.PHONE_A_FRIEND]: {
    label: 'Phone a Friend',
    icon: '📞',
    description: 'Call someone for help (3 minutes)',
  },
  [LIFELINE_TYPE.FIFTY_FIFTY]: {
    label: '50/50',
    icon: '✂️',
    description: 'Remove two incorrect answers',
  },
};

/**
 * Get lifeline metadata
 * @param {string} lifelineType - Lifeline type
 * @returns {Object} Lifeline metadata
 */
export const getLifelineMeta = (lifelineType) => {
  return LIFELINE_META[lifelineType];
};
