// src/pages/play/components/GameControls.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameControls } from '../hooks/useGameControls';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { GAME_STATUS } from '@constants/gameStates';
import { TEAM_STATUS } from '@constants/teamStates';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  FileText,
  Eye,
  EyeOff,
  Users,
  SkipForward,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@lib/utils';
import SkipQuestionDialog from './dialogs/SkipQuestionDialog';
import TeamStatusDialog from './dialogs/TeamStatusDialog';
import GameCompletedDialog from './dialogs/GameCompletedDialog';

/**
 * Game Controls Component
 *
 * Purpose: Main control buttons for managing question flow and game progression.
 *
 * Control Buttons (stacked full-width for narrow column):
 * 1. Primary Action   - Context-aware: "Load Question X" → "Load Last Question" → "Next Team"
 * 2. "Push to Display" - Push question to Firebase (visible to public)
 * 3. "Hide Question"  - Retract question from public view
 * 4. "Skip Question"  - Opens SkipQuestionDialog for confirmation
 * 5. "Pause / Resume" - Game state toggles
 *
 * Primary Action button label logic:
 *   - Default:             "Load Question X"
 *   - On second-to-last Q: "Load Question X" (normal)
 *   - On last question:    "Load Last Question"
 *   - After last Q done:   "Next Team" (re-opens TeamStatusDialog)
 *
 * Dialogs mounted here (rendered as portals, visual position irrelevant):
 * - SkipQuestionDialog    — confirms before skipping
 * - TeamStatusDialog      — auto-opens on team elimination/completion
 * - GameCompletedDialog   — auto-opens when game status = COMPLETED
 */
