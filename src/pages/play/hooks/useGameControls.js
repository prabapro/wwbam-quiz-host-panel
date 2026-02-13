// src/pages/play/hooks/useGameControls.js

import { useMemo } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { GAME_STATUS } from '@constants/gameStates';
import { TEAM_STATUS } from '@constants/teamStates';
import { useCurrentQuestion } from './useCurrentQuestion';

/**
 * useGameControls Hook
 *
 * Purpose: Smart button state management for game control buttons
 *
 * Responsibilities:
 * - Calculate enabled/disabled state for each control button
 * - Provide handlers for each control action
 * - Track operation states (loading, error)
 * - Enforce game flow rules (can't show question before loading)
 *
 * Button State Rules:
 * - Load Question: Enabled when (no question loaded OR question complete)
 * - Show Question: Enabled when (question loaded AND not visible AND not revealed)
 * - Hide Question: Enabled when (question visible AND not revealed)
 * - Next Question: Enabled when (answer correct AND validated)
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
   * - No question loaded OR answer has been revealed (ready for next)
   * - Game is active
   * - Current question number < 20
   */
  const canLoadQuestion = useMemo(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) return false;
    if (!currentTeam) return false;
    if (currentQuestionNumber >= 20) return false; // Already at max questions

    // Can load if no question OR answer was revealed (ready for next)
    return !hostQuestion || answerRevealed;
  }, [
    gameStatus,
    currentTeam,
    currentQuestionNumber,
    hostQuestion,
    answerRevealed,
  ]);

  /**
   * Can Show Question?
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
   * Can Next Question?
   * - Answer has been validated
   * - Answer was correct
   * - Current question < 20
   */
  const canNextQuestion = useMemo(() => {
    if (!validationResult) return false;
    if (!validationResult.isCorrect) return false;
    if (currentQuestionNumber >= 20) return false;

    return true;
  }, [validationResult, currentQuestionNumber]);

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
    return gameStatus === GAME_STATUS.ACTIVE;
  }, [gameStatus]);

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
   */
  const handleLoadQuestion = async () => {
    try {
      // Load question number = currentQuestionNumber + 1
      const questionNumber = currentQuestionNumber + 1;
      await loadQuestion(questionNumber);
    } catch (err) {
      console.error('Failed to load question:', err);
      throw err;
    }
  };

  /**
   * Show question to public (push to Firebase)
   */
  const handleShowQuestion = async () => {
    try {
      await showQuestion();
    } catch (err) {
      console.error('Failed to show question:', err);
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
   * Move to next question (after correct answer)
   * Clears current question and resets state
   */
  const handleNextQuestion = () => {
    clearQuestion();
    clearHostQuestion();
    console.log('✅ Ready for next question');
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
    canNextQuestion,
    canNextTeam,
    canSkipQuestion,
    canPause,
    canResume,

    // Loading States
    isLoading: questionLoading,
    error: questionError,

    // Handlers
    handleLoadQuestion,
    handleShowQuestion,
    handleHideQuestion,
    handleNextQuestion,
    handleNextTeam,
    handleSkipQuestion,
    handlePause,
    handleResume,
  };
}
