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
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import UninitializeGameDialog from '@components/game/UninitializeGameDialog';
import FactoryResetDialog from '@components/game/FactoryResetDialog';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
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

  // Teams state
  const teamsObject = useTeamsStore((state) => state.teams);

  // Dialog state - simplified to just open/closed
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);

  /**
   * Handle successful uninitialize - navigate to home
   */
  const handleUninitializeSuccess = () => {
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  /**
   * Handle successful factory reset - navigate to home
   */
  const handleFactoryResetSuccess = () => {
    setTimeout(() => {
      navigate('/');
    }, 500);
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
                <li>Keep all question sets in Firebase</li>
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
                <li>All teams (from Firebase)</li>
                <li>All question sets (from Firebase)</li>
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

      {/* Modular Dialogs */}
      <UninitializeGameDialog
        open={showUninitializeDialog}
        onOpenChange={setShowUninitializeDialog}
        onSuccess={handleUninitializeSuccess}
      />

      <FactoryResetDialog
        open={showFactoryResetDialog}
        onOpenChange={setShowFactoryResetDialog}
        onSuccess={handleFactoryResetSuccess}
      />
    </main>
  );
}
