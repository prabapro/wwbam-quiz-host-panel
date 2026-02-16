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
 * UPDATED: Fixed closure issues and added defensive data fetching
 * - Now reads fresh state on each execution instead of capturing at init
 * - Implements on-demand fetching if question set assignments are missing
 * - Added retry mechanism with fresh Firebase data
 * - Better error handling and recovery
 *
 * Responsibilities:
 * - Load question from question-sets (with correct answer for host ONLY)
 * - Validate question set freshness before loading questions
 * - Clear previous question AND lifeline state from game-state when loading new question
 * - Push question to game-state Firebase (without correct answer when displaying)
 * - Manage question visibility flags (questionVisible, optionsVisible)
 * - Handle question state transitions
 * - Track question loading and error states
 *
 * Flow:
 * 1. loadQuestion() - Validates freshness, loads from question-sets WITH answer,
 *                     stores LOCALLY only, CLEARS game-state + lifeline state
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
  const clearFilteredOptions = useQuestionsStore(
    (state) => state.clearFilteredOptions,
  );
  const loadedSets = useQuestionsStore((state) => state.loadedSets);

  // Game Store - NOTE: We'll read fresh state each time, not capture in closure
  const questionVisible = useGameStore((state) => state.questionVisible);
  const setQuestionNumber = useGameStore((state) => state.setQuestionNumber);

  /**
   * Get fresh question set assignment for current team
   * Reads from store and falls back to Firebase if not found
   *
   * @returns {Promise<{ success: boolean, questionSetId?: string, error?: string }>}
   */
  const getFreshQuestionSetAssignment = async () => {
    try {
      // Read fresh state from store (not from closure)
      const currentTeamId = useGameStore.getState().currentTeamId;
      const questionSetAssignments =
        useGameStore.getState().questionSetAssignments;

      if (!currentTeamId) {
        return { success: false, error: 'No current team ID' };
      }

      // Check if we have assignment in local state
      let questionSetId = questionSetAssignments?.[currentTeamId];

      if (questionSetId) {
        console.log(
          `📚 Found question set assignment in local state: ${questionSetId}`,
        );
        return { success: true, questionSetId };
      }

      // Assignment not in local state - fetch fresh from Firebase
      console.log(
        '🔄 Question set assignment missing - fetching from Firebase...',
      );

      const firebaseGameState = await databaseService.getGameState();

      if (!firebaseGameState) {
        return {
          success: false,
          error: 'Failed to fetch game state from Firebase',
        };
      }

      questionSetId = firebaseGameState.questionSetAssignments?.[currentTeamId];

      if (!questionSetId) {
        return {
          success: false,
          error: `No question set assigned to team ${currentTeamId} in Firebase`,
        };
      }

      // Update local store with fresh assignment
      console.log(
        `✅ Fetched question set assignment from Firebase: ${questionSetId}`,
      );

      // Update game store with fresh assignments
      useGameStore.setState({
        questionSetAssignments: firebaseGameState.questionSetAssignments,
      });

      return { success: true, questionSetId };
    } catch (error) {
      console.error('Failed to get question set assignment:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Load question from question-sets for host view
   * Includes correct answer for host validation
   *
   * UPDATED: Now reads fresh state and implements defensive fetching
   *
   * Flow:
   * 1. Get fresh question set assignment (from store or Firebase)
   * 2. Validate question set is fresh (< 5 min old)
   * 3. If stale or not loaded, fetch fresh from Firebase
   * 4. Load question into host view (with correct answer)
   * 5. Clear filtered options (50/50 state)
   * 6. Update question number in local game state
   * 7. Clear previous question + lifeline state from Firebase game-state
   *
   * ONLY loads into local state - does NOT push to Firebase yet
   * Host must click "Push to Display" to push to Firebase game-state
   * Clears previous question state AND lifeline state from Firebase game-state
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

      // ============================================================
      // GET FRESH QUESTION SET ASSIGNMENT
      // ============================================================

      const assignmentResult = await getFreshQuestionSetAssignment();

      if (!assignmentResult.success) {
        throw new Error(
          assignmentResult.error || 'Failed to get question set assignment',
        );
      }

      const questionSetId = assignmentResult.questionSetId;

      console.log(
        `📖 Loading question ${questionNumber} from set: ${questionSetId}`,
      );

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

      // ============================================================
      // CLEAR LIFELINE STATE
      // ============================================================

      // Clear 50/50 filtered options from questions store
      clearFilteredOptions();
      console.log('🧹 Filtered options cleared for new question');

      // Update current question number in local game state
      setQuestionNumber(questionNumber);

      // ============================================================
      // CLEAR PREVIOUS QUESTION + LIFELINE STATE FROM FIREBASE GAME-STATE
      // ============================================================

      // This resets visibility, answer flags, removes previous question,
      // AND clears active lifeline state
      // SECURITY: No correct answer is sent to Firebase at this stage
      await databaseService.updateGameState({
        currentQuestionNumber: questionNumber,
        currentQuestion: null, // Clear previous question
        questionVisible: false, // Reset visibility
        optionsVisible: false, // Reset options visibility
        answerRevealed: false, // Reset answer reveal
        correctOption: null, // Clear previous correct answer
        selectedOption: null, // Reset selected option
        optionWasCorrect: null, // Reset correctness flag
        activeLifeline: null, // Clear active lifeline when moving to next question
      });

      console.log(
        `✅ Question ${questionNumber} loaded locally for HOST (with answer)`,
      );
      console.log(
        '🧹 Previous question + lifeline state cleared from Firebase game-state',
      );
      console.log(
        `🔒 Correct answer (${result.question.correctAnswer}) is HOST-ONLY (not in Firebase)`,
      );

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load question:', err);
      setError(err.message);
      setIsLoading(false);
      throw err; // Re-throw so caller can handle
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
      throw err;
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
      throw err;
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
