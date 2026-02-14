// src/pages/Reset.jsx

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
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { toast } from 'sonner';
import {
  RotateCcw,
  Recycle,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { GAME_STATUS } from '@constants/gameStates';

/**
 * Emergency Reset Page
 * Provides access to destructive operations (Uninitialize, Factory Reset)
 * Accessible in ANY game state - bypasses normal restrictions
 * Auth-protected route for safety
 */
export default function Reset() {
  const navigate = useNavigate();

  // Game state
  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const playQueue = useGameStore((state) => state.playQueue);
  const uninitializeGame = useGameStore((state) => state.uninitializeGame);
  const resetAppToFactoryDefaults = useGameStore(
    (state) => state.resetAppToFactoryDefaults,
  );

  // Teams state
  const teamsObject = useTeamsStore((state) => state.teams);
  const deleteAllTeamsFromFirebase = useTeamsStore(
    (state) => state.deleteAllTeamsFromFirebase,
  );

  // Prize state
  const resetPrizesToDefault = usePrizeStore((state) => state.resetToDefault);

  // Uninitialize dialog state
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);
  const [isUninitializing, setIsUninitializing] = useState(false);
  const [uninitError, setUninitError] = useState(null);

  // Factory reset dialog state
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);

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
      toast.success('Game Uninitialized', {
        description: 'You can now reconfigure teams and reinitialize.',
      });

      // Close dialog
      setShowUninitializeDialog(false);

      // Navigate to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('Failed to uninitialize:', error);
      setUninitError(error.message);
      toast.error('Uninitialize Failed', {
        description: error.message,
      });
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
      // 1. Delete all teams from Firebase
      await deleteAllTeamsFromFirebase();

      // 2. Reset prizes to defaults
      await resetPrizesToDefault();

      // 3. Reset game store (includes localStorage and Firebase)
      const result = await resetAppToFactoryDefaults();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reset');
      }

      console.log('🏭 Factory reset complete');
      toast.success('Factory Reset Complete', {
        description: 'All data cleared. App reset to initial state.',
      });

      // Close dialog
      setShowFactoryResetDialog(false);

      // Navigate to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('Factory reset failed:', error);
      setResetError(error.message);
      toast.error('Factory Reset Failed', {
        description: error.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Get current team count
  const teamCount = Object.keys(teamsObject).length;

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      {/* Page Header - Danger Zone Theme */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-destructive">
              Emergency Reset
            </h1>
            <p className="text-muted-foreground">
              Destructive operations - use with caution
            </p>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive" className="border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold">Warning</AlertTitle>
        <AlertDescription>
          This page contains destructive operations that cannot be undone. Only
          use these options if you're certain about what you're doing.
        </AlertDescription>
      </Alert>

      {/* Current Game Status Card */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Current Game Status
          </CardTitle>
          <CardDescription>
            Information about the current game state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge
              variant={
                gameStatus === GAME_STATUS.ACTIVE
                  ? 'default'
                  : gameStatus === GAME_STATUS.PAUSED
                    ? 'secondary'
                    : 'outline'
              }>
              {gameStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Teams:</span>
            <span className="font-medium">{teamCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Teams in Queue:
            </span>
            <span className="font-medium">{playQueue.length}</span>
          </div>

          {currentTeamId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Team:
              </span>
              <span className="font-medium">
                {teamsObject[currentTeamId]?.name || 'Unknown'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Operations */}
      <div className="grid gap-6">
        {/* Uninitialize Card */}
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <RotateCcw className="w-5 h-5" />
              Uninitialize Game
            </CardTitle>
            <CardDescription>
              Reset game to NOT_STARTED state while keeping teams and question
              sets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900">
              <p className="text-sm font-medium mb-2">This will:</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Reset game status to NOT_STARTED</li>
                <li>Clear play queue and question assignments</li>
                <li>Keep all teams in Firebase</li>
                <li>Keep all question sets in localStorage</li>
                <li>Keep prize structure</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              onClick={() => setShowUninitializeDialog(true)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Uninitialize Game
            </Button>
          </CardContent>
        </Card>

        {/* Factory Reset Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Recycle className="w-5 h-5" />
              Factory Reset
            </CardTitle>
            <CardDescription>
              Delete ALL data and reset to initial state
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive">
              <p className="text-sm font-medium mb-2 text-destructive">
                ⚠️ This will PERMANENTLY delete:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>All teams (from localStorage AND Firebase)</li>
                <li>All question sets (from localStorage)</li>
                <li>Prize structure (reset to defaults in Firebase)</li>
                <li>Game state (reset to defaults in Firebase)</li>
              </ul>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowFactoryResetDialog(true)}>
              <Recycle className="w-4 h-4 mr-2" />
              Factory Reset
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Uninitialize Confirmation Dialog */}
      <AlertDialog
        open={showUninitializeDialog}
        onOpenChange={setShowUninitializeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              Uninitialize Game?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will reset the game to NOT_STARTED state and clear the
                  play queue.
                </p>
                <p className="font-semibold">What will be kept:</p>
                <ul className="space-y-1 text-sm list-none">
                  <li>✓ All teams</li>
                  <li>✓ All question sets</li>
                  <li>✓ Prize structure</li>
                </ul>
                <p className="font-semibold">What will be cleared:</p>
                <ul className="space-y-1 text-sm list-none">
                  <li>✗ Play queue</li>
                  <li>✗ Question set assignments</li>
                  <li>✗ Current game progress</li>
                </ul>
              </div>
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
              disabled={isUninitializing}
              className="bg-orange-600 text-white hover:bg-orange-700">
              {isUninitializing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uninitializing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Uninitialize
                </>
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
              Factory Reset - Are You Sure?
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
    </main>
  );
}
