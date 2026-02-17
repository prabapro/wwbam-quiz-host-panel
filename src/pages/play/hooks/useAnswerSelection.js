// src/pages/play/hooks/useAnswerSelection.js

import { useState, useCallback } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { databaseService } from '@services/database.service';
import { getPrizeForQuestion } from '@utils/gameplay/scoreCalculation';
import { QUESTIONS_PER_SET } from '@constants/config';

/**
 * useAnswerSelection Hook
 *
 * Purpose: Manage the answer selection and locking flow
 *
 * Flow:
 * 1. Team announces answer verbally
 * 2. Host selects option (A/B/C/D) via AnswerPad
 * 3. Selected answer stored in local state (NOT synced to Firebase)
 * 4. Host clicks "Lock Answer"
 * 5. Hook validates against correct answer from localStorage
 * 6. If correct: Update prize, increment question, celebrate
 * 7. If incorrect: Eliminate team immediately (WWBAM rules)
 * 8. Sync result to Firebase (reveal answer, update team)
 */

/**
 * Check if current team is the last team in play queue
 * @param {string} currentTeamId - Current team ID
 * @param {Array} playQueue - Play queue array
 * @returns {boolean} True if this is the last team
 */
const isLastTeamInQueue = (currentTeamId, playQueue) => {
  if (!playQueue || playQueue.length === 0) return false;
  const currentIndex = playQueue.indexOf(currentTeamId);
  return currentIndex === playQueue.length - 1;
};

export function useAnswerSelection() {
  // Local state for answer locking process
  const [isLocking, setIsLocking] = useState(false);
  const [lockError, setLockError] = useState(null);

  // Questions Store (for validation)
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const selectedAnswer = useQuestionsStore((state) => state.selectedAnswer);
  const validationResult = useQuestionsStore((state) => state.validationResult);
  const selectAnswerAction = useQuestionsStore((state) => state.selectAnswer);
  const clearSelectedAnswer = useQuestionsStore(
    (state) => state.clearSelectedAnswer,
  );
  const validateSelectedAnswer = useQuestionsStore(
    (state) => state.validateSelectedAnswer,
  );

  // Game Store (for question state)
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );

  // Teams Store (for updating team progress)
  const currentTeam = useTeamsStore((state) => state.teams[currentTeamId]);
  const moveToNextQuestion = useTeamsStore((state) => state.moveToNextQuestion);
  const completeTeam = useTeamsStore((state) => state.completeTeam);
  const eliminateTeam = useTeamsStore((state) => state.eliminateTeam);

  // Prize Store (for prize calculation)
  const prizeStructure = usePrizeStore((state) => state.prizeStructure);

  /**
   * Select an answer option (A/B/C/D)
   * Stored locally, not synced to Firebase until locked
   */
  const selectAnswer = useCallback(
    (option) => {
      const result = selectAnswerAction(option);

      if (!result.success) {
        console.warn('Invalid answer selection:', result.error);
      }

      setLockError(null);
    },
    [selectAnswerAction],
  );

  /**
   * Clear selected answer
   */
  const clearSelection = useCallback(() => {
    clearSelectedAnswer();
    setLockError(null);
  }, [clearSelectedAnswer]);

  /**
   * Lock answer and trigger validation
   * This is the main action that validates and updates game state
   */
  const lockAnswer = useCallback(async () => {
    setIsLocking(true);
    setLockError(null);

    try {
      // Validate locally first
      const validationResult = validateSelectedAnswer();

      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Validation failed');
      }

      const { result } = validationResult;
      const { isCorrect, correctAnswer } = result;

      // Reveal answer in Firebase
      await databaseService.revealAnswer(
        correctAnswer,
        result.selectedAnswer,
        result.isCorrect,
      );

      if (isCorrect) {
        // CORRECT ANSWER FLOW
        console.log('✅ Correct answer! Updating team progress...');

        // Calculate new prize
        const newPrize = getPrizeForQuestion(
          currentQuestionNumber,
          prizeStructure,
        );

        // ─── FIX: Use currentQuestionNumber (game store) to detect the last
        // question, NOT questionsAnswered (team store).
        //
        // questionsAnswered only increments on correct answers, so if any
        // questions were skipped earlier, it lags behind the real position.
        // currentQuestionNumber is advanced by BOTH answers AND skips, making
        // it the reliable source of truth for "where are we in the set".
        const isLastQuestion = currentQuestionNumber >= QUESTIONS_PER_SET;

        if (isLastQuestion) {
          // Team completed all questions - mark as completed
          console.log(
            `🏆 Team completed all ${QUESTIONS_PER_SET} questions! Final prize: Rs.${newPrize}`,
          );

          const completeResult = await completeTeam(
            currentTeamId,
            newPrize,
            currentQuestionNumber,
          );

          if (!completeResult.success) {
            throw new Error('Failed to mark team as completed');
          }

          console.log(`✅ Team marked as completed with prize Rs.${newPrize}`);

          // Check if this was the last team — if so, complete the game automatically
          const playQueue = useGameStore.getState().playQueue;
          if (isLastTeamInQueue(currentTeamId, playQueue)) {
            console.log(
              '🏁 Last team completed — ending game automatically...',
            );
            const completeGameAction = useGameStore.getState().completeGame;
            await completeGameAction();
            console.log('✅ Game completed automatically');
          }
        } else {
          // Team progresses to next question
          const updateResult = await moveToNextQuestion(
            currentTeamId,
            newPrize,
          );

          if (!updateResult.success) {
            throw new Error('Failed to update team progress');
          }

          console.log(
            `🎉 Team advanced to question ${currentQuestionNumber + 1}! Prize: Rs.${newPrize}`,
          );
        }
      } else {
        // INCORRECT ANSWER FLOW — WWBAM rules: wrong answer = immediate elimination
        console.log('❌ Incorrect answer! Eliminating team (WWBAM rules)...');

        const eliminateResult = await eliminateTeam(currentTeamId);

        if (!eliminateResult.success) {
          throw new Error('Failed to eliminate team');
        }

        console.log(`🚫 Team ${currentTeamId} eliminated`);

        // Check if this was the last team — if so, complete the game automatically
        const playQueue = useGameStore.getState().playQueue;
        if (isLastTeamInQueue(currentTeamId, playQueue)) {
          console.log('🏁 Last team eliminated — ending game automatically...');
          const completeGameAction = useGameStore.getState().completeGame;
          await completeGameAction();
          console.log('✅ Game completed automatically');
        }
      }

      setIsLocking(false);
    } catch (err) {
      console.error('Failed to lock answer:', err);
      setLockError(err.message);
      setIsLocking(false);
      throw err;
    }
  }, [
    validateSelectedAnswer,
    currentTeamId,
    currentQuestionNumber,
    prizeStructure,
    moveToNextQuestion,
    completeTeam,
    eliminateTeam,
    currentTeam,
  ]);

  /**
   * Can lock answer?
   * Only if answer is selected and not already locked
   */
  const canLock =
    !!selectedAnswer && !validationResult && !isLocking && !!hostQuestion;

  return {
    // State
    selectedAnswer,
    validationResult,
    isLocking,
    canLock,
    error: lockError,

    // Actions
    selectAnswer,
    clearSelection,
    lockAnswer,
  };
}
