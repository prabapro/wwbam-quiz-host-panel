// src/pages/play/hooks/useAnswerSelection.js

import { useState, useEffect, useCallback } from 'react';
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
 * Manages the 3-phase answer selection flow, mirroring the real WWBAM show:
 *
 * ── Phase 1: SELECTING ──────────────────────────────────────────────────────
 *   Host clicks A/B/C/D → option highlighted locally only.
 *   "Lock Answer" sends the choice to Firebase (selectedOption written).
 *   Display shows the option in amber — audience sees the team's choice.
 *
 * ── Phase 2: LOCKED (deliberation) ─────────────────────────────────────────
 *   `isLocked = true` locally. Firebase has `selected-option` set.
 *   Host can discuss, debate, reconsider with participants.
 *   "Change Answer" → clears Firebase selectedOption, returns to Phase 1.
 *   "Confirm Answer" → validates + reveals + triggers all team/game updates.
 *
 * ── Phase 3: CONFIRMED (revealed) ──────────────────────────────────────────
 *   `validationResult` set in store. Firebase has `answer-revealed: true`.
 *   Correct/wrong colours shown on display and host panel.
 *   No further changes allowed until next question is loaded.
 *
 * Security note: correct answer validation always happens locally from the
 * host-only `question-sets` node — never from Firebase game-state.
 */

/**
 * @param {string} currentTeamId
 * @param {Array} playQueue
 * @returns {boolean}
 */
const isLastTeamInQueue = (currentTeamId, playQueue) => {
  if (!playQueue || playQueue.length === 0) return false;
  return playQueue.indexOf(currentTeamId) === playQueue.length - 1;
};

