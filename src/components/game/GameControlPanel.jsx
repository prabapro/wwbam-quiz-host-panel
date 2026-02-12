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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@components/ui/alert';
import LoadingSpinner from '@components/common/LoadingSpinner';
import PlayQueueDisplay from './PlayQueueDisplay';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { localStorageService } from '@services/localStorage.service';
import { getPlayQueuePreview } from '@utils/gameInitialization';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Recycle,
} from 'lucide-react';

/**
 * Game Control Panel Component
 * Shown on homepage after game initialization
 * Contains: Status, Play Queue (always visible), Play Game button, Uninitialize button, Factory Reset option
 */
export default function GameControlPanel() {
  const navigate = useNavigate();

  // Uninitialize confirmation dialog state
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);

  // Factory reset confirmation dialog state
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);

  // Uninitialize loading state
  const [isUninitializing, setIsUninitializing] = useState(false);
  const [uninitError, setUninitError] = useState(null);

  // Factory reset loading state
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);

  // Store state
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const uninitializeGame = useGameStore((state) => state.uninitializeGame);
  const resetAppToFactoryDefaults = useGameStore(
    (state) => state.resetAppToFactoryDefaults,
  );

  const teamsObject = useTeamsStore((state) => state.teams);
  const deleteAllTeamsFromFirebase = useTeamsStore(
    (state) => state.deleteAllTeamsFromFirebase,
  );

  const resetToDefault = usePrizeStore((state) => state.resetToDefault);

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

  /**
   * Handle play game button click
   */
  const handlePlayGame = () => {
    navigate('/play');
  };

  /**
   * Handle uninitialize confirmation
   */
  const handleUninitialize = async () => {
    setIsUninitializing(true);
    setUninitError(null);

    try {
      const result = await uninitializeGame();

      if (!result.success) {
        throw new Error(result.error || 'Failed to uninitialize');
      }

      console.log('🔄 Game uninitialized and synced to Firebase');
      setShowUninitializeDialog(false);
    } catch (error) {
      console.error('Uninitialize failed:', error);
      setUninitError(error.message);
    } finally {
      setIsUninitializing(false);
    }
  };

  /**
   * Handle factory reset confirmation
   */
  const handleFactoryReset = async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      console.log('🏭 Starting factory reset process...');

      // 1. Delete all teams from Firebase (also clears local store)
      const teamsResult = await deleteAllTeamsFromFirebase();
      if (!teamsResult.success) {
        throw new Error('Failed to delete teams: ' + teamsResult.error);
      }

      // 2. Reset prize structure to defaults (also syncs to Firebase)
      const prizesResult = await resetToDefault();
      if (!prizesResult.success) {
        throw new Error(
          'Failed to reset prize structure: ' + prizesResult.error,
        );
      }

      // 3. Complete factory reset (clears question sets + resets Firebase)
      const resetResult = await resetAppToFactoryDefaults();
      if (!resetResult.success) {
        throw new Error('Failed to complete reset: ' + resetResult.error);
      }

      console.log('✅ Factory reset completed successfully');

      // Close dialog
      setShowFactoryResetDialog(false);

      // Small delay for user to see success, then page will auto-update
      setTimeout(() => {
        console.log('🔄 App reset to factory defaults - UI will refresh');
      }, 500);
    } catch (error) {
      console.error('Factory reset failed:', error);
      setResetError(error.message);
    } finally {
      setIsResetting(false);
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
            <Button className="flex-1" size="lg" onClick={handlePlayGame}>
              <Play className="w-4 h-4 mr-2" />
              Play Game
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowUninitializeDialog(true)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Uninitialize
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowFactoryResetDialog(true)}>
                  <Recycle className="w-4 h-4 mr-2" />
                  Reset App to Factory Defaults
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            Click "Play Game" to start the competition or "Uninitialize" to
            reset and change settings
          </p>
        </CardContent>
      </Card>

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

          {/* Error Alert */}
          {uninitError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{uninitError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUninitializing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUninitialize}
              disabled={isUninitializing}>
              {isUninitializing ? (
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

      {/* Factory Reset Confirmation Dialog */}
      <AlertDialog
        open={showFactoryResetDialog}
        onOpenChange={setShowFactoryResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Recycle className="w-5 h-5" />
              Reset App to Factory Defaults?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-semibold text-destructive">
                  ⚠️ This action is IRREVERSIBLE and will permanently delete ALL
                  app data:
                </p>
                <ul className="space-y-1 text-sm list-none">
                  <li>• All teams (from both localStorage and Firebase)</li>
                  <li>• All question sets (from localStorage)</li>
                  <li>• Prize structure (reset to defaults in Firebase)</li>
                  <li>• Game state (reset to defaults in Firebase)</li>
                </ul>
                <p className="font-semibold">
                  The app will be reset to its initial state as if freshly
                  installed.
                </p>
                <p className="text-xs text-muted-foreground">
                  This is typically used before a new event or to completely
                  start over.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Error Alert */}
          {resetError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFactoryReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isResetting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <Recycle className="w-4 h-4 mr-2" />
                  Reset to Factory Defaults
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
