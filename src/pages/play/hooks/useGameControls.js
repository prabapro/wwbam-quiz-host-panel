// src/pages/play/hooks/useGameControls.js

import { useMemo, useCallback, useState } from 'react';
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
 *
 * UPDATED (BUG FIX - 2026/02/22):
 * - handleNextTeam is now async and properly awaits nextTeam() so that
 *   Zustand state (currentTeamId) is guaranteed to be updated before the
 *   host can click "Load Question 1". Previously nextTeam() was called
 *   fire-and-forget, creating a race where the Zustand set() inside nextTeam()
 *   (which happens only AFTER the first Firebase write resolves) hadn't run yet,
 *   causing getFreshQuestionSetAssignment() to read the old team's ID.
 * - Added handleSyncQuestions() for mid-game recovery of question set assignments
 *   without requiring a page reload.
 *
 * UPDATED (BUG FIX - canLoadQuestion after sync recovery):
 * - Removed `hasQuestionSetForCurrentTeam` from the `canLoadQuestion` guard.
 *
 *   The previous approach attempted to gate the button on whether the assignment
 *   was already in-memory. This created a hard lock: if the assignment was missing
 *   (the exact failure mode we were recovering from), the button stayed permanently
 *   disabled even after syncQuestionSets() wrote fresh data into the store — because
 *   the Firebase realtime listener firing on its own write acknowledgement could race
 *   against the reactive selector and miss the intermediate `true` state.
 *
 *   The root cause was that the guard was in the wrong layer. Assignment resolution
 *   is handled correctly and robustly inside:
 *     handleLoadQuestion → loadQuestion → getFreshQuestionSetAssignment()
 *   which reads via useGameStore.getState() (always live, never stale) and falls
 *   back to a direct Firebase fetch if still missing. If it genuinely cannot resolve
 *   an assignment, it throws and the error surfaces to the host via `questionError`
 *   — which is better UX than a silently disabled button.
 *
 *   `hasQuestionSetForCurrentTeam` is still subscribed and returned from this hook
 *   so GameControls can show a non-blocking warning indicator on the button when
 *   the assignment appears to be missing — informing the host without preventing action.
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

  // Subscribed as a reactive selector so GameControls can show a warning badge
  // when the assignment appears to be missing. Does NOT gate the Load button —
  // see the canLoadQuestion comment above for the reasoning.
  const hasQuestionSetForCurrentTeam = useGameStore((state) =>
    Boolean(state.questionSetAssignments?.[state.currentTeamId]),
  );

  const isDataReady = useGameStore((state) => state.isDataReady);
  const isSyncingData = useGameStore((state) => state.isSyncingData);
  const ensureDataReady = useGameStore((state) => state.ensureDataReady);
  const syncQuestionSets = useGameStore((state) => state.syncQuestionSets);
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
  // SYNC STATE (for mid-game question set recovery)
  // ============================================================

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // ============================================================
  // BUTTON STATE CALCULATIONS
  // ============================================================

  /**
   * Can Load Question?
   * Enabled when:
   * - Game is active
   * - Current team exists AND is still active (not eliminated or completed)
   * - Game data is ready
   * - Question number hasn't exceeded the max
   * - No question loaded yet, OR previous answer has been validated
   *
   * NOTE: We deliberately do NOT check `hasQuestionSetForCurrentTeam` here.
   * If the assignment is missing in-memory, getFreshQuestionSetAssignment()
   * inside loadQuestion() will self-resolve it via Firebase fallback. Gating
   * on the in-memory state creates an unrecoverable disabled button during the
   * exact failure scenario (missing assignment) this feature exists to fix.
   * The host sees a warning indicator on the button instead (via GameControls).
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

    return !hostQuestion || !!validationResult;
  }, [
    gameStatus,
    currentTeam,
    currentQuestionNumber,
    hostQuestion,
    validationResult,
    isDataReady,
  ]);

  /**
   * Get next question number to load
   */
  const nextQuestionNumber = useMemo(() => {
    if (!hostQuestion) return currentQuestionNumber + 1 || 1;
    return currentQuestionNumber + 1;
  }, [hostQuestion, currentQuestionNumber]);

  /**
   * Is the NEXT question to be loaded the last one?
   * Used by GameControls to show "Load Last Question" label instead of "Load Question X".
   */
  const isNextQuestionLast = useMemo(() => {
    return nextQuestionNumber === QUESTIONS_PER_SET;
  }, [nextQuestionNumber]);

  /**
   * Is the currently loaded question the last one for this team?
   * Used by SkipQuestionDialog to show an extra warning.
   */
  const isCurrentQuestionLast = useMemo(() => {
    return currentQuestionNumber >= QUESTIONS_PER_SET;
  }, [currentQuestionNumber]);

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
   * Load next question for the current team.
   *
   * Assignment resolution is handled entirely inside:
   *   loadQuestion → getFreshQuestionSetAssignment()
   * which reads from useGameStore.getState() (always live) and falls back to a
   * direct Firebase fetch if still not found. That path is the single source of
   * truth for assignment resolution — no pre-check needed here.
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

      console.log(
        `📖 Loading question ${nextQuestionNumber} for team ${currentTeamId}`,
      );

      clearQuestion();
      clearHostQuestion();

      // getFreshQuestionSetAssignment() inside loadQuestion() handles
      // assignment resolution via getState() + Firebase fallback
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
   * Move to next team (after elimination/completion).
   *
   * BUG FIX: Now async and properly awaited.
   * Previously nextTeam() was called fire-and-forget. The Zustand set() inside
   * nextTeam() only runs AFTER the first internal await (updateTeam → Firebase),
   * so if the host clicked "Load Question 1" quickly after "Next Team", the
   * currentTeamId in the store was still the old team, causing a stale lookup.
   *
   * Awaiting nextTeam() ensures the Zustand state is committed before
   * clearQuestion()/clearHostQuestion() run — guaranteeing that any subsequent
   * "Load Question" click reads the correct (new) team ID.
   */
  const handleNextTeam = useCallback(async () => {
    try {
      const result = await nextTeam();

      if (!result.success) {
        throw new Error(result.error || 'Failed to advance to next team');
      }

      clearQuestion();
      clearHostQuestion();

      console.log(`✅ Advanced to team: ${result.nextTeamId}`);
    } catch (err) {
      console.error('Failed to advance to next team:', err);
      throw err;
    }
  }, [nextTeam, clearQuestion, clearHostQuestion]);

  /**
   * Execute skip question (no confirmation — handled by SkipQuestionDialog).
   */
  const executeSkipQuestion = useCallback(async () => {
    try {
      // Snapshot values before any async ops (avoids stale closure)
      const teamIdSnapshot = currentTeamId;
      const teamSnapshot = currentTeam;
      const queueSnapshot = playQueue;

      // Step 1: Hide question from public display if currently visible
      if (questionVisible) {
        await hideQuestion();
      }

      // Step 2: Skip the question in the game store (clears state + Firebase)
      const skipResult = await skipQuestion();
      if (!skipResult.success) {
        throw new Error(skipResult.error || 'Failed to skip question');
      }

      // Step 3: Record the skip on the team
      const skipTeamResult = await skipTeamQuestion(teamIdSnapshot);
      if (!skipTeamResult.success) {
        throw new Error(
          skipTeamResult.error || 'Failed to record skip on team',
        );
      }

      clearQuestion();
      clearHostQuestion();

      // Step 4: If this was the last question, complete the team
      if (skipTeamResult.isLastQuestion) {
        const { usePrizeStore } = await import('@stores/usePrizeStore');
        const prizeStructure = usePrizeStore.getState().prizeStructure;
        const questionIndex = teamSnapshot?.currentQuestionIndex ?? 0;
        const finalPrize =
          questionIndex > 0
            ? (prizeStructure[questionIndex - 1]?.amount ?? 0)
            : 0;
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

        // Step 5: If this was also the last team in queue, end the game
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
    currentTeamId,
    currentTeam,
    playQueue,
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

  /**
   * Sync question sets mid-game.
   *
   * Calls syncQuestionSets() from the game store which:
   * 1. Fetches fresh questionSetAssignments from Firebase
   * 2. Pre-loads all question sets in the play queue
   *
   * Exposes isSyncing / syncError / syncSuccess for UI feedback in GameControls
   * so the host knows the operation outcome without checking the console.
   */
  const handleSyncQuestions = useCallback(async () => {
    setSyncError(null);
    setSyncSuccess(false);
    setIsSyncing(true);

    try {
      const result = await syncQuestionSets();

      if (result.success) {
        console.log(
          `✅ Manual sync complete: ${result.setsLoaded} set(s) loaded`,
        );
        setSyncSuccess(true);

        // Auto-clear the success badge after 4 seconds
        setTimeout(() => setSyncSuccess(false), 4000);
      } else {
        console.error('❌ Manual sync failed:', result.error);
        setSyncError(result.error || 'Sync failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Sync threw an unexpected error:', err);
      setSyncError(err.message || 'An unexpected error occurred during sync.');
    } finally {
      setIsSyncing(false);
    }
  }, [syncQuestionSets]);

  return {
    // Button States
    canLoadQuestion,
    canShowQuestion,
    canHideQuestion,
    canNextTeam,
    canSkipQuestion,
    canPause,
    canResume,

    // Question Numbers & Flags
    nextQuestionNumber,
    isNextQuestionLast,
    isCurrentQuestionLast,

    // False when the current team has no question set in local state.
    // GameControls shows a warning indicator on "Load Question" if false —
    // the button stays enabled since Firebase may still have the assignment.
    hasQuestionSetForCurrentTeam,

    // Loading States
    isLoading: questionLoading || isSyncingData,
    error: questionError,

    // Data Ready State (for UI feedback)
    isDataReady,
    isSyncingData,

    // Sync State (for mid-game recovery button)
    isSyncing,
    syncError,
    syncSuccess,

    // Handlers
    handleLoadQuestion,
    handleShowQuestion,
    handleHideQuestion,
    handleNextTeam,
    executeSkipQuestion,
    handlePause,
    handleResume,
    handleSyncQuestions,
  };
}
