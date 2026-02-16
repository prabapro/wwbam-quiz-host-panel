// src/pages/play/hooks/useGameControls.js

import { useMemo } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { GAME_STATUS } from '@constants/gameStates';
import { TEAM_STATUS } from '@constants/teamStates';
import { QUESTIONS_PER_SET } from '@constants/config';
import { useCurrentQuestion } from './useCurrentQuestion';

/**
 * useGameControls Hook
 *
 * Purpose: Smart button state management for game control buttons
 *
 * UPDATED: Added pre-flight checks for data readiness
 * - Checks isDataReady before allowing question load
 * - Ensures question set assignments are available
 * - Better error handling and user feedback
 *
 * Responsibilities:
 * - Calculate enabled/disabled state for each control button
 * - Provide handlers for each control action
 * - Track operation states (loading, error)
 * - Enforce game flow rules
 *
 * Button State Rules:
 * - Load Question: Enabled when (no question loaded OR answer validated - ready for next)
 * - Push to Display: Enabled when (question loaded AND not visible AND not revealed)
 * - Hide Question: Enabled when (question visible AND not revealed)
 * - Next Team: Enabled when (team eliminated OR completed)
 * - Skip Question: Always enabled (with confirmation)
 * - Pause/Resume: Based on current game status
 */
export function useGameControls() {
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

  // Questions Store
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const validationResult = useQuestionsStore((state) => state.validationResult);
  const clearHostQuestion = useQuestionsStore(
    (state) => state.clearHostQuestion,
  );

  // Teams Store
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

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
   * - Game data is ready (critical check!)
   * - No question loaded yet (start of game or ready for first question)
   * - OR answer has been validated (ready for next question)
   * - AND current question number < QUESTIONS_PER_SET (not at max)
   * - AND game is active
   * - AND current team has a question set assigned
   */
  const canLoadQuestion = useMemo(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) return false;
    if (!currentTeam) return false;
    if (currentQuestionNumber >= QUESTIONS_PER_SET) return false;

    // CRITICAL: Check if data is ready before allowing load
    if (!isDataReady) {
      console.log('⏳ Game data not ready yet - cannot load question');
      return false;
    }

    // Check if current team has a question set assigned
    const hasQuestionSet = questionSetAssignments?.[currentTeamId];
    if (!hasQuestionSet) {
      console.log(
        `⚠️ No question set assigned to current team: ${currentTeamId}`,
      );
      return false;
    }

    // Can load if:
    // 1. No question loaded yet (start of game)
    // 2. OR answer has been validated (ready for next)
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
   * If no question loaded yet, start at 1
   * Otherwise, current + 1
   */
  const nextQuestionNumber = useMemo(() => {
    if (!hostQuestion) {
      // No question loaded yet, start at question 1
      return currentQuestionNumber + 1 || 1;
    }
    // Question loaded, next is current + 1
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

    // Check if there's a next team in queue
    const currentIndex = playQueue.indexOf(currentTeamId);
    const hasNextTeam = currentIndex < playQueue.length - 1;

    return isTerminal && hasNextTeam;
  }, [currentTeam, playQueue, currentTeamId]);

  /**
   * Can Skip Question?
   * - Always enabled (emergency action)
   */
  const canSkipQuestion = useMemo(() => {
    return gameStatus === GAME_STATUS.ACTIVE && !!hostQuestion;
  }, [gameStatus, hostQuestion]);

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
   *
   * UPDATED: Now includes pre-flight check for data readiness
   */
  const handleLoadQuestion = async () => {
    try {
      // Pre-flight check: Ensure data is ready
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

      // Verify question set assignment exists
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

      // Clear previous question state
      clearQuestion();
      clearHostQuestion();

      // Load next question (with defensive fetching)
      await loadQuestion(nextQuestionNumber);

      console.log('✅ Question loaded successfully');
    } catch (err) {
      console.error('Failed to load question:', err);

      // Provide user-friendly error message
      const userMessage =
        err.message || 'Failed to load question. Please try again.';
      throw new Error(userMessage);
    }
  };

  /**
   * Push to Display to public (push to Firebase)
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
   * Hide question from public
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
   * Skip current question (emergency action)
   * Requires confirmation
   */
  const handleSkipQuestion = () => {
    const confirmed = window.confirm(
      'Are you sure you want to skip this question? This action cannot be undone.',
    );

    if (confirmed) {
      clearQuestion();
      clearHostQuestion();
      console.log('⏭️ Question skipped');
    }
  };

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
    nextQuestionNumber, // For dynamic button label

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
    handleSkipQuestion,
    handlePause,
    handleResume,
  };
}
