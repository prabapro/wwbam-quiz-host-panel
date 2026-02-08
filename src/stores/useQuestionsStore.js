// src/stores/useQuestionsStore.js

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { localStorageService } from '@services/localStorage.service';
import { validateAnswer, normalizeOption } from '@utils/validation';

/**
 * Questions Store
 * Manages loaded question sets and current question data
 * Note: Question sets are stored in localStorage, this store manages
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

      // ============================================================
      // ACTIONS
      // ============================================================

      /**
       * Load a question set from localStorage into memory
       */
      loadQuestionSet: (setId) => {
        const questionSet = localStorageService.getQuestionSet(setId);

        if (!questionSet) {
          console.warn(`Question set ${setId} not found in localStorage`);
          return { success: false, error: 'Question set not found' };
        }

        const { loadedSets } = get();

        set({
          loadedSets: {
            ...loadedSets,
            [setId]: questionSet,
          },
        });

        console.log(`📚 Question set loaded: ${setId}`);

        return { success: true, questionSet };
      },

      /**
       * Unload a question set from memory
       */
      unloadQuestionSet: (setId) => {
        const { loadedSets } = get();
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
       * Get question for public display (WITHOUT correct answer)
       */
      getPublicQuestion: () => {
        const { hostQuestion } = get();

        if (!hostQuestion) {
          return null;
        }

        // Return question without correct answer
        const { correctAnswer, ...publicQuestion } = hostQuestion;

        return publicQuestion;
      },

      /**
       * Select an answer (team's choice)
       */
      selectAnswer: (option) => {
        const normalized = normalizeOption(option);

        if (!normalized) {
          console.warn(`Invalid answer option: ${option}`);
          return { success: false, error: 'Invalid option' };
        }

        set({
          selectedAnswer: normalized,
          validationResult: null, // Clear previous validation
        });

        console.log(`✏️ Answer selected: ${normalized}`);

        return { success: true, selectedAnswer: normalized };
      },

      /**
       * Clear selected answer
       */
      clearSelectedAnswer: () => {
        set({
          selectedAnswer: null,
          validationResult: null,
        });
      },

      /**
       * Validate selected answer (lock answer)
       */
      validateSelectedAnswer: () => {
        const { hostQuestion, selectedAnswer } = get();

        if (!hostQuestion) {
          return { success: false, error: 'No question loaded' };
        }

        if (!selectedAnswer) {
          return { success: false, error: 'No answer selected' };
        }

        const correctAnswer = hostQuestion.correctAnswer;
        const result = validateAnswer(selectedAnswer, correctAnswer);

        set({ validationResult: result });

        console.log(
          `${result.isCorrect ? '✅' : '❌'} Answer validation: ${selectedAnswer} (Correct: ${correctAnswer})`,
        );

        return { success: true, result };
      },

      /**
       * Apply 50/50 lifeline - filter options
       */
      applyFiftyFifty: () => {
        const { hostQuestion } = get();

        if (!hostQuestion) {
          return { success: false, error: 'No question loaded' };
        }

        const correctAnswer = hostQuestion.correctAnswer;
        const allOptions = ['A', 'B', 'C', 'D'];

        // Get incorrect options
        const incorrectOptions = allOptions.filter(
          (opt) => opt !== correctAnswer,
        );

        // Randomly select 2 incorrect options to remove
        const toRemove = incorrectOptions
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        // Keep correct answer and one random incorrect
        const remainingOptions = allOptions.filter(
          (opt) => !toRemove.includes(opt),
        );

        console.log(
          `✂️ 50/50 applied: Removed ${toRemove.join(', ')}, Remaining ${remainingOptions.join(', ')}`,
        );

        return {
          success: true,
          removedOptions: toRemove,
          remainingOptions,
        };
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

        console.log('🧹 Host question cleared');
      },

      /**
       * Get question set metadata for a loaded set
       */
      getQuestionSetMetadata: (setId) => {
        const { loadedSets } = get();
        const questionSet = loadedSets[setId];

        if (!questionSet) {
          return null;
        }

        return {
          setId: questionSet.setId,
          setName: questionSet.setName,
          totalQuestions:
            questionSet.totalQuestions || questionSet.questions.length,
          uploadedAt: questionSet.uploadedAt,
          lastModified: questionSet.lastModified,
        };
      },

      /**
       * Get all loaded question sets metadata
       */
      getLoadedSetsMetadata: () => {
        const { loadedSets } = get();
        const setIds = Object.keys(loadedSets);

        return setIds.map((setId) => get().getQuestionSetMetadata(setId));
      },

      /**
       * Check if question set is loaded
       */
      isSetLoaded: (setId) => {
        const { loadedSets } = get();
        return setId in loadedSets;
      },

      /**
       * Preload multiple question sets
       */
      preloadQuestionSets: (setIds) => {
        const results = setIds.map((setId) => {
          const result = get().loadQuestionSet(setId);
          return { setId, ...result };
        });

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        console.log(
          `📚 Preloaded ${successful} question sets (${failed} failed)`,
        );

        return { success: failed === 0, results };
      },

      /**
       * Clear all loaded sets
       */
      clearAllLoadedSets: () => {
        set({
          loadedSets: {},
          hostQuestion: null,
          selectedAnswer: null,
          validationResult: null,
        });

        console.log('🧹 All loaded question sets cleared');
      },

      /**
       * Get question progress for a set
       */
      getQuestionProgress: (setId, currentIndex) => {
        const { loadedSets } = get();
        const questionSet = loadedSets[setId];

        if (!questionSet) {
          return null;
        }

        const total = questionSet.questions.length;

        return {
          current: currentIndex + 1, // 1-indexed for display
          total,
          percentage: ((currentIndex + 1) / total) * 100,
          remaining: total - (currentIndex + 1),
        };
      },

      /**
       * Get store summary
       */
      getStoreSummary: () => {
        const { loadedSets, hostQuestion, selectedAnswer, validationResult } =
          get();

        return {
          loadedSetsCount: Object.keys(loadedSets).length,
          loadedSetIds: Object.keys(loadedSets),
          hasHostQuestion: !!hostQuestion,
          hasSelectedAnswer: !!selectedAnswer,
          isValidated: !!validationResult,
          validationIsCorrect: validationResult?.isCorrect || false,
        };
      },
    }),
    {
      name: 'questions-store',
    },
  ),
);

export default useQuestionsStore;
