// src/pages/Play/index.jsx

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
import { formatPrize } from '@constants/prizeStructure';
import {
  ArrowLeft,
  Users,
  Trophy,
  ListOrdered,
  AlertTriangle,
  Construction,
} from 'lucide-react';

// Import placeholder components (to be built later)
import GameStatusBar from './components/GameStatusBar';
import QuestionPanel from './components/QuestionPanel';
import AnswerPad from './components/AnswerPad';
import LifelinePanel from './components/LifelinePanel';
import TeamStatusCard from './components/TeamStatusCard';
import GameControls from './components/GameControls';

/**
 * Play Page - Main Gameplay Interface
 * Orchestrates all gameplay components and pulls state from stores
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

  // Teams Store State
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  // Questions Store State
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const loadedSets = useQuestionsStore((state) => state.loadedSets);

  // Prize Store State
  const prizeStructure = usePrizeStore((state) => state.prizeStructure) || [];

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

  // Calculate current prize
  const currentPrize = currentTeam.currentPrize || 0;
  const totalQuestions = prizeStructure.length;

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

      {/* Game Status Bar - Will be a component later */}
      <div className="mb-6">
        <GameStatusBar />
      </div>

      {/* Current Game State Display */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Current Game State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Team */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Current Team
                </p>
              </div>
              <p className="text-2xl font-bold">{currentTeam.name}</p>
              {currentTeam.participants && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentTeam.participants}
                </p>
              )}
              <Badge className="mt-2 bg-blue-600">Active</Badge>
            </div>

            {/* Question Progress */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ListOrdered className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Question Progress
                </p>
              </div>
              <p className="text-2xl font-bold">
                {currentQuestionNumber}/{totalQuestions}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalQuestions - currentQuestionNumber} questions remaining
              </p>
            </div>

            {/* Current Prize */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Current Prize
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatPrize(currentPrize)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prize money accumulated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gameplay Layout - Placeholder Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Question & Answer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Question Display</CardTitle>
              <Badge variant="outline">
                <Construction className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardHeader>
            <CardContent>
              <QuestionPanel />
            </CardContent>
          </Card>

          {/* Answer Pad */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Answer Selection</CardTitle>
              <Badge variant="outline">
                <Construction className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardHeader>
            <CardContent>
              <AnswerPad />
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Game Controls</CardTitle>
              <Badge variant="outline">
                <Construction className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardHeader>
            <CardContent>
              <GameControls />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Team & Lifelines */}
        <div className="space-y-6">
          {/* Team Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Status</CardTitle>
              <Badge variant="outline">
                <Construction className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardHeader>
            <CardContent>
              <TeamStatusCard />
            </CardContent>
          </Card>

          {/* Lifeline Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lifelines</CardTitle>
              <Badge variant="outline">
                <Construction className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardHeader>
            <CardContent>
              <LifelinePanel />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Info - Store State */}
      <Card className="mt-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Debug: Store State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <p className="font-semibold mb-1">Game Store:</p>
              <p>Status: {gameStatus}</p>
              <p>Current Team ID: {currentTeamId}</p>
              <p>Question Number: {currentQuestionNumber}</p>
              <p>Play Queue: {playQueue.length} teams</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Questions Store:</p>
              <p>Loaded Sets: {Object.keys(loadedSets).length}</p>
              <p>Host Question: {hostQuestion ? 'Loaded' : 'None'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// testing deployment
