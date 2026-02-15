// src/pages/play/hooks/useCurrentQuestion.js

import { useState } from 'react';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useGameStore } from '@stores/useGameStore';
import { databaseService } from '@services/database.service';

/**
 * useCurrentQuestion Hook
 *
 * Purpose: Manage current question state and visibility logic
 *
 * Responsibilities:
 * - Load question from question-sets (with correct answer for host ONLY)
 * - Push question to game-state Firebase (without correct answer when displaying)
 * - Manage question visibility flags (questionVisible, optionsVisible)
 * - Handle question state transitions
 * - Track question loading and error states
 *
 * Flow:
 * 1. loadQuestion() - Loads from question-sets WITH answer, stores LOCALLY only (host view)
 * 2. showQuestion() - Pushes to game-state WITHOUT answer, sets visibility=true (public can see)
 * 3. revealAnswer() - Pushes correct answer to game-state (public can see answer)
 *
 * Security Model:
 * - question-sets node: Contains answers, only readable by authenticated hosts
 * - game-state node: Public readable, but answers only added when explicitly revealed
 * - Host always sees answer locally from question-sets
 * - Public only sees answer after revealAnswer() is called
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
 *   loadQuestion: (questionNumber) => Promise<void>,  // Load from question-sets (LOCAL ONLY)
 *   showQuestion: () => Promise<void>,                // Push to game-state & set visible
 *   hideQuestion: () => Promise<void>,                // Hide from public
 *   clearQuestion: () => void,                        // Clear current question
 * }
 */
export function useCurrentQuestion() {
  // Local loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Questions Store (Firebase operations)
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const loadHostQuestion = useQuestionsStore((state) => state.loadHostQuestion);
  // eslint-disable-next-line no-unused-vars
  const getPublicQuestion = useQuestionsStore(
    (state) => state.getPublicQuestion,
  );
  const clearHostQuestion = useQuestionsStore(
    (state) => state.clearHostQuestion,
  );
  const loadQuestionSet = useQuestionsStore((state) => state.loadQuestionSet);
  const loadedSets = useQuestionsStore((state) => state.loadedSets);

  // Game Store (Firebase operations)
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const setQuestionNumber = useGameStore((state) => state.setQuestionNumber);

  /**
   * Load question from question-sets for host view
   * Includes correct answer for host validation
   * ONLY loads into local state - does NOT push to Firebase yet
   * Host must click "Push to Display" to push to Firebase game-state
   */
  const loadQuestion = async (questionNumber) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate question number
      if (questionNumber < 1 || questionNumber > 20) {
        throw new Error(
          `Invalid question number: ${questionNumber}. Must be 1-20.`,
        );
      }

      // Get current team's assigned question set
      const questionSetId = questionSetAssignments[currentTeamId];

      if (!questionSetId) {
        throw new Error(
          `No question set assigned to current team: ${currentTeamId}`,
        );
      }

      // Check if question set is already loaded in memory
      if (!loadedSets[questionSetId]) {
        console.log(
          `📥 Question set ${questionSetId} not in memory, loading from Firebase...`,
        );
        const loadResult = await loadQuestionSet(questionSetId);

        if (!loadResult.success) {
          throw new Error(
            loadResult.error || 'Failed to load question set from Firebase',
          );
        }
      }

      // Load question from loaded set (0-indexed: questionNumber - 1)
      const result = loadHostQuestion(questionSetId, questionNumber - 1);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load question');
      }

      // Update current question number in local game state only
      setQuestionNumber(questionNumber);

      console.log(
        `✅ Question ${questionNumber} loaded locally for HOST (with answer). Not pushed to Firebase yet - click "Push to Display" to make visible.`,
      );

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Push to Display - Push question to Firebase game-state (without answer) and make visible
   * This is when the question becomes available on the public display
   */
  const showQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!hostQuestion) {
        throw new Error('No question loaded. Load a question first.');
      }

      // Get current question number from game store
      const { currentQuestionNumber } = useGameStore.getState();

      // Push to Firebase game-state (setCurrentQuestion removes answer and sets visibility=true)
      await databaseService.setCurrentQuestion(
        hostQuestion,
        currentQuestionNumber,
      );

      console.log(
        `👁️ Question ${currentQuestionNumber} pushed to Firebase game-state (WITHOUT answer, visibility=true)`,
      );

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to show question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Hide question from public
   */
  const hideQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseService.updateGameState({
        questionVisible: false,
      });

      console.log('🙈 Question hidden from public');

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to hide question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Clear current question
   */
  const clearQuestion = () => {
    clearHostQuestion();
    setError(null);
  };

  return {
    // State
    question: hostQuestion,
    isLoading,
    error,
    isVisible: questionVisible,

    // Actions
    loadQuestion,
    showQuestion,
    hideQuestion,
    clearQuestion,
  };
}
