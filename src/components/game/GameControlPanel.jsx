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
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

/**
 * Game Control Panel Component
 * Shown on homepage after game initialization
 * Contains: Status, Play Queue (collapsible), Play Game button, Uninitialize button
 */
export default function GameControlPanel() {
  const navigate = useNavigate();

  // Collapsible play queue state
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);

  // Uninitialize confirmation dialog state
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);

  // Uninitialize loading state
  const [isUninitializing, setIsUninitializing] = useState(false);
  const [uninitError, setUninitError] = useState(null);

  // Store state
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const currentTeamId = useGameStore((state) => state.currentTeamId);
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
          {/* Play Queue - Collapsible */}
          <div className="border rounded-lg">
            {/* Header */}
            <button
              onClick={() => setIsQueueExpanded(!isQueueExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Play Queue</h3>
                <Badge variant="outline">{playQueue.length} Teams</Badge>
              </div>
              {isQueueExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Expandable Content */}
            {isQueueExpanded && (
              <div className="p-3 border-t bg-muted/20">
                <PlayQueueDisplay
                  playQueuePreview={playQueuePreview}
                  currentTeamId={currentTeamId}
                  maxHeight="300px"
                  showHeader={false}
                />
              </div>
            )}
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
    </>
  );
}
