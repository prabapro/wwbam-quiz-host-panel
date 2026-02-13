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
 * - Top: Game Status Bar (team, question, prize)
 * - Left Column (2/3): Question Panel, Answer Pad, Game Controls
 * - Right Column (1/3): Team Status, Lifelines
 * - Bottom: Debug Info (development mode)
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

  // Redirect if game is not active
  useEffect(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) {
      console.warn('Game is not active, redirecting to home');
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

      {/* Game Status Bar */}
      <div className="mb-6">
        <GameStatusBar />
      </div>

      {/* Main Gameplay Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Question & Controls (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Panel */}
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

          {/* Answer Pad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Answer Selection
                {selectedAnswer && !validationResult && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedAnswer} Selected
                  </Badge>
                )}
                {validationResult && (
                  <Badge
                    variant={
                      validationResult.isCorrect ? 'default' : 'destructive'
                    }
                    className="ml-auto">
                    {validationResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnswerPad />
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Game Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <GameControls />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Team & Lifelines (1/3 width) */}
        <div className="space-y-6">
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
