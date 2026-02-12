// src/components/game/GameControlPanel.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Alert, AlertDescription } from '@components/ui/alert';
import LoadingSpinner from '@components/common/LoadingSpinner';
import PlayQueueDisplay from './PlayQueueDisplay';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { localStorageService } from '@services/localStorage.service';
import { getPlayQueuePreview } from '@utils/gameInitialization';
import { Play, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Game Control Panel Component
 * Shown on homepage after game initialization
 * Contains: Status, Play Queue (always visible), Play Game button, Uninitialize button
 */
export default function GameControlPanel() {
  const navigate = useNavigate();

  // Dialog states
  const [showStartEventDialog, setShowStartEventDialog] = useState(false);
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);

  // Loading/error states (shared for both actions)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store state
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const startEvent = useGameStore((state) => state.startEvent);
  const uninitializeGame = useGameStore((state) => state.uninitializeGame);
  const teamsObject = useTeamsStore((state) => state.teams);

  // Get question sets metadata
  const questionSetsMetadata =
    localStorageService.getQuestionSetsMetadata().sets || [];

  // Generate play queue preview
  const playQueuePreview = getPlayQueuePreview(
    playQueue,
    questionSetAssignments,
    teamsObject,
    questionSetsMetadata,
  );

  // Get first team info for confirmation dialog
  const firstTeamId = playQueue.length > 0 ? playQueue[0] : null;
  const firstTeam = firstTeamId ? teamsObject[firstTeamId] : null;

  /**
   * Handle play game button click - shows confirmation dialog
   */
  const handlePlayGame = () => {
    setError(null); // Clear any previous errors
    setShowStartEventDialog(true);
  };

  /**
   * Confirm and start event
   * Activates first team and navigates to /play
   */
  const confirmStartEvent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Start the event (changes status to 'active', activates first team)
      const result = await startEvent();

      if (!result.success) {
        throw new Error(result.error || 'Failed to start event');
      }

      console.log('🚀 Event started - navigating to /play');

      // Close dialog on success
      setShowStartEventDialog(false);

      // Navigate to play page
      navigate('/play');
    } catch (err) {
      console.error('Failed to start event:', err);
      setError(err.message);
      // Keep dialog open to show error
      setIsLoading(false);
    }
  };

  /**
   * Handle uninitialize confirmation
   */
  const handleUninitialize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await uninitializeGame();

      if (!result.success) {
        throw new Error(result.error || 'Failed to uninitialize');
      }

      console.log('🔄 Game uninitialized and synced to Firebase');
      setShowUninitializeDialog(false);
    } catch (err) {
      console.error('Uninitialize failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Game Initialized
              </CardTitle>
              <CardDescription>Ready to start gameplay</CardDescription>
            </div>
            <Badge className="bg-green-600 hover:bg-green-700">
              Ready to Play
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Play Queue - Always Visible */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <PlayQueueDisplay
              playQueuePreview={playQueuePreview}
              currentTeamId={currentTeamId}
              maxHeight="auto"
              showHeader={true}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={handlePlayGame}
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting Event...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Game
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowUninitializeDialog(true)}
              disabled={isLoading}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Uninitialize
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            Click "Play Game" to start the competition or "Uninitialize" to
            reset and change settings
          </p>
        </CardContent>
      </Card>

      {/* Start Event Confirmation Dialog */}
      <AlertDialog
        open={showStartEventDialog}
        onOpenChange={setShowStartEventDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Ready to Start Event?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the first team and begin the quiz competition.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* First Team Info */}
            {firstTeam ? (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">First to Play</Badge>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{firstTeam.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {firstTeam.participants}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No teams in play queue. Cannot start event.
                </AlertDescription>
              </Alert>
            )}

            {/* Event Summary */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Teams</p>
                  <p className="font-bold">{playQueue.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Questions per Team</p>
                  <p className="font-bold">20</p>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All teams and questions are ready. The competition will begin
                when you click "Start Event".
              </AlertDescription>
            </Alert>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStartEvent}
              disabled={isLoading || !firstTeam}
              className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Event
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Uninitialize Confirmation Dialog */}
      <AlertDialog
        open={showUninitializeDialog}
        onOpenChange={setShowUninitializeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninitialize Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the game to pre-initialization state. The play
              queue and question set assignments will be cleared from both
              localStorage and Firebase. Teams and question sets will remain
              saved.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Error Alert in Dialog */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUninitialize}
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uninitializing...
                </>
              ) : (
                'Uninitialize'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