export function useAnswerSelection() {
  // ── Local async-operation flags ────────────────────────────────────────────
  const [isLocking, setIsLocking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [actionError, setActionError] = useState(null);

  // ── Questions Store ────────────────────────────────────────────────────────
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

  // ── Reset local lock state when a new question is loaded ──────────────────
  //
  // hostQuestion?.id changing (or becoming null) is the authoritative signal
  // that loadQuestion() ran. isLocked is purely local state and must not carry
  // over from the previous question — otherwise Phase 2 UI persists on a fresh
  // question where no answer has been locked yet.
  useEffect(() => {
    setIsLocked(false);
    setIsLocking(false);
    setIsConfirming(false);
    setActionError(null);
  }, [hostQuestion?.id]);

  // ── Game Store ─────────────────────────────────────────────────────────────
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);

  // ── Teams Store ────────────────────────────────────────────────────────────
  const moveToNextQuestion = useTeamsStore((state) => state.moveToNextQuestion);
  const completeTeam = useTeamsStore((state) => state.completeTeam);
  const eliminateTeam = useTeamsStore((state) => state.eliminateTeam);

  // ── Prize Store ────────────────────────────────────────────────────────────
  const prizeStructure = usePrizeStore((state) => state.prizeStructure);

  // ============================================================
  // PHASE 1 ACTIONS — Selecting
  // ============================================================

  /**
   * Select an answer option (A/B/C/D).
   * Stored locally only — not synced to Firebase until lockAnswer() is called.
   * Can be called freely until the answer is locked.
   */
  const selectAnswer = useCallback(
    (option) => {
      // Disallow changes once locked (or after confirmation)
      if (isLocked || validationResult) return;

      const result = selectAnswerAction(option);
      if (!result.success) {
        console.warn('Invalid answer selection:', result.error);
      }
      setActionError(null);
    },
    [isLocked, validationResult, selectAnswerAction],
  );

  /**
   * Clear the selected answer (only available in phase 1).
   */
  const clearSelection = useCallback(() => {
    if (isLocked || validationResult) return;
    clearSelectedAnswer();
    setActionError(null);
  }, [isLocked, validationResult, clearSelectedAnswer]);

  // ============================================================
  // PHASE 1 → 2 — Lock Answer
  // ============================================================

  /**
   * Lock the selected answer.
   *
   * Writes `selected-option` to Firebase so the public display immediately
   * shows the chosen option highlighted in amber (deliberation state).
   * Does NOT validate or reveal — that only happens on confirmAnswer().
   */
  const lockAnswer = useCallback(async () => {
    if (!selectedAnswer || isLocked || isLocking || !hostQuestion) return;

    setIsLocking(true);
    setActionError(null);

    try {
      await databaseService.lockAnswerSelection(selectedAnswer);
      setIsLocked(true);
      console.log(
        `🔒 Answer locked: ${selectedAnswer} — awaiting host confirmation`,
      );
    } catch (err) {
      console.error('Failed to lock answer:', err);
      setActionError(err.message);
    } finally {
      setIsLocking(false);
    }
  }, [selectedAnswer, isLocked, isLocking, hostQuestion]);

  // ============================================================
  // PHASE 2 → 1 — Change Answer (undo lock)
  // ============================================================

  /**
   * Undo the lock and return to Phase 1.
   *
   * Clears `selected-option` in Firebase so the display goes back to default
   * state. The previously selected option remains highlighted in the host panel
   * so the host can easily re-lock the same choice or pick a different one.
   */
  const changeAnswer = useCallback(async () => {
    if (!isLocked || isConfirming || validationResult) return;

    setIsLocking(true);
    setActionError(null);

    try {
      await databaseService.clearLockedAnswer();
      setIsLocked(false);
      console.log('↩️ Lock released — host can change selection');
    } catch (err) {
      console.error('Failed to clear locked answer:', err);
      setActionError(err.message);
    } finally {
      setIsLocking(false);
    }
  }, [isLocked, isConfirming, validationResult]);

  // ============================================================
  // PHASE 2 → 3 — Confirm Answer (final)
  // ============================================================

  /**
   * Confirm the locked answer — this is the final, irreversible action.
   *
   * Flow:
   * 1. Validate locally against the correct answer (host-only data)
   * 2. Reveal answer in Firebase (answerRevealed: true + correctOption)
   * 3. If correct: update prize, advance question (or complete team)
   * 4. If incorrect: eliminate team (WWBAM rules), auto-complete if last team
   */
  const confirmAnswer = useCallback(async () => {
    if (!isLocked || isConfirming || validationResult || !hostQuestion) return;

    setIsConfirming(true);
    setActionError(null);

    try {
      // Step 1: Local validation (reads from host-only question-sets node)
      const validation = validateSelectedAnswer();

      if (!validation.success) {
        throw new Error(validation.error || 'Validation failed');
      }

      const { result } = validation;
      const { isCorrect, correctAnswer } = result;

      // Step 2: Reveal answer on Firebase (triggers correct/wrong colours on display)
      await databaseService.revealAnswer(
        correctAnswer,
        result.selectedAnswer,
        isCorrect,
      );

      // Step 3: Update team/game state
      if (isCorrect) {
        console.log('✅ Correct answer confirmed! Updating team progress...');

        const newPrize = getPrizeForQuestion(
          currentQuestionNumber,
          prizeStructure,
        );

        // Use currentQuestionNumber (not questionsAnswered) — it advances on
        // both correct answers AND skips, making it the reliable position marker.
        const isLastQuestion = currentQuestionNumber >= QUESTIONS_PER_SET;

        if (isLastQuestion) {
          console.log(`🏆 Team completed all ${QUESTIONS_PER_SET} questions!`);
          await completeTeam(currentTeamId, newPrize, currentQuestionNumber);

          // Auto-complete game if this was the last team in the queue.
          // completeGame() sets gameStatus = COMPLETED, which triggers
          // GameCompletedDialog in GameControls via its useEffect.
          const playQueue = useGameStore.getState().playQueue;
          if (isLastTeamInQueue(currentTeamId, playQueue)) {
            console.log(
              '🏁 Last team completed — ending game automatically...',
            );
            await useGameStore.getState().completeGame();
            console.log('✅ Game completed automatically');
          }
        } else {
          console.log(`✅ Team advances. New prize: Rs.${newPrize}`);
          await moveToNextQuestion(currentTeamId, newPrize);
        }
      } else {
        // INCORRECT — immediate elimination (WWBAM rules)
        console.log(
          '❌ Incorrect answer confirmed! Eliminating team (WWBAM rules)...',
        );

        const eliminateResult = await eliminateTeam(currentTeamId);
        if (!eliminateResult.success) {
          throw new Error('Failed to eliminate team');
        }

        console.log(`🚫 Team ${currentTeamId} eliminated`);

        // Auto-complete game if this was the last team
        const playQueue = useGameStore.getState().playQueue;
        if (isLastTeamInQueue(currentTeamId, playQueue)) {
          console.log('🏁 Last team eliminated — ending game automatically...');
          await useGameStore.getState().completeGame();
          console.log('✅ Game completed automatically');
        }
      }
    } catch (err) {
      console.error('Failed to confirm answer:', err);
      setActionError(err.message);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  }, [
    isLocked,
    isConfirming,
    validationResult,
    hostQuestion,
    validateSelectedAnswer,
    currentTeamId,
    currentQuestionNumber,
    prizeStructure,
    moveToNextQuestion,
    completeTeam,
    eliminateTeam,
  ]);

  // ============================================================
  // DERIVED FLAGS
  // ============================================================

  /** Phase 1: can lock → answer selected, not yet locked, question visible */
  const canLock =
    !!selectedAnswer &&
    !isLocked &&
    !isLocking &&
    !!hostQuestion &&
    questionVisible &&
    !validationResult;

  /** Phase 2: can confirm → locked, not already confirming/confirmed */
  const canConfirm = isLocked && !isConfirming && !validationResult;

  /** Phase 2: can change → locked, not busy */
  const canChange =
    isLocked && !isConfirming && !isLocking && !validationResult;

  // ── Expose current phase for UI consumption ──────────────────────────────
  const phase = validationResult
    ? 'confirmed'
    : isLocked
      ? 'locked'
      : 'selecting';

  return {
    // State
    selectedAnswer,
    validationResult,
    isLocked,
    isLocking,
    isConfirming,
    phase,
    error: actionError,

    // Phase flags
    canLock,
    canConfirm,
    canChange,

    // Actions
    selectAnswer,
    clearSelection,
    lockAnswer,
    changeAnswer,
    confirmAnswer,
  };
}
