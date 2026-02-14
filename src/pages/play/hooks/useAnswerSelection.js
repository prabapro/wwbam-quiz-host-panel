// src/pages/play/hooks/useAnswerSelection.js

import { useState, useCallback } from 'react';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { getPrizeForQuestion } from '@utils/gameplay/scoreCalculation';
import { databaseService } from '@services/database.service';

/**
 * useAnswerSelection Hook
 *
 * Purpose: Manage answer selection, validation, and result handling
 *
 * Responsibilities:
 * - Track selected answer (A/B/C/D)
 * - Validate answer against correct answer from localStorage
 * - Handle answer locking (trigger validation)
 * - Manage validation result state
 * - Update team prize on correct answer
 * - Handle incorrect answer flow (lifeline offer or elimination)
 *
 * Answer Flow:
 * 1. Team announces answer verbally
 * 2. Host selects option (A/B/C/D) via AnswerPad
 * 3. Selected answer stored in local state (NOT synced to Firebase)
 * 4. Host clicks "Lock Answer"
 * 5. Hook validates against correct answer from localStorage
 * 6. If correct: Update prize, increment question, celebrate
 * 7. If incorrect: Check lifelines → offer or eliminate
 * 8. Sync result to Firebase (reveal answer, update team)
 */
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
      await databaseService.revealAnswer(correctAnswer);

      if (isCorrect) {
        // CORRECT ANSWER FLOW
        console.log('✅ Correct answer! Updating team progress...');

        // Calculate new prize
        const newPrize = getPrizeForQuestion(
          currentQuestionNumber,
          prizeStructure,
        );

        // Update team progress (increments question, updates prize)
        const updateResult = await moveToNextQuestion(currentTeamId, newPrize);

        if (!updateResult.success) {
          throw new Error('Failed to update team progress');
        }

        console.log(`🎉 Team advanced! New prize: Rs.${newPrize}`);
      } else {
        // INCORRECT ANSWER FLOW
        console.log('❌ Incorrect answer! Checking lifelines...');

        // Check if team has available lifelines
        const hasLifelines =
          currentTeam?.lifelines?.phoneAFriend ||
          currentTeam?.lifelines?.fiftyFifty;

        if (hasLifelines) {
          console.log(
            '💡 Team has lifelines available - host can offer or eliminate',
          );
          // Host will manually choose to offer lifeline or eliminate
          // This is a manual decision, not automatic
        } else {
          console.log('❌ No lifelines available - team will be eliminated');
          // Auto-elimination will be handled by host clicking "Eliminate Team"
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
