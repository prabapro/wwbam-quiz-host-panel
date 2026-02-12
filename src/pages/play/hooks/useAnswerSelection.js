// src/pages/Play/hooks/useAnswerSelection.js

/**
 * useAnswerSelection Hook
 *
 * Purpose: Manage answer selection, validation, and result handling
 *
 * Responsibilities:
 * - Track selected answer (A/B/C/D)
 * - Validate answer against correct answer from localStorage
 * - Handle answer locking (trigger validation)
 * - Manage validation result state
 * - Update team prize on correct answer
 * - Handle incorrect answer flow (lifeline offer or elimination)
 *
 * Answer Flow:
 * 1. Team announces answer verbally
 * 2. Host selects option (A/B/C/D) via AnswerPad
 * 3. Selected answer stored in local state (NOT synced to Firebase)
 * 4. Host clicks "Lock Answer"
 * 5. Hook validates against correct answer from localStorage
 * 6. If correct: Update prize, increment question, celebrate
 * 7. If incorrect: Check lifelines → offer or eliminate
 * 8. Sync result to Firebase (reveal answer, update team)
 *
 * Returns:
 * {
 *   // State
 *   selectedAnswer: string | null,     // Currently selected answer (A/B/C/D)
 *   validationResult: Object | null,   // { isCorrect: boolean, correctAnswer: string }
 *   isLocking: boolean,                // Lock operation in progress
 *
 *   // Actions
 *   selectAnswer: (option: string) => void,           // Select A/B/C/D
 *   clearSelection: () => void,                       // Clear selected answer
 *   lockAnswer: () => Promise<void>,                  // Validate and lock
 *   canLock: boolean,                                 // Can lock answer now
 * }
 *
 * Usage in Component:
 * const { selectedAnswer, selectAnswer, lockAnswer, canLock } = useAnswerSelection();
 *
 * selectAnswer('B');     // User clicks B button
 * await lockAnswer();    // Triggers validation against localStorage
 *
 * TODO: Implement full answer selection and validation logic
 * - Connect to useQuestionsStore for validation
 * - Connect to useGameStore for Firebase sync
 * - Handle prize calculation on correct answer
 * - Handle elimination/lifeline flow on incorrect answer
 * - Add confirmation for lock action
 * - Track and display validation result
 */

/**
 * @returns {Object} Answer selection state and actions
 */
export function useAnswerSelection() {
  // TODO: Implement hook logic

  return {
    // State
    selectedAnswer: null,
    validationResult: null,
    isLocking: false,
    canLock: false,

    // Actions
    selectAnswer: (option) => {
      console.log(
        '🚧 useAnswerSelection.selectAnswer not implemented:',
        option,
      );
    },
    clearSelection: () => {
      console.log('🚧 useAnswerSelection.clearSelection not implemented');
    },
    lockAnswer: async () => {
      console.log('🚧 useAnswerSelection.lockAnswer not implemented');
    },
  };
}
