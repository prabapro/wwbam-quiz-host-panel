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
 */
export function useCurrentQuestion() {
  // Local loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Questions Store (localStorage operations)
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const loadHostQuestion = useQuestionsStore((state) => state.loadHostQuestion);
  const getPublicQuestion = useQuestionsStore(
    (state) => state.getPublicQuestion,
  );
  const clearHostQuestion = useQuestionsStore(
    (state) => state.clearHostQuestion,
  );

  // Game Store (Firebase operations)
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const setQuestionNumber = useGameStore((state) => state.setQuestionNumber);

  /**
   * Load question from localStorage for host view
   * Includes correct answer for host validation
   * Does NOT sync to Firebase yet
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

      // Load question from localStorage (0-indexed: questionNumber - 1)
      const result = loadHostQuestion(questionSetId, questionNumber - 1);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load question');
      }

      // Update current question number in game state
      setQuestionNumber(questionNumber);

      console.log(`✅ Question ${questionNumber} loaded from localStorage`);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Show question to public (push to Firebase)
   * Removes correct answer before syncing
   */
  const showQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!hostQuestion) {
        throw new Error('No question loaded. Load a question first.');
      }

      // Get public version (without correct answer)
      const publicQuestion = getPublicQuestion();

      if (!publicQuestion) {
        throw new Error('Failed to generate public question');
      }

      // Push to Firebase (without correct answer)
      await databaseService.setCurrentQuestion(
        publicQuestion,
        currentQuestionNumber,
      );

      console.log(`✅ Question ${currentQuestionNumber} shown to public`);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to show question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Hide question from public display
   * Sets questionVisible = false in Firebase
   */
  const hideQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseService.updateGameState({
        questionVisible: false,
      });

      console.log(`✅ Question hidden from public`);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to hide question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Clear current question from host view
   * Does NOT affect Firebase state
   */
  const clearQuestion = () => {
    clearHostQuestion();
    setError(null);
    console.log('🧹 Question cleared from host view');
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
