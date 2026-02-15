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
 * UPDATED: Added freshness validation to ensure questions are always fetched
 * fresh from Firebase during gameplay, preventing stale data issues
 *
 * Responsibilities:
 * - Load question from question-sets (with correct answer for host ONLY)
 * - Validate question set freshness before loading questions
 * - Clear previous question from game-state when loading new question
 * - Push question to game-state Firebase (without correct answer when displaying)
 * - Manage question visibility flags (questionVisible, optionsVisible)
 * - Handle question state transitions
 * - Track question loading and error states
 *
 * Flow:
 * 1. loadQuestion() - Validates freshness, loads from question-sets WITH answer,
 *                     stores LOCALLY only, CLEARS game-state
 * 2. showQuestion() - Pushes to game-state WITHOUT answer, sets visibility=true (public can see)
 * 3. revealAnswer() - Pushes correct answer to game-state (public can see answer)
 *
 * Security Model:
 * - question-sets node: Contains answers, only readable by authenticated hosts
 * - game-state node: Public readable, but answers only added when explicitly revealed
 * - Host always sees answer locally from question-sets
 * - Public only sees answer after revealAnswer() is called
 */
export function useCurrentQuestion() {
  // Local loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Questions Store
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const loadHostQuestion = useQuestionsStore((state) => state.loadHostQuestion);
  const getPublicQuestion = useQuestionsStore(
    (state) => state.getPublicQuestion,
  );
  const clearHostQuestion = useQuestionsStore(
    (state) => state.clearHostQuestion,
  );
  const loadQuestionSet = useQuestionsStore((state) => state.loadQuestionSet);
  const refreshQuestionSet = useQuestionsStore(
    (state) => state.refreshQuestionSet,
  );
  const getQuestionSetCacheInfo = useQuestionsStore(
    (state) => state.getQuestionSetCacheInfo,
  );
  const loadedSets = useQuestionsStore((state) => state.loadedSets);

  // Game Store
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const setQuestionNumber = useGameStore((state) => state.setQuestionNumber);

  /**
   * Load question from question-sets for host view
   * Includes correct answer for host validation
   *
   * UPDATED: Now validates question set freshness and forces refresh if stale
   *
   * Flow:
   * 1. Validate question set is fresh (< 5 min old)
   * 2. If stale or not loaded, fetch fresh from Firebase
   * 3. Load question into host view (with correct answer)
   * 4. Update question number in local game state
   * 5. Clear previous question from Firebase game-state
   *
   * ONLY loads into local state - does NOT push to Firebase yet
   * Host must click "Push to Display" to push to Firebase game-state
   * Clears previous question state from Firebase game-state
   *
   * @param {number} questionNumber - Question number (1-20)
   * @returns {Promise<void>}
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

      // ============================================================
      // FRESHNESS VALIDATION
      // ============================================================

      // Check if question set is already loaded and validate freshness
      const cacheInfo = getQuestionSetCacheInfo(questionSetId);
      const isSetLoaded = !!loadedSets[questionSetId];

      let shouldRefresh = false;

      if (!isSetLoaded) {
        console.log(
          `📥 Question set ${questionSetId} not in memory, loading from Firebase...`,
        );
        shouldRefresh = true;
      } else if (cacheInfo?.isStale) {
        console.log(
          `⏰ Question set ${questionSetId} is stale (${cacheInfo.ageSeconds}s old), refreshing from Firebase...`,
        );
        shouldRefresh = true;
      } else {
        console.log(
          `📚 Using fresh cached question set ${questionSetId} (${cacheInfo?.ageSeconds || 0}s old)`,
        );
      }

      // Load or refresh question set if needed
      if (shouldRefresh) {
        const loadResult = await (isSetLoaded
          ? refreshQuestionSet(questionSetId)
          : loadQuestionSet(questionSetId, { forceFresh: true }));

        if (!loadResult.success) {
          throw new Error(
            loadResult.error || 'Failed to load question set from Firebase',
          );
        }

        console.log(
          `✅ Question set ${questionSetId} loaded fresh from Firebase`,
        );
      }

      // ============================================================
      // LOAD QUESTION INTO HOST VIEW
      // ============================================================

      // Load question from loaded set (0-indexed: questionNumber - 1)
      const result = loadHostQuestion(questionSetId, questionNumber - 1);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load question');
      }

      // Update current question number in local game state
      setQuestionNumber(questionNumber);

      // ============================================================
      // CLEAR PREVIOUS QUESTION FROM FIREBASE GAME-STATE
      // ============================================================

      // This resets visibility, answer flags, and removes previous question
      // SECURITY: No correct answer is sent to Firebase at this stage
      await databaseService.updateGameState({
        currentQuestionNumber: questionNumber,
        currentQuestion: null, // Clear previous question
        questionVisible: false, // Reset visibility
        optionsVisible: false, // Reset options visibility
        answerRevealed: false, // Reset answer reveal
        correctOption: null, // Clear previous correct answer
      });

      console.log(
        `✅ Question ${questionNumber} loaded locally for HOST (with answer)`,
      );
      console.log('🧹 Previous question cleared from Firebase game-state');
      console.log(
        `🔒 Correct answer (${result.question.correctAnswer}) is HOST-ONLY (not in Firebase)`,
      );

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load question:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  /**
   * Push current question to Firebase game-state for public display
   * Strips correct answer before pushing to Firebase
   *
   * SECURITY: This is where the question becomes public WITHOUT the correct answer
   * The correct answer stays in the host-only question-sets node
   *
   * @returns {Promise<void>}
   */
  const showQuestion = async () => {
    try {
      if (!hostQuestion) {
        throw new Error('No question loaded');
      }

      // Get public version of question (without correct answer)
      const publicQuestion = getPublicQuestion();

      if (!publicQuestion) {
        throw new Error('Failed to generate public question');
      }

      // Push to Firebase WITHOUT correct answer
      await databaseService.setCurrentQuestion(
        publicQuestion,
        useGameStore.getState().currentQuestionNumber,
      );

      console.log('✅ Question pushed to display (PUBLIC - no answer)');
      console.log(
        `🔒 Correct answer (${hostQuestion.correctAnswer}) still HOST-ONLY`,
      );
    } catch (err) {
      console.error('Failed to show question:', err);
      setError(err.message);
    }
  };

  /**
   * Hide question from public display
   * Sets visibility to false in Firebase game-state
   *
   * @returns {Promise<void>}
   */
  const hideQuestion = async () => {
    try {
      await databaseService.updateGameState({
        questionVisible: false,
      });

      console.log('🙈 Question hidden from public');
    } catch (err) {
      console.error('Failed to hide question:', err);
      setError(err.message);
    }
  };

  /**
   * Clear current question from host view
   * Resets local question state only, does not affect Firebase
   */
  const clearQuestion = () => {
    clearHostQuestion();
    setError(null);
    console.log('🧹 Host question cleared locally');
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
