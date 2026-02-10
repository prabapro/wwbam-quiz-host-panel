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

  // Store state
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const uninitializeGame = useGameStore((state) => state.resetGame);
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
  const handleUninitialize = () => {
    uninitializeGame();
    setShowUninitializeDialog(false);
    console.log('🔄 Game uninitialized');
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
              queue and question set assignments will be cleared. Teams and
              question sets will remain saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUninitialize}>
              Uninitialize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
