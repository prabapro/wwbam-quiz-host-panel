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
 * - Load question from Firebase (with correct answer)
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
 *   loadQuestion: (questionNumber) => Promise<void>,  // Load from Firebase
 *   showQuestion: () => Promise<void>,                // Push to Firebase
 *   hideQuestion: () => Promise<void>,                // Hide from public
 *   clearQuestion: () => void,                        // Clear current question
 * }
 *
 * Usage in Component:
 * const { question, loadQuestion, showQuestion } = useCurrentQuestion();
 *
 * await loadQuestion(5);  // Loads Q5 from Firebase
 * await showQuestion();   // Pushes to Firebase (no correct answer)
 */
export function useCurrentQuestion() {
  // Local loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Questions Store (Firebase operations)
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const loadHostQuestion = useQuestionsStore((state) => state.loadHostQuestion);
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
   * Load question from Firebase for host view
   * Includes correct answer for host validation
   * Clears previous question state and syncs question number to Firebase
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

      // Update current question number in local game state
      setQuestionNumber(questionNumber);

      // ✅ Clear previous question state and sync new question number to Firebase
      await databaseService.updateGameState({
        currentQuestionNumber: questionNumber,
        currentQuestion: null, // Clear previous question
        questionVisible: false, // Reset visibility
        optionsVisible: false, // Reset options visibility
        answerRevealed: false, // Reset answer reveal
        correctOption: null, // Clear previous correct answer
      });

      console.log(
        `✅ Question ${questionNumber} loaded from Firebase and synced (previous state cleared)`,
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
   * Push to Display to public (push to Firebase)
   * Removes correct answer before syncing
   */
  const showQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!hostQuestion) {
        throw new Error('No question loaded. Load a question first.');
      }

      // Get public question (without correct answer)
      const publicQuestion = getPublicQuestion();

      if (!publicQuestion) {
        throw new Error('Failed to get public question');
      }

      // Get current question number from game store
      const { currentQuestionNumber } = useGameStore.getState();

      // Push to Firebase (setCurrentQuestion already removes correct answer)
      await databaseService.setCurrentQuestion(
        hostQuestion,
        currentQuestionNumber,
      );

      console.log(
        `👁️ Question ${currentQuestionNumber} pushed to public display (no correct answer)`,
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
