// src/components/game/InitializeGameModal.jsx

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { ScrollArea } from '@components/ui/scroll-area';
import { Badge } from '@components/ui/badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import PlayQueueDisplay from './PlayQueueDisplay';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { localStorageService } from '@services/localStorage.service';
import {
  generatePlayQueue,
  getPlayQueuePreview,
} from '@utils/gameInitialization';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  FileJson,
  Shuffle,
} from 'lucide-react';

/**
 * Initialize Game Modal Component
 * 3-stage modal: Preview → Processing → Results
 */
export default function InitializeGameModal({ open, onOpenChange }) {
  // Modal stages: 'preview' | 'processing' | 'results'
  const [stage, setStage] = useState('preview');

  // Generated data
  const [playQueuePreview, setPlayQueuePreview] = useState([]);
  const [error, setError] = useState(null);

  // Store actions
  const initializeGame = useGameStore((state) => state.initializeGame);
  const teamsObject = useTeamsStore((state) => state.teams);

  // Get teams and question sets
  const teams = Object.values(teamsObject || {});
  const questionSetsMetadata =
    localStorageService.getQuestionSetsMetadata().sets || [];

  /**
   * Handle initialization process
   */
  const handleInitialize = async () => {
    setStage('processing');
    setError(null);

    try {
      // Step 1: Generate play queue and assignments
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate shuffling
      const result = generatePlayQueue(teams, questionSetsMetadata);

      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      // Step 2: Save to store and Firebase
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate saving
      initializeGame(result.playQueue, result.questionSetAssignments);

      // Step 3: Generate preview data
      const preview = getPlayQueuePreview(
        result.playQueue,
        result.questionSetAssignments,
        teamsObject,
        questionSetsMetadata,
      );

      setPlayQueuePreview(preview);
      setStage('results');
    } catch (err) {
      console.error('Initialization failed:', err);
      setError(err.message || 'Failed to initialize game');
      setStage('preview'); // Go back to preview on error
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    // Reset stage on close
    setStage('preview');
    setPlayQueuePreview([]);
    setError(null);
    onOpenChange(false);
  };

  /**
   * Handle go to dashboard (close modal)
   */
  const handleGoToDashboard = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Stage 1: Preview */}
        {stage === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shuffle className="w-5 h-5" />
                Initialize Game
              </DialogTitle>
              <DialogDescription>
                Review teams and question sets before initialization
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Initialization Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Warning Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Random Assignment</AlertTitle>
                <AlertDescription>
                  Question sets will be randomly assigned to teams. This action
                  cannot be undone without uninitializing the game.
                </AlertDescription>
              </Alert>

              {/* Teams List */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">Teams ({teams.length})</h3>
                </div>
                <ScrollArea className="h-32 border rounded-lg p-3 bg-muted/30">
                  <div className="space-y-1">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono text-xs">
                          {team.id}
                        </Badge>
                        <span>{team.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Question Sets List */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">
                    Question Sets ({questionSetsMetadata.length})
                  </h3>
                </div>
                <ScrollArea className="h-32 border rounded-lg p-3 bg-muted/30">
                  <div className="space-y-1">
                    {questionSetsMetadata.map((set) => (
                      <div
                        key={set.setId}
                        className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono text-xs">
                          {set.setId}
                        </Badge>
                        <span>{set.setName}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInitialize}>
                <Shuffle className="w-4 h-4 mr-2" />
                Initialize Game
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Stage 2: Processing */}
        {stage === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle>Initializing Game...</DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center space-y-6">
                <LoadingSpinner size="lg" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground animate-pulse">
                    🎲 Shuffling teams...
                  </p>
                  <p className="text-sm text-muted-foreground animate-pulse delay-150">
                    🎯 Assigning question sets...
                  </p>
                  <p className="text-sm text-muted-foreground animate-pulse delay-300">
                    💾 Saving to Firebase...
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Stage 3: Results */}
        {stage === 'results' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Game Initialized Successfully!
              </DialogTitle>
              <DialogDescription>
                The play queue has been generated and saved
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <PlayQueueDisplay
                playQueuePreview={playQueuePreview}
                maxHeight="400px"
                showHeader={true}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
