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
import UninitializeGameDialog from './UninitializeGameDialog';
import FactoryResetDialog from './FactoryResetDialog';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { localStorageService } from '@services/localStorage.service';
import { getPlayQueuePreview } from '@utils/gameInitialization';
import { toast } from 'sonner';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Recycle,
  Users,
  FileJson,
} from 'lucide-react';

/**
 * Game Control Panel Component
 * Shown on homepage after game initialization
 * Contains: Status, Play Queue (always visible), Play Game button, Uninitialize button, Factory Reset option
 */
export default function GameControlPanel() {
  const navigate = useNavigate();

  // Start game confirmation dialog state
  const [showStartGameDialog, setShowStartGameDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  // Modular dialog states - simplified (no loading/error states needed)
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);

  // Store state
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const startEvent = useGameStore((state) => state.startEvent);

  const teamsObject = useTeamsStore((state) => state.teams);

  const loadQuestionSet = useQuestionsStore((state) => state.loadQuestionSet);

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

  // Get first team info for start dialog
  const firstTeamId = playQueue[0];
  const firstTeam = teamsObject[firstTeamId];
  const firstTeamQuestionSetId = questionSetAssignments[firstTeamId];
  const firstTeamQuestionSet = questionSetsMetadata.find(
    (set) => set.setId === firstTeamQuestionSetId,
  );

  /**
   * Handle start game button click - show confirmation
   */
  const handlePlayGameClick = () => {
    setShowStartGameDialog(true);
    setStartError(null);
  };

  /**
   * Handle start game confirmation
   */
  const handleStartGame = async () => {
    setIsStarting(true);
    setStartError(null);

    try {
      // 1. Load first team's question set from localStorage into memory
      const loadResult = loadQuestionSet(firstTeamQuestionSetId);

      if (!loadResult.success) {
        throw new Error(
          loadResult.error || 'Failed to load question set from localStorage',
        );
      }

      // 2. Start event (updates game state + Firebase)
      const startResult = await startEvent();

      if (!startResult.success) {
        throw new Error(startResult.error || 'Failed to start event');
      }

      // 3. Success! Show toast and navigate
      toast.success('Game Started!', {
        description: `${firstTeam.name} is now on the hot seat. Good luck!`,
      });

      // Close dialog
      setShowStartGameDialog(false);

      // Small delay for toast visibility, then navigate
      setTimeout(() => {
        navigate('/play');
      }, 500);
    } catch (error) {
      console.error('Failed to start game:', error);
      setStartError(error.message);
      toast.error('Failed to start game', {
        description: error.message,
      });
    } finally {
      setIsStarting(false);
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
            <Button className="flex-1" size="lg" onClick={handlePlayGameClick}>
              <Play className="w-4 h-4 mr-2" />
              Start Game
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
            Click "Start Game" to begin the competition or "Uninitialize" to
            reset and change settings
          </p>
        </CardContent>
      </Card>

      {/* Start Game Confirmation Dialog - PRESERVED */}
      <AlertDialog
        open={showStartGameDialog}
        onOpenChange={setShowStartGameDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Start Game?</AlertDialogTitle>
            <AlertDialogDescription>
              The first team will be activated and the game will begin. Make
              sure you're ready!
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* First Team Info */}
          {firstTeam && (
            <div className="space-y-3 py-2">
              {/* Team Info */}
              <div className="p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-start gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{firstTeam.name}</p>
                    {firstTeam.participants && (
                      <p className="text-sm text-muted-foreground">
                        {firstTeam.participants}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Set Info */}
              {firstTeamQuestionSet && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-start gap-2">
                    <FileJson className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Question Set</p>
                      <p className="text-sm text-muted-foreground">
                        {firstTeamQuestionSet.setName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {firstTeamQuestionSet.totalQuestions} questions
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {startError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{startError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStarting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartGame} disabled={isStarting}>
              {isStarting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modular Uninitialize Dialog */}
      <UninitializeGameDialog
        open={showUninitializeDialog}
        onOpenChange={setShowUninitializeDialog}
      />

      {/* Modular Factory Reset Dialog */}
      <FactoryResetDialog
        open={showFactoryResetDialog}
        onOpenChange={setShowFactoryResetDialog}
      />
    </>
  );
}
