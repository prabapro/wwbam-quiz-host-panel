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
import { databaseService } from '@services/database.service';
import { GAME_STATUS } from '@constants/gameStates';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

// Import Phase 4 Components
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
 * Layout:
 * - Top: Game Status Bar (full width)
 * - Left Column (1/4): Game Controls (stacked buttons)
 * - Middle Column (2/4): Question Display
 * - Right Column (1/4): Answer Pad (2x2 grid)
 * - Bottom Row: Team Status (1/2), Lifelines (1/2)
 * - Debug Info (development mode)
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

  // Teams Store State
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  // Questions Store State
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const loadedSets = useQuestionsStore((state) => state.loadedSets);
  const selectedAnswer = useQuestionsStore((state) => state.selectedAnswer);
  const validationResult = useQuestionsStore((state) => state.validationResult);

  // Prize Store State
  const prizeStructure = usePrizeStore((state) => state.prizeStructure) || [];

  // ✅ FIX: Listen to Firebase game state changes
  useEffect(() => {
    console.log('🔄 Starting Firebase game state listener...');

    const unsubscribe = databaseService.onGameStateChange((gameState) => {
      if (gameState) {
        console.log('🔄 Game state updated from Firebase:', {
          questionVisible: gameState.questionVisible,
          answerRevealed: gameState.answerRevealed,
          correctOption: gameState.correctOption,
          currentQuestionNumber: gameState.currentQuestionNumber,
        });

        // Update local game store with Firebase data
        useGameStore.setState({
          questionVisible: gameState.questionVisible,
          answerRevealed: gameState.answerRevealed,
          correctOption: gameState.correctOption,
          currentQuestionNumber: gameState.currentQuestionNumber,
        });
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🛑 Stopping Firebase game state listener');
      unsubscribe();
    };
  }, []);

  // ✅ FIX: Redirect only if game is not in a playable state
  // Allow both ACTIVE and PAUSED states to stay on this page
  useEffect(() => {
    const isPlayableState =
      gameStatus === GAME_STATUS.ACTIVE || gameStatus === GAME_STATUS.PAUSED;

    if (!isPlayableState) {
      console.warn(
        `Game is not in playable state (${gameStatus}), redirecting to home`,
      );
      navigate('/');
    }
  }, [gameStatus, navigate]);

  // Early return if no current team (shouldn't happen if redirects work)
  if (!currentTeam) {
    return (
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Active Team</AlertTitle>
          <AlertDescription>
            There is no active team. Please return to the home page and start
            the game.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Game Play</h1>
          <p className="text-muted-foreground">
            Host control panel for managing the quiz competition
          </p>
        </div>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Paused State Banner */}
      {gameStatus === GAME_STATUS.PAUSED && (
        <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
          <AlertDescription className="text-center">
            <strong>⏸️ Game Paused</strong> - Click "Resume" to continue playing
          </AlertDescription>
        </Alert>
      )}

      {/* Game Status Bar */}
      <div className="mb-6">
        <GameStatusBar />
      </div>

      {/* Main Gameplay Layout - 4 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Game Controls (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Game Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <GameControls />
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Question Display (2/4 = 1/2 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Question Display
                {hostQuestion && (
                  <Badge variant="outline" className="ml-auto">
                    Q{hostQuestion.number} Loaded
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionPanel />
            </CardContent>
          </Card>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
        <Card className="mt-6 border-dashed bg-muted/30">
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
                    {questionVisible ? 'Yes' : 'No'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Revealed:{' '}
                  <span className="text-foreground font-semibold">
                    {answerRevealed ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>

              {/* Questions Store */}
              <div className="space-y-1">
                <p className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  Questions Store:
                </p>
                <p className="text-muted-foreground">
                  Loaded Sets:{' '}
                  <span className="text-foreground font-semibold">
                    {Object.keys(loadedSets).length}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Host Question:{' '}
                  <span className="text-foreground font-semibold">
                    {hostQuestion ? `Q${hostQuestion.number}` : 'None'}
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
                    {validationResult ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>

              {/* Team Store */}
              <div className="space-y-1">
                <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                  Current Team:
                </p>
                <p className="text-muted-foreground">
                  Name:{' '}
                  <span className="text-foreground font-semibold">
                    {currentTeam.name}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Status:{' '}
                  <span className="text-foreground font-semibold">
                    {currentTeam.status}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Prize:{' '}
                  <span className="text-foreground font-semibold">
                    Rs.{currentTeam.currentPrize || 0}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Lifelines:{' '}
                  <span className="text-foreground font-semibold">
                    {Object.values(currentTeam.lifelines || {}).filter(Boolean)
                      .length || 0}
                    /2
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
