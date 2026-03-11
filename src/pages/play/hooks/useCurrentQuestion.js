// src/pages/play/hooks/useCurrentQuestion.js

import { useState } from 'react';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useGameStore } from '@stores/useGameStore';
import { databaseService } from '@services/database.service';

/**
 * useCurrentQuestion Hook
 *
 * Manages the host-side question lifecycle: loading from the authenticated
 * question-sets node, pushing to the public game-state node, and controlling
 * visibility. Uses getState() calls throughout to read live Zustand state
 * rather than closure-captured values (prevents stale assignment bugs).
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

  // Game Store — read via getState() inside callbacks to avoid stale closures
  const questionVisible = useGameStore((state) => state.questionVisible);
  const setQuestionNumber = useGameStore((state) => state.setQuestionNumber);

  /**
   * Get fresh question set assignment for the current team.
   * Reads from Zustand store first (via getState() — always live, never stale),
   * and falls back to a direct Firebase fetch if the assignment is absent.
   *
   * @returns {Promise<{ success: boolean, questionSetId?: string, error?: string }>}
   */
  const getFreshQuestionSetAssignment = async () => {
    try {
      // Always read fresh state — do NOT rely on closure-captured values.
      const currentTeamId = useGameStore.getState().currentTeamId;
      const questionSetAssignments =
        useGameStore.getState().questionSetAssignments;

      if (!currentTeamId) {
        return { success: false, error: 'No current team ID' };
      }

      // ── In-memory lookup ──────────────────────────────────────────────────────
      let questionSetId = questionSetAssignments?.[currentTeamId];

      if (questionSetId) {
        console.log(
          `📚 Found question set assignment in local state: ${questionSetId}`,
        );
        return { success: true, questionSetId };
      }

      // Diagnostic: log the mismatch so key-corruption issues are immediately visible.
      const availableKeys = questionSetAssignments
        ? Object.keys(questionSetAssignments)
        : [];
      console.warn(
        '⚠️ getFreshQuestionSetAssignment: in-memory lookup missed.',
        {
          currentTeamId,
          availableKeysInStore: availableKeys,
          // If currentTeamId appears camelCased in availableKeys, this is the
          // ID-corruption bug: convertKeysToCamel mangled the Firebase push key.
          exactMatch: availableKeys.includes(currentTeamId),
        },
      );

      // ── Firebase fallback ─────────────────────────────────────────────────────
      console.log(
        '🔄 Question set assignment missing in store — fetching from Firebase...',
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
        // Diagnostic: confirm whether Firebase also has a key mismatch or is genuinely empty.
        const firebaseKeys = firebaseGameState.questionSetAssignments
          ? Object.keys(firebaseGameState.questionSetAssignments)
          : [];
        console.warn(
          '⚠️ getFreshQuestionSetAssignment: Firebase fallback also missed.',
          {
            currentTeamId,
            availableKeysInFirebase: firebaseKeys,
            exactMatch: firebaseKeys.includes(currentTeamId),
          },
        );

        return {
          success: false,
          error: `No question set assigned to team ${currentTeamId} in Firebase`,
        };
      }

      // ── Update store with fresh Firebase data ─────────────────────────────────
      console.log(
        `✅ Fetched question set assignment from Firebase: ${questionSetId}`,
      );

      // Always write the full map back so subsequent in-memory lookups succeed.
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
   * Load a question into the host view with the correct answer included.
   *
   * Validates the cached question set is fresh (< 5 min) and re-fetches from
   * Firebase if stale. Clears 50/50 filtered options and resets previous
   * question/lifeline state in Firebase so the public display is clean.
   *
   * Stores locally only — does not push to Firebase. The host must click
   * "Push to Display" (showQuestion) to make the question public.
   *
   * @param {number} questionNumber - 1-based question number
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
      // Correct answer is deliberately excluded — game-state is public-readable
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
   * Push the current question to Firebase game-state for public display.
   * Strips the correct answer before pushing — game-state is public-readable,
   * so the answer stays in the host-only question-sets node until revealAnswer().
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
