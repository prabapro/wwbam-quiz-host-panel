// src/pages/play/index.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { GAME_STATUS } from '@constants/gameStates';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@lib/utils';
import GameStatusBar from './components/GameStatusBar';
import QuestionPanel from './components/QuestionPanel';
import AnswerPad from './components/AnswerPad';
import LifelinePanel from './components/LifelinePanel';
import TeamStatusCard from './components/TeamStatusCard';
import GameControls from './components/GameControls';

/**
 * Play Page - Main Gameplay Interface
 * Orchestrates all gameplay components and pulls state from stores
 *
 * UPDATED: Added data ready guard and better loading states
 * - Ensures critical game data is synced before allowing interactions
 * - Shows loading state while syncing from Firebase
 * - Provides retry mechanism if data sync fails
 * - Uses store-level Firebase listener for real-time sync
 *
 * FIXED: Lifeline real-time sync issue
 * - Added teams listener alongside game state listener
 * - Ensures lifeline availability updates are received in real-time from Firebase
 * - When a lifeline is used, the UI now properly reflects the change immediately
 *
 * UPDATED: Game completion flow
 * - Removed auto-render summary page on game completion
 * - GameCompletedDialog (in GameControls) now handles completion UX
 * - User sees dialog first, then navigates to home via "Back to Dashboard" button
 *
 * Layout:
 * - Top: Game Status Bar (full width)
 * - Left Column (1/4): Game Controls (stacked buttons)
 * - Middle Column (2/4): Question Display
 * - Right Column (1/4): Answer Pad (2x2 grid)
 * - Bottom Row: Team Status (1/2), Lifelines (1/2)
 */
