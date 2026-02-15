// src/pages/play/index.jsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { GAME_STATUS } from '@constants/gameStates';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
 * UPDATED: Now uses store-level Firebase listener instead of component-level
 * This ensures consistent real-time sync across navigation and page refreshes
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

  // Game Store State
  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const playQueue = useGameStore((state) => state.playQueue);
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const startGameListener = useGameStore((state) => state.startGameListener);

  // Teams Store State
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  // Questions Store State
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const selectedAnswer = useQuestionsStore((state) => state.selectedAnswer);
  const validationResult = useQuestionsStore((state) => state.validationResult);

  // Prize Store State
  const prizeStructure = usePrizeStore((state) => state.prizeStructure) || [];

  // Answer Pad States for Card-level styling
  const isWaitingForVisibility = !hostQuestion && !questionVisible;
  const isAnswerPadActive = questionVisible && !answerRevealed;

  // ============================================================
  // REAL-TIME FIREBASE SYNC - MOVED TO STORE LEVEL
  // ============================================================

  /**
   * Start Firebase game state listener on mount
   * The listener is now managed by the store for consistency
   */
  useEffect(() => {
    console.log('🎮 Play Page: Starting game state listener...');

    // Start store-level listener
    const unsubscribe = startGameListener();

    // Cleanup listener on unmount
    return () => {
      console.log('🎮 Play Page: Stopping game state listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [startGameListener]);

  // ============================================================
  // NAVIGATION GUARD
  // ============================================================

  /**
   * Redirect if game is not in a valid play page state
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
  // GAME COMPLETED STATE
  // ============================================================

  if (!currentTeam && gameStatus === GAME_STATUS.COMPLETED) {
    return (
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Game Completed! 🏆</h1>
            <p className="text-muted-foreground">
              All teams have finished playing
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Game Completed Info */}
        <Alert className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-500">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle>Event Concluded</AlertTitle>
          <AlertDescription>
            The quiz competition has ended. All teams have completed their
            rounds.
          </AlertDescription>
        </Alert>

        {/* Post-game actions could go here */}
      </main>
    );
  }

  // ============================================================
  // MAIN GAMEPLAY INTERFACE
  // ============================================================

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
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
                    {validationResult.isCorrect ? '✓' : '✗'}
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
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamStatusCard />
          </CardContent>
        </Card>

        {/* Lifeline Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Lifelines</CardTitle>
          </CardHeader>
          <CardContent>
            <LifelinePanel />
          </CardContent>
        </Card>
      </div>

      {/* Debug Info - Store State (Development) */}
      {import.meta.env.DEV && (
        <Card className="border-dashed bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              🔧 Debug: Store State
              <Badge variant="outline" className="ml-auto text-xs">
                Development Only
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Game Store */}
              <div className="space-y-1">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Game Store:
                </p>
                <p className="text-muted-foreground">
                  Status:{' '}
                  <span className="text-foreground font-semibold">
                    {gameStatus}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Team ID:{' '}
                  <span className="text-foreground font-semibold">
                    {currentTeamId?.slice(0, 8)}...
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Question:{' '}
                  <span className="text-foreground font-semibold">
                    {currentQuestionNumber}/{prizeStructure.length}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Queue:{' '}
                  <span className="text-foreground font-semibold">
                    {playQueue.length} teams
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Visible:{' '}
                  <span className="text-foreground font-semibold">
                    {questionVisible ? '👁️ Yes' : '🙈 No'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Revealed:{' '}
                  <span className="text-foreground font-semibold">
                    {answerRevealed ? '✅ Yes' : '❌ No'}
                  </span>
                </p>
              </div>

              {/* Questions Store */}
              <div className="space-y-1">
                <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                  Questions Store:
                </p>
                <p className="text-muted-foreground">
                  Loaded:{' '}
                  <span className="text-foreground font-semibold">
                    {hostQuestion ? '✅' : '❌'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Q Number:{' '}
                  <span className="text-foreground font-semibold">
                    {hostQuestion?.number || 'N/A'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Selected:{' '}
                  <span className="text-foreground font-semibold">
                    {selectedAnswer || 'None'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Validated:{' '}
                  <span className="text-foreground font-semibold">
                    {validationResult ? '✅' : '❌'}
                  </span>
                </p>
                {validationResult && (
                  <p className="text-muted-foreground">
                    Result:{' '}
                    <span
                      className={cn(
                        'font-semibold',
                        validationResult.isCorrect
                          ? 'text-green-600'
                          : 'text-red-600',
                      )}>
                      {validationResult.isCorrect ? '✅ Correct' : '❌ Wrong'}
                    </span>
                  </p>
                )}
              </div>

              {/* Teams & Prize Store */}
              <div className="space-y-1">
                <p className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  Teams & Prizes:
                </p>
                <p className="text-muted-foreground">
                  Team:{' '}
                  <span className="text-foreground font-semibold">
                    {currentTeam?.name || 'N/A'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Status:{' '}
                  <span className="text-foreground font-semibold">
                    {currentTeam?.status || 'N/A'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Prize:{' '}
                  <span className="text-foreground font-semibold">
                    Rs.{currentTeam?.currentPrize?.toLocaleString() || 0}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Structure:{' '}
                  <span className="text-foreground font-semibold">
                    {prizeStructure.length} levels
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
