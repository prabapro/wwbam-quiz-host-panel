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
import { Loader2, AlertTriangle } from 'lucide-react';
import GameStatusBar from './components/GameStatusBar';
import QuestionPanel from './components/QuestionPanel';
import AnswerPad from './components/AnswerPad';
import LifelinePanel from './components/LifelinePanel';
import AllTeamsPanel from './components/AllTeamsPanel';
import GameControls from './components/GameControls';

/**
 * Play Page - Main Gameplay Interface
 * Orchestrates all gameplay components and pulls state from stores.
 *
 * On mount, blocks rendering until game data is confirmed synced from Firebase
 * (via ensureDataReady). Both the game state and teams listeners run concurrently —
 * the teams listener is required so lifeline availability changes propagate to the
 * UI immediately without a page refresh.
 *
 * GAME_STATUS.COMPLETED is a valid state on this page. GameCompletedDialog (inside
 * GameControls) handles the post-game UX and navigates the host to "/" when they
 * click "Back to Dashboard".
 *
 * Layout:
 * - Top: Game Status Bar (full width — team info, set, progress, prize, lifelines)
 * - Left Column (1/4): Game Controls (stacked buttons)
 * - Middle Column (2/4): Question Display
 * - Right Column (1/4): Answer Pad (2x2 grid)
 * - Bottom Row: Lifelines (1/4), All Teams Panel (3/4)
 */
export default function Play() {
  const navigate = useNavigate();

  // Local state for data ready check
  const [isCheckingData, setIsCheckingData] = useState(true);
  const [dataCheckError, setDataCheckError] = useState(null);

  // Game Store State
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isDataReady = useGameStore((state) => state.isDataReady);
  const isSyncingData = useGameStore((state) => state.isSyncingData);
  const ensureDataReady = useGameStore((state) => state.ensureDataReady);
  const startGameListener = useGameStore((state) => state.startGameListener);

  // Teams Store State
  const startTeamsListener = useTeamsStore((state) => state.startTeamsListener);

  // Questions Store State
  const validationResult = useQuestionsStore((state) => state.validationResult);
  const selectedAnswer = useQuestionsStore((state) => state.selectedAnswer);

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
   * Start Firebase real-time listeners for game state and teams.
   * Both must run concurrently: the teams listener ensures lifeline availability
   * changes (teams/{teamId}/lifelines-available) reach the UI without a page refresh.
   */
  useEffect(() => {
    console.log('🎮 Play Page: Starting Firebase listeners...');

    // Start game state listener
    const unsubscribeGameState = startGameListener();
    console.log('✅ Game state listener started');

    // Start teams listener
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
   * Redirect if game is not in a valid play state.
   * GAME_STATUS.COMPLETED is intentionally allowed — GameCompletedDialog
   * (inside GameControls) handles post-game UX before navigating away.
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

  if (dataCheckError) {
    return (
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Data Sync Error
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dataCheckError}
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

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

      {/* Top Bar - Game Status (team info, set, progress, prize, lifelines) */}
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
          <Card>
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

      {/* Bottom Row - Lifelines (1/4) + All Teams Panel (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lifelines — 1/4 width */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifelines</CardTitle>
            </CardHeader>
            <CardContent>
              <LifelinePanel />
            </CardContent>
          </Card>
        </div>

        {/* All Teams Panel — 3/4 width */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <AllTeamsPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
