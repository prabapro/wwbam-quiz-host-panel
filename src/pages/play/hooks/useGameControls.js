// src/pages/play/hooks/useGameControls.js

import { useMemo, useCallback } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { GAME_STATUS } from '@constants/gameStates';
import { TEAM_STATUS } from '@constants/teamStates';
import { QUESTIONS_PER_SET } from '@constants/config';
import { useCurrentQuestion } from './useCurrentQuestion';

/**
 * Check if current team is the last team in play queue
 * @param {string} teamId - Team ID
 * @param {string[]} queue - Play queue array
 * @returns {boolean}
 */
const isLastTeamInQueue = (teamId, queue) => {
  if (!queue || queue.length === 0) return false;
  return queue.indexOf(teamId) === queue.length - 1;
};

/**
 * useGameControls Hook
 *
 * Purpose: Smart button state management for game control buttons
 *
 * Responsibilities:
 * - Calculate enabled/disabled state for each control button
 * - Provide handlers for each control action
 * - Track operation states (loading, error)
 * - Enforce game flow rules
 *
 * Button State Rules:
 * - Load Question: Enabled when team is active, data is ready, and no pending result
 * - Push to Display: Enabled when question loaded, not visible, not revealed
 * - Hide Question: Enabled when question visible and not revealed
 * - Next Team: Enabled when team is eliminated or completed
 * - Skip Question: Enabled when game is active, question is loaded, and answer not yet validated
 * - Pause/Resume: Based on current game status
 *
 * NOTE: Skip confirmation (previously window.confirm) is now handled by
 * SkipQuestionDialog in GameControls. This hook exposes `executeSkipQuestion`
 * as the raw action — no confirmation logic here.
 */
