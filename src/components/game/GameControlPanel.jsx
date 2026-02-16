// src/components/game/GameControlPanel.jsx

import { useState, useEffect } from 'react';
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
import { databaseService } from '@services/database.service';
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
 *
 * UPDATED: Added data sync verification before starting game
 * - Ensures question set assignments are synced to Firebase
 * - Verifies data integrity before allowing game start
 * - Better error handling and user feedback
 */
export default function GameControlPanel() {
  const navigate = useNavigate();

  // Start game confirmation dialog state
  const [showStartGameDialog, setShowStartGameDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  // Modular dialog states
  const [showUninitializeDialog, setShowUninitializeDialog] = useState(false);
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);

  // Question sets metadata state
  const [questionSetsMetadata, setQuestionSetsMetadata] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Store state
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const startGame = useGameStore((state) => state.startGame);
  const ensureDataReady = useGameStore((state) => state.ensureDataReady);

  const teamsObject = useTeamsStore((state) => state.teams);

  const loadQuestionSet = useQuestionsStore((state) => state.loadQuestionSet);

  // Load question sets metadata from Firebase
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const metadata = await databaseService.getQuestionSetsMetadata();
        setQuestionSetsMetadata(metadata.sets || []);
      } catch (error) {
        console.error('Failed to load question sets metadata:', error);
        setQuestionSetsMetadata([]);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, []);

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
   *
   * UPDATED: Now verifies data is synced before starting
   */
  const handleStartGame = async () => {
    setIsStarting(true);
    setStartError(null);

    try {
      // ============================================================
      // PRE-FLIGHT CHECK: Ensure data is synced
      // ============================================================

      console.log('🔍 Verifying game data before start...');

      const dataReadyResult = await ensureDataReady();

      if (!dataReadyResult.success) {
        throw new Error(
          dataReadyResult.error ||
            'Failed to verify game data. Please try again.',
        );
      }

      // Verify first team has question set assigned
      if (!firstTeamQuestionSetId) {
        throw new Error(
          `First team "${firstTeam?.name}" does not have a question set assigned. Please reinitialize the game.`,
        );
      }

      console.log('✅ Game data verified successfully');

      // ============================================================
      // LOAD QUESTION SET
      // ============================================================

      console.log(`📚 Loading question set: ${firstTeamQuestionSetId}`);

      const loadResult = await loadQuestionSet(firstTeamQuestionSetId, {
        forceFresh: true, // Always fetch fresh from Firebase when starting
      });

      if (!loadResult.success) {
        throw new Error(
          loadResult.error || 'Failed to load question set from Firebase',
        );
      }

      console.log('✅ Question set loaded successfully');

      // ============================================================
      // START GAME
      // ============================================================

      console.log(`🎮 Starting game with first team: ${firstTeamId}`);

      const startResult = await startGame(firstTeamId);

      if (!startResult.success) {
        throw new Error(startResult.error || 'Failed to start game');
      }

      // ============================================================
      // SUCCESS
      // ============================================================

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

  if (isLoadingMetadata) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading game data..." />
        </CardContent>
      </Card>
    );
  }

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
          {/* Play Queue */}
          <div>
            <PlayQueueDisplay
              playQueuePreview={playQueuePreview}
              currentTeamId={currentTeamId}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {/* Play Game Button (Primary Action) */}
            <Button
              size="lg"
              className="flex-1"
              onClick={handlePlayGameClick}
              disabled={!firstTeam || !firstTeamQuestionSet}>
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>

            {/* More Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" variant="outline">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowUninitializeDialog(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Uninitialize Game
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowFactoryResetDialog(true)}
                  className="text-destructive">
                  <Recycle className="w-4 h-4 mr-2" />
                  Factory Reset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Start Game Confirmation Dialog */}
      <AlertDialog
        open={showStartGameDialog}
        onOpenChange={setShowStartGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start the Game?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You're about to start the competition with{' '}
                  <strong>{firstTeam?.name}</strong> going first.
                </p>

                {/* First Team Info */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{firstTeam?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileJson className="w-4 h-4" />
                    <span>{firstTeamQuestionSet?.setName}</span>
                  </div>
                </div>

                {/* Error Message */}
                {startError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{startError}</AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-muted-foreground">
                  This action will activate gameplay mode and load the first
                  question.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStarting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartGame}
              disabled={isStarting}
              className="bg-green-600 hover:bg-green-700">
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

      {/* Uninitialize Game Dialog */}
      <UninitializeGameDialog
        open={showUninitializeDialog}
        onOpenChange={setShowUninitializeDialog}
      />

      {/* Factory Reset Dialog */}
      <FactoryResetDialog
        open={showFactoryResetDialog}
        onOpenChange={setShowFactoryResetDialog}
      />
    </>
  );
}
