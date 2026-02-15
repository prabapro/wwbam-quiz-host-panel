// src/stores/useQuestionsStore.js

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { databaseService } from '@services/database.service';
import { validateAnswer, normalizeOption } from '@utils/validation';

/**
 * Questions Store
 * Manages loaded question sets and current question data
 *
 * UPDATED: Added freshness validation and forced refresh capability
 * Question sets are stored in Firebase and loaded into memory for gameplay
 * This store does NOT persist to localStorage - questions always fetched fresh
 *
 * SECURITY MODEL:
 * - question-sets (Firebase): Contains correct answers, host-only access
 * - game-state (Firebase): Public readable, answers only added when revealed
 * - This store: Host view with correct answers, never pushed to localStorage
 */
export const useQuestionsStore = create()(
  devtools(
    (set, get) => ({
      // ============================================================
      // STATE
      // ============================================================

      // Currently loaded question sets: { setId: { data, loadedAt } }
      loadedSets: {},

      // Current question in host view (includes correct answer)
      hostQuestion: null,

      // Selected answer by team (A/B/C/D)
      selectedAnswer: null,

      // Answer validation result
      validationResult: null,

      // Loading state
      isLoading: false,

      // Error state
      error: null,

      // ============================================================
      // ACTIONS
      // ============================================================

      /**
       * Load a question set from Firebase into memory
       *
       * @param {string} setId - Question set ID
       * @param {Object} options - Loading options
       * @param {boolean} options.forceFresh - Force fresh fetch even if cached
       * @returns {Promise<Object>} { success: boolean, error?: string }
       */
      loadQuestionSet: async (setId, options = {}) => {
        const { forceFresh = false } = options;

        set({ isLoading: true, error: null });

        try {
          const { loadedSets } = get();
          const cachedSet = loadedSets[setId];

          // Check if we should use cached data
          if (!forceFresh && cachedSet) {
            const cacheAge = Date.now() - cachedSet.loadedAt;
            const maxCacheAge = 5 * 60 * 1000; // 5 minutes

            if (cacheAge < maxCacheAge) {
              console.log(
                `📚 Using cached question set ${setId} (${Math.round(cacheAge / 1000)}s old)`,
              );
              set({ isLoading: false });
              return { success: true, cached: true };
            } else {
              console.log(
                `⏰ Cached question set ${setId} is stale (${Math.round(cacheAge / 1000)}s old), fetching fresh...`,
              );
            }
          }

          // Fetch fresh from Firebase
          const questionSet = await databaseService.getQuestionSet(setId);

          if (!questionSet) {
            console.warn(`Question set ${setId} not found in Firebase`);
            set({ isLoading: false, error: 'Question set not found' });
            return { success: false, error: 'Question set not found' };
          }

          // Store with timestamp
          set({
            loadedSets: {
              ...get().loadedSets,
              [setId]: {
                ...questionSet,
                loadedAt: Date.now(),
              },
            },
            isLoading: false,
          });

          console.log(
            `✅ Question set ${setId} loaded fresh from Firebase (${questionSet.questions?.length || 0} questions)`,
          );
          return { success: true, cached: false };
        } catch (error) {
          console.error('Failed to load question set:', error);
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      /**
       * Force refresh a question set from Firebase
       * Bypasses cache and always fetches fresh data
       *
       * @param {string} setId - Question set ID
       * @returns {Promise<Object>} { success: boolean, error?: string }
       */
      refreshQuestionSet: async (setId) => {
        console.log(`🔄 Force refreshing question set ${setId}...`);
        return get().loadQuestionSet(setId, { forceFresh: true });
      },

      /**
       * Load a specific question from a loaded set into host view
       * Includes correct answer for host validation
       *
       * @param {string} setId - Question set ID
       * @param {number} questionIndex - Question index (0-based)
       * @returns {Object} { success: boolean, error?: string, question?: Object }
       */
      loadHostQuestion: (setId, questionIndex) => {
        const { loadedSets } = get();
        const questionSet = loadedSets[setId];

        if (!questionSet) {
          const error = `Question set ${setId} not loaded in memory`;
          console.error(error);
          return { success: false, error };
        }

        if (
          !questionSet.questions ||
          questionIndex < 0 ||
          questionIndex >= questionSet.questions.length
        ) {
          const error = `Invalid question index: ${questionIndex}`;
          console.error(error);
          return { success: false, error };
        }

        const question = questionSet.questions[questionIndex];

        // Set as host question (includes correct answer)
        set({
          hostQuestion: question,
          selectedAnswer: null,
          validationResult: null,
        });

        console.log(
          `✅ Host question loaded: Q${questionIndex + 1} (${question.id})`,
          `Correct: ${question.correctAnswer}`,
        );

        return { success: true, question };
      },

      /**
       * Get public version of current question (without correct answer)
       * This is what gets pushed to Firebase game-state for public display
       *
       * SECURITY: Correct answer is NEVER included in public question
       *
       * @returns {Object|null} Public question data or null
       */
      getPublicQuestion: () => {
        const { hostQuestion } = get();

        if (!hostQuestion) {
          return null;
        }

        // Strip correct answer for public view
        // eslint-disable-next-line no-unused-vars
        const { correctAnswer, ...publicQuestion } = hostQuestion;

        return publicQuestion;
      },

      /**
       * Select an answer option (A/B/C/D)
       * Returns success/error result object for validation
       *
       * @param {string} option - Selected option (A/B/C/D)
       * @returns {Object} { success: boolean, selectedAnswer?: string, error?: string }
       */
      selectAnswer: (option) => {
        const normalizedOption = normalizeOption(option);

        if (!normalizedOption) {
          return {
            success: false,
            error: 'Invalid option. Must be A, B, C, or D',
          };
        }

        set({
          selectedAnswer: normalizedOption,
          validationResult: null,
        });

        console.log(`✅ Answer selected: ${normalizedOption}`);

        return { success: true, selectedAnswer: normalizedOption };
      },

      /**
       * Clear selected answer
       */
      clearSelectedAnswer: () => {
        set({
          selectedAnswer: null,
          validationResult: null,
        });

        console.log('🔄 Selected answer cleared');
      },

      /**
       * Validate selected answer against correct answer
       * Returns validation result with success/error structure
       *
       * @returns {Object} { success: boolean, result?: Object, error?: string }
       */
      validateSelectedAnswer: () => {
        const { hostQuestion, selectedAnswer } = get();

        if (!hostQuestion) {
          console.error('No question loaded');
          return { success: false, error: 'No question loaded' };
        }

        if (!selectedAnswer) {
          console.error('No answer selected');
          return { success: false, error: 'No answer selected' };
        }

        const validationResult = validateAnswer(
          selectedAnswer,
          hostQuestion.correctAnswer,
        );

        set({ validationResult });

        console.log(
          `${validationResult.isCorrect ? '✅' : '❌'} Answer validation:`,
          `Selected: ${selectedAnswer}`,
          `Correct: ${hostQuestion.correctAnswer}`,
        );

        return {
          success: true,
          result: validationResult,
        };
      },

      /**
       * Clear current host question
       */
      clearHostQuestion: () => {
        set({
          hostQuestion: null,
          selectedAnswer: null,
          validationResult: null,
        });
        console.log('🧹 Host question cleared');
      },

      /**
       * Clear all loaded question sets from memory
       * Use this when resetting the game or clearing cache
       */
      clearAllQuestionSets: () => {
        set({
          loadedSets: {},
          hostQuestion: null,
          selectedAnswer: null,
          validationResult: null,
        });
        console.log('🧹 All question sets cleared from memory');
      },

      /**
       * Get cache info for a question set
       *
       * @param {string} setId - Question set ID
       * @returns {Object|null} { loadedAt: number, ageSeconds: number, isStale: boolean }
       */
      getQuestionSetCacheInfo: (setId) => {
        const { loadedSets } = get();
        const questionSet = loadedSets[setId];

        if (!questionSet || !questionSet.loadedAt) {
          return null;
        }

        const now = Date.now();
        const ageMs = now - questionSet.loadedAt;
        const ageSeconds = Math.round(ageMs / 1000);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes
        const isStale = ageMs > maxCacheAge;

        return {
          loadedAt: questionSet.loadedAt,
          ageSeconds,
          isStale,
        };
      },

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'questions-store',
    },
  ),
);

export default useQuestionsStore;
