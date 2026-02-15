// src/pages/Home.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { useGameStore } from '@stores/useGameStore';
import SetupVerification from '@components/setup/SetupVerification';
import GameControlPanel from '@components/game/GameControlPanel';
import InitializeGameModal from '@components/game/InitializeGameModal';
import MissingQuestionSetsAlert from '@components/game/MissingQuestionSetsAlert';
import UninitializeGameDialog from '@components/game/UninitializeGameDialog';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useSetupVerification } from '@hooks/useSetupVerification';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  Trophy,
  CheckCircle2,
  BarChart,
  RotateCcw,
  Rocket,
} from 'lucide-react';
import { GAME_STATUS } from '@constants/gameStates';

export default function Home() {
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showInitializeModal, setShowInitializeModal] = useState(false);
  const [showUninitializeModal, setShowUninitializeModal] = useState(false);

  // Refresh key for setup verification (shared with SetupVerification component)
  const [refreshKey, setRefreshKey] = useState(0);

  // Get loading states from stores
  const teamsLoading = useTeamsStore((state) => state.isLoading);
  const prizesLoading = usePrizeStore((state) => state.isLoading);
  const gameStatus = useGameStore((state) => state.gameStatus);

  // Get setup verification with refreshKey (includes missing required question sets detection)
  const {
    isReady,
    isMissingRequiredQuestionSets,
    requiredQuestionSetsValidation,
  } = useSetupVerification(refreshKey);

  // Track if initial data load is happening
  const isLoadingInitialData = teamsLoading || prizesLoading;

  // Specific game status checks
  const isNotStarted = gameStatus === GAME_STATUS.NOT_STARTED;
  const isInitialized = gameStatus === GAME_STATUS.INITIALIZED;
  const isCompleted = gameStatus === GAME_STATUS.COMPLETED;

  // Auto-redirect to /play if game is active or paused
  useEffect(() => {
    const isGameInProgress =
      gameStatus === GAME_STATUS.ACTIVE || gameStatus === GAME_STATUS.PAUSED;

    if (isGameInProgress) {
      console.log(
        `🎮 Game is in progress (${gameStatus}), redirecting to /play...`,
      );
      navigate('/play');
    }
  }, [gameStatus, navigate]);

  // Effect to track when initial loading is complete
  useEffect(() => {
    // Once both stores have finished loading, mark initial load as complete
    if (!teamsLoading && !prizesLoading && !initialLoadComplete) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [teamsLoading, prizesLoading, initialLoadComplete]);

  /**
   * Handle continue from missing question sets alert
   * This is called when all required question sets are found
   */
  const handleContinueFromMissingSets = () => {
    // Just let the component re-render
    // The isMissingRequiredQuestionSets flag will be false now
    // and GameControlPanel will be shown
    console.log('✅ All required question sets found - continuing to game');
  };

  /**
   * Callback to increment refresh key (called by SetupVerification after sample data load)
   */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl space-y-8 relative">
      {/* Loading Overlay with Blur Effect */}
      {isLoadingInitialData && !initialLoadComplete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-lg border">
            <LoadingSpinner
              size="lg"
              text="Loading setup data..."
              variant="primary"
            />
            <p className="text-sm text-muted-foreground text-center mt-4">
              Syncing teams and prize structure from Firebase
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SCENARIO 1: Game is COMPLETED - Show completion message */}
        {isCompleted && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    Game Completed
                  </CardTitle>
                  <CardDescription>Event has concluded</CardDescription>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">
                  Finished
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-500">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  All teams have finished playing. You can view the results or
                  uninitialize the game to prepare for a new event.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/play')} className="flex-1">
                  <BarChart className="w-4 h-4 mr-2" />
                  View Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUninitializeModal(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Uninitialize
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SCENARIO 2: Game INITIALIZED but missing question sets */}
        {isInitialized && isMissingRequiredQuestionSets && (
          <MissingQuestionSetsAlert
            requiredQuestionSetsValidation={requiredQuestionSetsValidation}
            onContinue={handleContinueFromMissingSets}
          />
        )}

        {/* SCENARIO 3: Game INITIALIZED and ready - Show Game Control Panel */}
        {isInitialized && !isMissingRequiredQuestionSets && (
          <GameControlPanel />
        )}

        {/* SCENARIO 4: Game NOT_STARTED - Show Setup Verification */}
        {isNotStarted && (
          <>
            <SetupVerification
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
            />

            {/* Initialize Game Button - Show when ready and not initialized */}
            {isReady && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="w-full max-w-md"
                  onClick={() => setShowInitializeModal(true)}>
                  <Rocket className="w-5 h-5 mr-2" />
                  Initialize Game
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Initialize Game Modal */}
      <InitializeGameModal
        open={showInitializeModal}
        onOpenChange={setShowInitializeModal}
      />

      {/* Uninitialize Game Modal */}
      <UninitializeGameDialog
        open={showUninitializeModal}
        onOpenChange={setShowUninitializeModal}
      />
    </main>
  );
}