export default function Play() {
  const navigate = useNavigate();

  // Local state for data ready check
  const [isCheckingData, setIsCheckingData] = useState(true);
  const [dataCheckError, setDataCheckError] = useState(null);

  // Game Store State
  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const isDataReady = useGameStore((state) => state.isDataReady);
  const isSyncingData = useGameStore((state) => state.isSyncingData);
  const ensureDataReady = useGameStore((state) => state.ensureDataReady);
  const startGameListener = useGameStore((state) => state.startGameListener);

  // Teams Store State
  const startTeamsListener = useTeamsStore((state) => state.startTeamsListener);

  // Questions Store State
  const validationResult = useQuestionsStore((state) => state.validationResult);
  const selectedAnswer = useQuestionsStore((state) => state.selectedAnswer);

  // Prize Store State (ensure it's loaded)

  // ============================================================
  // DATA READY CHECK
  // ============================================================

  /**
   * Verify critical game data is synced from Firebase before allowing gameplay
   */
  useEffect(() => {
    const checkDataReady = async () => {
      console.log('🔍 Checking if game data is ready...');

      // If already marked ready, skip check
      if (isDataReady) {
        console.log('✅ Data already marked as ready');
        setIsCheckingData(false);
        return;
      }

      // Attempt to ensure data is ready
      const result = await ensureDataReady();

      if (result.success) {
        console.log('✅ Game data verified and ready');
        setDataCheckError(null);
      } else {
        console.error('❌ Data ready check failed:', result.error);
        setDataCheckError(
          result.error || 'Failed to verify game data. Please try again.',
        );
      }

      setIsCheckingData(false);
    };

    checkDataReady();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // FIREBASE LISTENERS
  // ============================================================

  /**
   * Start Firebase real-time listeners for game state and teams
   *
   * CRITICAL: Teams listener is required for lifeline availability sync
   * When a lifeline is used, Firebase updates teams/{teamId}/lifelines-available
   * Without this listener, the UI wouldn't know the lifeline was used until refresh
   */
  useEffect(() => {
    console.log('🎮 Play Page: Starting Firebase listeners...');

    // Start game state listener
    const unsubscribeGameState = startGameListener();
    console.log('✅ Game state listener started');

    // Start teams listener (CRITICAL for lifeline availability sync)
    const unsubscribeTeams = startTeamsListener();
    console.log(
      '✅ Teams listener started (lifeline availability sync enabled)',
    );

    // Cleanup both listeners on unmount
    return () => {
      console.log('🎮 Play Page: Stopping Firebase listeners');

      if (unsubscribeGameState) {
        unsubscribeGameState();
        console.log('🛑 Game state listener stopped');
      }

      if (unsubscribeTeams) {
        unsubscribeTeams();
        console.log('🛑 Teams listener stopped');
      }
    };
  }, [startGameListener, startTeamsListener]);

  // ============================================================
  // NAVIGATION GUARD
  // ============================================================

  /**
   * Redirect if game is not in a valid play page state
   *
   * NOTE: GAME_STATUS.COMPLETED is still a valid state here.
   * GameCompletedDialog (inside GameControls) handles the completion UX,
   * then navigates to '/' when user clicks "Back to Dashboard".
   */
  useEffect(() => {
    const isValidPlayPageState =
      gameStatus === GAME_STATUS.ACTIVE ||
      gameStatus === GAME_STATUS.PAUSED ||
      gameStatus === GAME_STATUS.COMPLETED;

    if (!isValidPlayPageState) {
      console.warn(
        `Game is not in valid play page state (${gameStatus}), redirecting to home`,
      );
      navigate('/');
    }
  }, [gameStatus, navigate]);

  // ============================================================
  // DERIVED STATE FOR ANSWER PAD HIGHLIGHTING
  // ============================================================

  /**
   * Answer pad is "active" when:
   * - Question is visible to public
   * - Answer hasn't been revealed yet
   * - Answer hasn't been locked yet (no validation result)
   */
  const isAnswerPadActive =
    questionVisible && !answerRevealed && !validationResult;

  /**
   * Answer pad is "waiting" when:
   * - Question is loaded (host has it)
   * - But question is not yet visible to public
   * - Answer hasn't been revealed
   */
  const isWaitingForVisibility =
    currentQuestionNumber > 0 && !questionVisible && !answerRevealed;

  // ============================================================
  // LOADING STATE - DATA NOT READY
  // ============================================================

  if (isCheckingData || (isSyncingData && !isDataReady)) {
    return (
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Loading Game Data...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Syncing game state from Firebase. This should only take a
                    moment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR STATE - DATA CHECK FAILED
  // ============================================================

  if (dataCheckError && !isDataReady) {
    return (
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Failed to Load Game Data
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dataCheckError}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setDataCheckError(null);
                        setIsCheckingData(true);
                        ensureDataReady().then((result) => {
                          if (!result.success) {
                            setDataCheckError(result.error);
                          }
                          setIsCheckingData(false);
                        });
                      }}
                      variant="default">
                      Retry
                    </Button>
                    <Button onClick={() => navigate('/')} variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Home
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // ============================================================
  // MAIN GAMEPLAY INTERFACE
  // ============================================================

  /**
   * REMOVED: Auto-render "Game Completed" summary page
   *
   * Previously, this page would auto-render a completion summary when
   * gameStatus === GAME_STATUS.COMPLETED. This prevented GameCompletedDialog
   * from showing.
   *
   * New flow:
   * 1. Game completes → gameStatus = COMPLETED
   * 2. GameCompletedDialog (in GameControls) auto-opens via useEffect
   * 3. User sees dialog with leaderboard
   * 4. User clicks "Back to Dashboard"
   * 5. Navigate to '/' → Home page shows "Game Completed" card
   *
   * The dialog provides a better UX with the ranked leaderboard before
   * sending the host back to the dashboard.
   */

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      {/* Data Ready Indicator (only shown if not ready) */}
      {!isDataReady && (
        <Alert
          variant="default"
          className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Syncing game data from Firebase...
              </span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Top Bar - Game Status */}
      <GameStatusBar />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Game Controls (1/4 width) */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <GameControls />
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Question Display (2/4 width) */}
        <div className="lg:col-span-2 space-y-6">
          <QuestionPanel />
        </div>

        {/* Right Column - Answer Pad (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          <Card
            className={cn(
              'border transition-all duration-200',
              // Low opacity when waiting for question to be shown
              isWaitingForVisibility && 'opacity-40',
              // Full opacity with ring animation when visible
              isAnswerPadActive &&
                'opacity-100 ring-2 ring-purple-500 dark:ring-purple-400 shadow-lg shadow-purple-500/50 bg-purple-100/50 dark:bg-purple-800/20',
              // Normal state after answer revealed
              answerRevealed && 'opacity-100',
            )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Answer Pad
                {selectedAnswer && !validationResult && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedAnswer}
                  </Badge>
                )}
                {validationResult && (
                  <Badge
                    variant={
                      validationResult.isCorrect ? 'default' : 'destructive'
                    }
                    className="ml-auto text-xs">
                    {validationResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnswerPad />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row - Team Status & Lifelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamStatusCard />
          </CardContent>
        </Card>

        {/* Lifelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lifelines</CardTitle>
          </CardHeader>
          <CardContent>
            <LifelinePanel />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