export default function GameControls() {
  const navigate = useNavigate();

  // ============================================================
  // GAME CONTROLS HOOK
  // ============================================================

  const {
    canLoadQuestion,
    canShowQuestion,
    canHideQuestion,
    canNextTeam,
    canSkipQuestion,
    canPause,
    canResume,
    nextQuestionNumber,
    isNextQuestionLast,
    isCurrentQuestionLast,
    isLoading,
    error,
    handleLoadQuestion,
    handleShowQuestion,
    handleHideQuestion,
    handleNextTeam,
    executeSkipQuestion,
    handlePause,
    handleResume,
  } = useGameControls();

  // ============================================================
  // STORE STATE (for dialog data)
  // ============================================================

  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const playQueue = useGameStore((state) => state.playQueue);
  const teams = useTeamsStore((state) => state.teams);

  const currentTeam = teams[currentTeamId];

  // Derive next team info for TeamStatusDialog
  const currentIndex = playQueue?.indexOf(currentTeamId) ?? -1;
  const nextTeamId = playQueue?.[currentIndex + 1] ?? null;
  const nextTeam = nextTeamId ? teams[nextTeamId] : null;
  const isLastTeamInQueue = !nextTeamId;

  // ============================================================
  // DIALOG STATE
  // ============================================================

  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const [showTeamStatusDialog, setShowTeamStatusDialog] = useState(false);
  const [teamStatusSnapshot, setTeamStatusSnapshot] = useState(null);
  const [isAdvancingTeam, setIsAdvancingTeam] = useState(false);

  const [showGameCompletedDialog, setShowGameCompletedDialog] = useState(false);

  // ============================================================
  // REACTIVE DIALOG TRIGGERS
  // ============================================================

  /**
   * Auto-open TeamStatusDialog when the current team reaches a terminal state.
   * Snapshot the team data at the moment of transition so the dialog
   * shows the correct info even after currentTeamId changes.
   */
  useEffect(() => {
    if (!currentTeam) return;

    const isTerminal =
      currentTeam.status === TEAM_STATUS.ELIMINATED ||
      currentTeam.status === TEAM_STATUS.COMPLETED;

    if (isTerminal) {
      setTeamStatusSnapshot({
        name: currentTeam.name,
        status: currentTeam.status,
        finalPrize: currentTeam.currentPrize ?? 0,
      });
      setShowTeamStatusDialog(true);
    }
  }, [currentTeam?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Auto-open GameCompletedDialog when the game is fully finished.
   */
  useEffect(() => {
    if (gameStatus === GAME_STATUS.COMPLETED) {
      setShowTeamStatusDialog(false);
      setShowGameCompletedDialog(true);
    }
  }, [gameStatus]);

  // ============================================================
  // DERIVED UI STATE
  // ============================================================

  /**
   * Determine the label for the primary action button.
   *
   * Priority:
   * 1. canNextTeam                          → "Next Team"          (team finished, advance to next)
   * 2. !canLoadQuestion && lastQActive      → "Last Q Loaded"      (last Q is active, button disabled)
   * 3. isNextQuestionLast                   → "Load Last Question" (about to load the final question)
   * 4. default                              → "Load Question X"
   */
  const primaryActionLabel = (() => {
    if (isLoading) return 'Loading...';
    if (canNextTeam) return 'Next Team';
    if (!canLoadQuestion && isCurrentQuestionLast) return 'Last Q Loaded';
    if (isNextQuestionLast) return 'Load Last Question';
    return `Load Question ${nextQuestionNumber}`;
  })();

  const primaryActionIcon = canNextTeam ? Users : FileText;
  const PrimaryIcon = primaryActionIcon;

  const canPrimaryAction = canNextTeam || canLoadQuestion;
  const isPrimaryPulsing = canNextTeam || canLoadQuestion;

  const handlePrimaryAction = () => {
    if (canNextTeam) {
      setShowTeamStatusDialog(true);
    } else {
      handleLoadQuestion();
    }
  };

  // ============================================================
  // DIALOG HANDLERS
  // ============================================================

  const handleSkipConfirm = useCallback(async () => {
    setIsSkipping(true);
    try {
      await executeSkipQuestion();
      setShowSkipDialog(false);
    } catch (err) {
      console.error('Skip failed:', err);
    } finally {
      setIsSkipping(false);
    }
  }, [executeSkipQuestion]);

  const handleTeamStatusProceed = useCallback(async () => {
    setIsAdvancingTeam(true);
    try {
      if (isLastTeamInQueue) {
        // No next team — game complete dialog will auto-open via gameStatus effect
        setShowTeamStatusDialog(false);
      } else {
        handleNextTeam();
        setShowTeamStatusDialog(false);
      }
    } finally {
      setIsAdvancingTeam(false);
    }
  }, [isLastTeamInQueue, handleNextTeam]);

  const handleGoHome = useCallback(() => {
    setShowGameCompletedDialog(false);
    navigate('/');
  }, [navigate]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="space-y-3">
        {/* Question Controls */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Question Controls
          </p>

          {/* Primary Action: Load Question X / Load Last Question / Next Team */}
          <Button
            onClick={handlePrimaryAction}
            disabled={!canPrimaryAction || isLoading}
            variant={canPrimaryAction ? 'default' : 'outline'}
            size="lg"
            className={cn(
              'w-full gap-2 transition-all',
              isPrimaryPulsing && 'ring-2 ring-blue-500 animate-pulse',
              canNextTeam &&
                'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white',
            )}>
            <PrimaryIcon className="w-4 h-4" />
            {primaryActionLabel}
          </Button>

          {/* Push to Display */}
          <Button
            onClick={handleShowQuestion}
            disabled={!canShowQuestion || isLoading}
            variant="default"
            size="lg"
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
            <Eye className="w-4 h-4" />
            {isLoading ? 'Showing...' : 'Push to Display'}
          </Button>

          {/* Hide Question */}
          <Button
            onClick={handleHideQuestion}
            disabled={!canHideQuestion || isLoading}
            variant="outline"
            size="lg"
            className="w-full gap-2">
            <EyeOff className="w-4 h-4" />
            Hide Question
          </Button>

          {/* Skip Question — opens confirmation dialog */}
          <Button
            onClick={() => setShowSkipDialog(true)}
            disabled={!canSkipQuestion || isLoading}
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button>
        </div>

        {/* Game State Controls */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Game State
          </p>

          <Button
            onClick={handlePause}
            disabled={!canPause || isLoading}
            variant="outline"
            size="sm"
            className="w-full gap-2">
            <Pause className="w-4 h-4" />
            Pause
          </Button>

          <Button
            onClick={handleResume}
            disabled={!canResume || isLoading}
            variant="outline"
            size="sm"
            className="w-full gap-2">
            <Play className="w-4 h-4" />
            Resume
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Helpful Hints */}
        <div className="p-3 bg-muted/50 rounded-lg border border-dashed mt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>💡 Flow:</strong>
            <br />
            Load → Show → Lock Answer → Next
          </p>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────── */}

      {/* Skip Question Confirmation */}
      <SkipQuestionDialog
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        onConfirm={handleSkipConfirm}
        isLastQuestion={isCurrentQuestionLast}
        isLoading={isSkipping}
      />

      {/* Team Eliminated / Completed */}
      {teamStatusSnapshot && (
        <TeamStatusDialog
          open={showTeamStatusDialog}
          teamName={teamStatusSnapshot.name}
          teamStatus={teamStatusSnapshot.status}
          finalPrize={teamStatusSnapshot.finalPrize}
          nextTeamName={nextTeam?.name}
          isLastTeam={isLastTeamInQueue}
          onProceed={handleTeamStatusProceed}
          isLoading={isAdvancingTeam}
        />
      )}

      {/* Game Completed */}
      <GameCompletedDialog
        open={showGameCompletedDialog}
        teams={teams}
        onGoHome={handleGoHome}
      />
    </>
  );
}