export function useGameControls() {
  // ============================================================
  // STORE SUBSCRIPTIONS
  // ============================================================

  // Game Store
  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const isDataReady = useGameStore((state) => state.isDataReady);
  const isSyncingData = useGameStore((state) => state.isSyncingData);
  const ensureDataReady = useGameStore((state) => state.ensureDataReady);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const nextTeam = useGameStore((state) => state.nextTeam);
  const skipQuestion = useGameStore((state) => state.skipQuestion);
  const completeGame = useGameStore((state) => state.completeGame);

  // Questions Store
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const validationResult = useQuestionsStore((state) => state.validationResult);
  const clearHostQuestion = useQuestionsStore(
    (state) => state.clearHostQuestion,
  );

  // Teams Store
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];
  const skipTeamQuestion = useTeamsStore((state) => state.skipTeamQuestion);
  const completeTeam = useTeamsStore((state) => state.completeTeam);

  // Current Question Hook
  const {
    loadQuestion,
    showQuestion,
    hideQuestion,
    clearQuestion,
    isLoading: questionLoading,
    error: questionError,
  } = useCurrentQuestion();

  // ============================================================
  // BUTTON STATE CALCULATIONS
  // ============================================================

  /**
   * Can Load Question?
   * Enabled when:
   * - Game is active
   * - Current team exists AND is still active (not eliminated or completed)
   * - Game data is ready
   * - Current team has a question set assigned
   * - Question number hasn't exceeded the max
   * - No question loaded yet, OR previous answer has been validated
   */
  const canLoadQuestion = useMemo(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) return false;
    if (!currentTeam) return false;

    if (
      currentTeam.status === TEAM_STATUS.ELIMINATED ||
      currentTeam.status === TEAM_STATUS.COMPLETED
    ) {
      return false;
    }

    if (currentQuestionNumber >= QUESTIONS_PER_SET) return false;

    if (!isDataReady) {
      console.log('⏳ Game data not ready yet - cannot load question');
      return false;
    }

    const hasQuestionSet = questionSetAssignments?.[currentTeamId];
    if (!hasQuestionSet) {
      console.log(
        `⚠️ No question set assigned to current team: ${currentTeamId}`,
      );
      return false;
    }

    return !hostQuestion || !!validationResult;
  }, [
    gameStatus,
    currentTeam,
    currentQuestionNumber,
    hostQuestion,
    validationResult,
    isDataReady,
    questionSetAssignments,
    currentTeamId,
  ]);

  /**
   * Get next question number to load
   */
  const nextQuestionNumber = useMemo(() => {
    if (!hostQuestion) return currentQuestionNumber + 1 || 1;
    return currentQuestionNumber + 1;
  }, [hostQuestion, currentQuestionNumber]);

  /**
   * Can Push to Display?
   * - Question is loaded (host view)
   * - Question is not yet visible to public
   * - Answer has not been revealed
   */
  const canShowQuestion = useMemo(() => {
    return !!hostQuestion && !questionVisible && !answerRevealed;
  }, [hostQuestion, questionVisible, answerRevealed]);

  /**
   * Can Hide Question?
   * - Question is visible to public
   * - Answer has not been revealed yet
   */
  const canHideQuestion = useMemo(() => {
    return questionVisible && !answerRevealed;
  }, [questionVisible, answerRevealed]);

  /**
   * Can Next Team?
   * - Current team is eliminated OR completed
   * - There are more teams in queue
   */
  const canNextTeam = useMemo(() => {
    if (!currentTeam) return false;

    const isTerminal =
      currentTeam.status === TEAM_STATUS.ELIMINATED ||
      currentTeam.status === TEAM_STATUS.COMPLETED;

    const currentIndex = playQueue.indexOf(currentTeamId);
    const hasNextTeam = currentIndex < playQueue.length - 1;

    return isTerminal && hasNextTeam;
  }, [currentTeam, playQueue, currentTeamId]);

  /**
   * Can Skip Question?
   * - Game is active
   * - A question is currently loaded
   * - Answer has NOT already been validated (nothing left to skip)
   * - Team is still actively playing (not already in a terminal state)
   */
  const canSkipQuestion = useMemo(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) return false;
    if (!hostQuestion) return false;
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!validationResult) return false; // Answer already validated — skip is irrelevant
    if (!currentTeam || currentTeam.status !== TEAM_STATUS.ACTIVE) return false;
    return true;
  }, [gameStatus, hostQuestion, validationResult, currentTeam]);

  /**
   * Is the currently loaded question the last one for this team?
   * Used by SkipQuestionDialog to show an extra warning.
   */
  const isCurrentQuestionLast = useMemo(() => {
    return currentQuestionNumber >= QUESTIONS_PER_SET;
  }, [currentQuestionNumber]);

  /**
   * Can Pause?
   * - Game is active
   */
  const canPause = useMemo(() => {
    return gameStatus === GAME_STATUS.ACTIVE;
  }, [gameStatus]);

  /**
   * Can Resume?
   * - Game is paused
   */
  const canResume = useMemo(() => {
    return gameStatus === GAME_STATUS.PAUSED;
  }, [gameStatus]);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Load next question from localStorage
   * Clears previous question state first
   */
  const handleLoadQuestion = async () => {
    try {
      if (!isDataReady) {
        console.log('⏳ Data not ready - attempting to sync from Firebase...');
        const syncResult = await ensureDataReady();

        if (!syncResult.success) {
          throw new Error(
            syncResult.error ||
              'Failed to sync game data. Please refresh the page.',
          );
        }

        console.log('✅ Data synced successfully');
      }

      const questionSetId = questionSetAssignments?.[currentTeamId];
      if (!questionSetId) {
        throw new Error(
          `No question set assigned to team. Please reinitialize the game or check Firebase data.`,
        );
      }

      console.log(
        `📖 Loading question ${nextQuestionNumber} for team ${currentTeamId}`,
      );
      console.log(`📚 Question set: ${questionSetId}`);

      clearQuestion();
      clearHostQuestion();

      await loadQuestion(nextQuestionNumber);

      console.log('✅ Question loaded successfully');
    } catch (err) {
      console.error('Failed to load question:', err);
      const userMessage =
        err.message || 'Failed to load question. Please try again.';
      throw new Error(userMessage, { cause: err });
    }
  };

  /**
   * Push question to public display (Firebase)
   */
  const handleShowQuestion = async () => {
    try {
      await showQuestion();
    } catch (err) {
      console.error('Failed to Push to Display:', err);
      throw err;
    }
  };

  /**
   * Hide question from public display
   */
  const handleHideQuestion = async () => {
    try {
      await hideQuestion();
    } catch (err) {
      console.error('Failed to hide question:', err);
      throw err;
    }
  };

  /**
   * Move to next team (after elimination/completion)
   */
  const handleNextTeam = () => {
    nextTeam();
    clearQuestion();
    clearHostQuestion();
    console.log('✅ Moved to next team');
  };

  /**
   * Execute skip — raw action without confirmation.
   *
   * Confirmation is handled upstream by SkipQuestionDialog in GameControls.
   * This function is called only after the host has confirmed.
   *
   * Full flow:
   * 1. Hides question from public display if currently visible
   * 2. Clears question state in game store (counter stays)
   * 3. Advances team's question index (no prize credit for skip)
   * 4. If skipped question was the team's LAST question:
   *    → marks team as COMPLETED with their current prize
   *    → if that team was also the LAST in queue → completes the game
   * 5. Clears host-side question state
   *
   * @returns {Promise<void>}
   */
  const executeSkipQuestion = useCallback(async () => {
    try {
      // Snapshot current state before any async operations
      const teamIdSnapshot = useGameStore.getState().currentTeamId;
      const queueSnapshot = useGameStore.getState().playQueue;
      const teamSnapshot = useTeamsStore.getState().teams[teamIdSnapshot];

      // Step 1: Retract from public display if currently visible
      if (questionVisible) {
        await hideQuestion();
        console.log('🙈 Retracted question from public display before skip');
      }

      // Step 2: Clear question state in game store (counter stays — it already
      // holds the loaded question's number; incrementing here would skip the next)
      const gameSkipResult = await skipQuestion();
      if (!gameSkipResult.success) {
        throw new Error(
          gameSkipResult.error || 'Failed to clear question state',
        );
      }

      // Step 3: Advance team's question index (no reward for skip)
      const teamSkipResult = await skipTeamQuestion(teamIdSnapshot);
      if (!teamSkipResult.success) {
        throw new Error(
          teamSkipResult.error || 'Failed to update team question index',
        );
      }

      // Step 4: Clear host-side question state
      clearQuestion();
      clearHostQuestion();

      // Step 5: If this was the team's last question, mark them as completed.
      // currentQuestionNumber already holds the skipped question's number
      // (skipQuestion does NOT increment it), so it's the reliable position.
      const skippedQuestionNumber =
        useGameStore.getState().currentQuestionNumber;
      const isLastQuestion = skippedQuestionNumber >= QUESTIONS_PER_SET;

      if (isLastQuestion) {
        const finalPrize = teamSnapshot?.currentPrize ?? 0;
        const finalQuestionIndex = teamSnapshot?.currentQuestionIndex ?? 0;

        const completeResult = await completeTeam(
          teamIdSnapshot,
          finalPrize,
          finalQuestionIndex,
        );

        if (!completeResult.success) {
          throw new Error('Failed to mark team as completed after last skip');
        }

        console.log(
          `🏁 Team ${teamIdSnapshot} marked completed after skipping last question (prize: Rs.${finalPrize})`,
        );

        // Step 6: If this was also the last team in queue, end the game
        if (isLastTeamInQueue(teamIdSnapshot, queueSnapshot)) {
          const gameCompleteResult = await completeGame();
          if (!gameCompleteResult.success) {
            throw new Error('Failed to complete game after last team finished');
          }
          console.log('🏆 Game completed automatically — all teams finished');
        }
      }

      console.log('⏭️ Question skipped successfully');
    } catch (err) {
      console.error('Failed to skip question:', err);
      throw err;
    }
  }, [
    questionVisible,
    hideQuestion,
    skipQuestion,
    skipTeamQuestion,
    clearQuestion,
    clearHostQuestion,
    completeTeam,
    completeGame,
  ]);

  /**
   * Pause game
   */
  const handlePause = () => {
    pauseGame();
    console.log('⏸️ Game paused');
  };

  /**
   * Resume game
   */
  const handleResume = () => {
    resumeGame();
    console.log('▶️ Game resumed');
  };

  return {
    // Button States
    canLoadQuestion,
    canShowQuestion,
    canHideQuestion,
    canNextTeam,
    canSkipQuestion,
    canPause,
    canResume,

    // Question Number
    nextQuestionNumber,
    isCurrentQuestionLast,

    // Loading States
    isLoading: questionLoading || isSyncingData,
    error: questionError,

    // Data Ready State (for UI feedback)
    isDataReady,
    isSyncingData,

    // Handlers
    handleLoadQuestion,
    handleShowQuestion,
    handleHideQuestion,
    handleNextTeam,
    executeSkipQuestion,
    handlePause,
    handleResume,
  };
}
