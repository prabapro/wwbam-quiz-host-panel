// src/stores/useQuestionsStore.js

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { databaseService } from '@services/database.service';
import { validateAnswer, normalizeOption } from '@utils/validation';

/**
 * Questions Store
 * Manages loaded question sets and current question data
 * Note: Question sets are now stored in Firebase, this store manages
 * the currently loaded sets in memory for active gameplay
 */
export const useQuestionsStore = create()(
  devtools(
    (set, get) => ({
      // ============================================================
      // STATE
      // ============================================================

      // Currently loaded question sets: { setId: questionSetData }
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
       */
      loadQuestionSet: async (setId) => {
        set({ isLoading: true, error: null });

        try {
          const questionSet = await databaseService.getQuestionSet(setId);

          if (!questionSet) {
            console.warn(`Question set ${setId} not found in Firebase`);
            set({ isLoading: false, error: 'Question set not found' });
            return { success: false, error: 'Question set not found' };
          }

          const { loadedSets } = get();

          set({
            loadedSets: {
              ...loadedSets,
              [setId]: questionSet,
            },
            isLoading: false,
            error: null,
          });

          console.log(`📚 Question set loaded from Firebase: ${setId}`);

          return { success: true, questionSet };
        } catch (error) {
          console.error('Error loading question set:', error);
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      /**
       * Unload a question set from memory
       */
      unloadQuestionSet: (setId) => {
        const { loadedSets } = get();
        // eslint-disable-next-line no-unused-vars
        const { [setId]: removed, ...remainingSets } = loadedSets;

        set({ loadedSets: remainingSets });

        console.log(`📚 Question set unloaded: ${setId}`);
      },

      /**
       * Get a specific question from a loaded set
       */
      getQuestion: (setId, questionIndex) => {
        const { loadedSets } = get();
        const questionSet = loadedSets[setId];

        if (!questionSet) {
          console.warn(`Question set ${setId} not loaded`);
          return null;
        }

        if (
          questionIndex < 0 ||
          questionIndex >= questionSet.questions.length
        ) {
          console.warn(
            `Invalid question index: ${questionIndex} for set ${setId}`,
          );
          return null;
        }

        return questionSet.questions[questionIndex];
      },

      /**
       * Load question for host view (with correct answer)
       */
      loadHostQuestion: (setId, questionIndex) => {
        const question = get().getQuestion(setId, questionIndex);

        if (!question) {
          return { success: false, error: 'Question not found' };
        }

        set({
          hostQuestion: question,
          selectedAnswer: null,
          validationResult: null,
        });

        console.log(`📝 Host question loaded: ${setId} Q${questionIndex + 1}`);

        return { success: true, question };
      },

      /**
       * Get question for public display (without correct answer)
       */
      getPublicQuestion: () => {
        const { hostQuestion } = get();

        if (!hostQuestion) {
          return null;
        }

        // Remove correct answer for public display
        // eslint-disable-next-line no-unused-vars
        const { correctAnswer, ...publicQuestion } = hostQuestion;

        return publicQuestion;
      },

      /**
       * Clear host question
       */
      clearHostQuestion: () => {
        set({
          hostQuestion: null,
          selectedAnswer: null,
          validationResult: null,
        });

        console.log('📝 Host question cleared');
      },

      /**
       * Select an answer option (A/B/C/D)
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
       */
      validateSelectedAnswer: () => {
        const { hostQuestion, selectedAnswer } = get();

        if (!hostQuestion) {
          return { success: false, error: 'No question loaded' };
        }

        if (!selectedAnswer) {
          return { success: false, error: 'No answer selected' };
        }

        const validationResult = validateAnswer(
          selectedAnswer,
          hostQuestion.correctAnswer,
        );

        set({ validationResult });

        console.log(
          `🔍 Answer validation: ${validationResult.isCorrect ? '✅ Correct' : '❌ Incorrect'}`,
        );

        return { success: true, result: validationResult };
      },

      /**
       * Clear all loaded sets from memory
       */
      clearAllLoadedSets: () => {
        set({
          loadedSets: {},
          hostQuestion: null,
          selectedAnswer: null,
          validationResult: null,
        });

        console.log('🔄 All loaded question sets cleared from memory');
      },
    }),
    {
      name: 'questions-store',
    },
  ),
);
