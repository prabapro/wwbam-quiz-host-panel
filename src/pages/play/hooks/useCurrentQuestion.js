// src/pages/play/hooks/useCurrentQuestion.js

/**
 * useCurrentQuestion Hook
 *
 * Purpose: Manage current question state and visibility logic
 *
 * Responsibilities:
 * - Load question from localStorage (with correct answer)
 * - Push question to Firebase (without correct answer)
 * - Manage question visibility flags (questionVisible, optionsVisible)
 * - Handle question state transitions
 * - Track question loading and error states
 *
 * Returns:
 * {
 *   // State
 *   question: Object | null,           // Current question data (host view with correct answer)
 *   isLoading: boolean,                // Loading state
 *   error: string | null,              // Error message
 *   isVisible: boolean,                // Is question visible to public
 *
 *   // Actions
 *   loadQuestion: (questionNumber) => Promise<void>,  // Load from localStorage
 *   showQuestion: () => Promise<void>,                // Push to Firebase
 *   hideQuestion: () => Promise<void>,                // Hide from public
 *   clearQuestion: () => void,                        // Clear current question
 * }
 *
 * Usage in Component:
 * const { question, loadQuestion, showQuestion } = useCurrentQuestion();
 *
 * await loadQuestion(5);  // Loads Q5 from localStorage
 * await showQuestion();   // Pushes to Firebase (no correct answer)
 *
 * TODO: Implement full question lifecycle management
 * - Connect to useQuestionsStore for localStorage operations
 * - Connect to useGameStore for Firebase sync
 * - Handle loading and error states
 * - Validate question data before operations
 * - Add retry logic for failed operations
 */

/**
 * @returns {Object} Question state and actions
 */
export function useCurrentQuestion() {
  // TODO: Implement hook logic

  return {
    // State
    question: null,
    isLoading: false,
    error: null,
    isVisible: false,

    // Actions
    loadQuestion: async (questionNumber) => {
      console.log(
        '🚧 useCurrentQuestion.loadQuestion not implemented:',
        questionNumber,
      );
    },
    showQuestion: async () => {
      console.log('🚧 useCurrentQuestion.showQuestion not implemented');
    },
    hideQuestion: async () => {
      console.log('🚧 useCurrentQuestion.hideQuestion not implemented');
    },
    clearQuestion: () => {
      console.log('🚧 useCurrentQuestion.clearQuestion not implemented');
    },
  };
}
