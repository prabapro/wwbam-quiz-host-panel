// src/pages/Home.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { useGameStore } from '@stores/useGameStore';
import SetupVerification from '@components/setup/SetupVerification';
import GameControlPanel from '@components/game/GameControlPanel';
import InitializeGameModal from '@components/game/InitializeGameModal';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useSetupVerification } from '@hooks/useSetupVerification';
import { Button } from '@components/ui/button';
import { Rocket } from 'lucide-react';
import { GAME_STATUS, DEFAULT_GAME_STATE } from '@constants/gameStates';

export default function Home() {
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showInitializeModal, setShowInitializeModal] = useState(false);

  // Refresh key for setup verification (shared with SetupVerification component)
  const [refreshKey, setRefreshKey] = useState(0);

  // Get loading states from stores
  const teamsLoading = useTeamsStore((state) => state.isLoading);
  const prizesLoading = usePrizeStore((state) => state.isLoading);
  const gameStatus = useGameStore((state) => state.gameStatus);

  // Get setup verification with refreshKey
  const { isReady } = useSetupVerification(refreshKey);

  // Track if initial data load is happening
  const isLoadingInitialData = teamsLoading || prizesLoading;

  // Check if game is initialized
  const isGameInitialized = gameStatus !== DEFAULT_GAME_STATE;

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
        {/* Game initialized - Show Game Control Panel */}
        {isGameInitialized && <GameControlPanel />}

        {/* Game NOT initialized - Show Setup Verification */}
        {!isGameInitialized && (
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
    </main>
  );
}
