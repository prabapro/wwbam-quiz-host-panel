// src/components/game/InitializeGameModal.jsx

import { useState, useEffect } from 'react';
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
import { databaseService } from '@services/database.service';
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

  // Question sets metadata state
  const [questionSetsMetadata, setQuestionSetsMetadata] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Store actions
  const initializeGame = useGameStore((state) => state.initializeGame);
  const teamsObject = useTeamsStore((state) => state.teams);

  // Get teams
  const teams = Object.values(teamsObject || {});

  // Load question sets metadata from Firebase when modal opens
  useEffect(() => {
    if (open) {
      const loadMetadata = async () => {
        setIsLoadingMetadata(true);
        try {
          const metadata = await databaseService.getQuestionSetsMetadata();
          setQuestionSetsMetadata(metadata.sets || []);
        } catch (err) {
          console.error('Failed to load question sets metadata:', err);
          setQuestionSetsMetadata([]);
          setError('Failed to load question sets from Firebase');
        } finally {
          setIsLoadingMetadata(false);
        }
      };

      loadMetadata();
    }
  }, [open]);

  /**
   * Handle initialization process
   */
  const handleInitialize = async () => {
    setStage('processing');
    setError(null);

    try {
      // Step 1: Generate play queue and assignments locally
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate shuffling
      const result = generatePlayQueue(teams, questionSetsMetadata);

      console.log('Generated play queue result:', result);

      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      // Step 2: Save to store AND Firebase
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate saving

      const initResult = await initializeGame(
        result.playQueue,
        result.questionSetAssignments,
      );

      // Check if Firebase sync succeeded
      if (!initResult.success) {
        throw new Error(initResult.error || 'Failed to sync with Firebase');
      }

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
    setError(null);
    setPlayQueuePreview([]);
    onOpenChange(false);
  };

  /**
   * Handle done (after results shown)
   */
  const handleDone = () => {
    handleClose();
    // Page will auto-refresh due to game state change
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-h-[90vh]">
        {/* STAGE 1: PREVIEW */}
        {stage === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shuffle className="w-5 h-5" />
                Initialize Game
              </DialogTitle>
              <DialogDescription>
                Generate random play order and assign question sets to teams
              </DialogDescription>
            </DialogHeader>

            {isLoadingMetadata ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner text="Loading question sets from Firebase..." />
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Teams</span>
                    </div>
                    <p className="text-2xl font-bold">{teams.length}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FileJson className="w-4 h-4" />
                      <span className="text-sm">Question Sets</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {questionSetsMetadata.length}
                    </p>
                  </div>
                </div>

                {/* Info Alert */}
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Ready to Initialize</AlertTitle>
                  <AlertDescription>
                    Teams will be randomly shuffled to create the play order.
                    Each team will be assigned a unique question set.
                  </AlertDescription>
                </Alert>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Initialization Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleInitialize}
                disabled={
                  teams.length === 0 ||
                  questionSetsMetadata.length === 0 ||
                  isLoadingMetadata
                }>
                <Shuffle className="w-4 h-4 mr-2" />
                Initialize Game
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STAGE 2: PROCESSING */}
        {stage === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle>Initializing Game...</DialogTitle>
              <DialogDescription>
                Generating play queue and syncing to Firebase
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Processing..." />
              <p className="text-sm text-muted-foreground mt-4">
                This will only take a moment
              </p>
            </div>
          </>
        )}

        {/* STAGE 3: RESULTS */}
        {stage === 'results' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Game Initialized Successfully!
              </DialogTitle>
              <DialogDescription>
                Play order generated and saved to Firebase
              </DialogDescription>
            </DialogHeader>

            {/* Success Alert */}
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success!</AlertTitle>
              <AlertDescription className="text-green-600">
                {playQueuePreview.length} teams shuffled and ready to compete
              </AlertDescription>
            </Alert>

            {/* Play Queue Preview */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Generated Play Order
              </h3>
              <ScrollArea className="h-[300px] pr-4">
                <PlayQueueDisplay
                  playQueuePreview={playQueuePreview}
                  showHeader={false}
                />
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button onClick={handleDone} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
